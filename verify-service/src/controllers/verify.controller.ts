import { Request, Response, NextFunction } from "express";
import { verifyRepository } from "../models/verify.repository.js";
import { VerifyView } from "../views/verify.view.js";
import { CertificateDoc } from "../models/verify.entity.js";
import { VerifyEventConsumer } from "../config/rabbitmq.js";
import {
  CertIdParamSchema,
  ClaimTwinBodySchema,
  CreateCertificateBodySchema,
  ListCertificatesQuerySchema,
  MaskSlugParamSchema,
  NfcAuthBodySchema,
  ReportTamperBodySchema,
} from "../views/verify.dto.js";

/**
 * VerifyController - Controller Layer (MVC)
 * Coordinates HTTP requests, validation schemas, repository interactions,
 * and View formatting for NFC/QR tag authentication.
 */
export class VerifyController {
  /**
   * GET /api/verify/:certId
   * Primary verification lookup called by QR codes, NFC redirects, or manual entry.
   */
  public static async verifyCert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { certId } = CertIdParamSchema.parse(req.params);
      const cert = await verifyRepository.findByCertId(certId);

      if (!cert) {
        res.status(200).json(VerifyView.renderNotFound(certId));
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
      res.status(200).json(VerifyView.renderVerification(cert));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/verify/mask/:maskSlug
   * Lookup certificate corresponding to a specific catalog mask slug.
   */
  public static async verifyByMask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { maskSlug } = MaskSlugParamSchema.parse(req.params);
      const cert = await verifyRepository.findByMaskSlug(maskSlug);

      if (!cert) {
        res.status(404).json({
          error: "Not Found",
          message: `No active certificate registered for mask '${maskSlug}'`,
        });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=120");
      res.status(200).json(VerifyView.renderVerification(cert));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/verify/nfc/authenticate
   * Direct NFC hardware tap authentication endpoint.
   * Increments the physical tag tap counter and logs the read.
   */
  public static async authenticateNfc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tagId, counter, cmac, readerType } = NfcAuthBodySchema.parse(req.body);

      const result = await verifyRepository.authenticateNfcTap(tagId, {
        clientCounter: counter,
        cmac,
        readerType,
      });

      res.status(200).json(VerifyView.renderNfcAuthSuccess(result.cert, result.tapCount));
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        res.status(404).json({ error: "Not Found", message: error.message });
        return;
      }
      if (error.message?.includes("tampering")) {
        res.status(403).json({ error: "TamperedTag", message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/verify/:certId/claim
   * Claim digital twin ownership after receiving the physical mask.
   */
  public static async claimTwin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { certId } = CertIdParamSchema.parse(req.params);
      const { ownerName, ownerWallet } = ClaimTwinBodySchema.parse(req.body);

      const updated = await verifyRepository.claimDigitalTwin(certId, ownerName, ownerWallet);
      await VerifyEventConsumer.publish("twin.claimed", {
        certId: updated.certId,
        maskSlug: updated.maskSlug,
        artisanSlug: updated.artisanSlug,
        ownerName: updated.owner,
        ownerWallet: updated.ownerWallet,
        claimedAt: new Date().toISOString(),
      });
      res.status(200).json(VerifyView.renderClaimReceipt(updated));
    } catch (error: any) {
      if (error.message?.includes("already claimed")) {
        res.status(409).json({ error: "Conflict", message: error.message });
        return;
      }
      if (error.message?.includes("not found")) {
        res.status(404).json({ error: "Not Found", message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/verify/:certId/report
   * Report potential counterfeit or damaged/cloned NFC tag.
   */
  public static async reportTamper(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { certId } = CertIdParamSchema.parse(req.params);
      const { reason, reporterContact } = ReportTamperBodySchema.parse(req.body);

      const updated = await verifyRepository.reportCounterfeit(certId, reason, reporterContact);

      res.status(200).json({
        message: "Counterfeit report logged into registry. Our preservation curators review reports within 48 hours.",
        certId: updated.certId,
        isFlagged: updated.isTampered,
        totalReports: updated.tamperReports.length,
      });
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        res.status(404).json({ error: "Not Found", message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/verify
   * Register/mint a new certificate into the registry.
   */
  public static async registerCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = CreateCertificateBodySchema.parse(req.body);
      const existing = await verifyRepository.findByCertId(payload.certId);

      if (existing) {
        res.status(409).json({
          error: "Conflict",
          message: `Certificate with code '${payload.certId}' is already registered`,
        });
        return;
      }

      // Auto-set QR code URL if not provided
      const completeData: Partial<CertificateDoc> = {
        ...payload,
        qrCodeUrl: payload.qrCodeUrl || `https://maskandmaker.com/verify/${payload.certId}`,
        nfcTag: payload.nfcTag
          ? {
              ...payload.nfcTag,
              lastTappedAt: null,
            }
          : {
              uid: `04:${Math.random().toString(16).substring(2, 4).toUpperCase()}:${Math.random().toString(16).substring(2, 4).toUpperCase()}:80`,
              standard: "NTAG424_DNA" as const,
              tapCount: 0,
              lastTappedAt: null,
              batch: "AMB-2025-B1",
            },
      };

      const created = await verifyRepository.createCertificate(completeData);
      res.status(201).json(VerifyView.renderVerification(created));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/verify
   * List all registered certificates.
   */
  public static async listCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ListCertificatesQuerySchema.parse(req.query);
      const { items, total } = await verifyRepository.listCertificates(query);

      res.setHeader("Cache-Control", "public, max-age=60");
      res.status(200).json({
        total,
        count: items.length,
        certificates: items.map((c) => VerifyView.renderVerification(c)),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/verify/stats
   * Aggregate statistics for the verification registry.
   */
  public static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await verifyRepository.getStats();
      res.setHeader("Cache-Control", "public, max-age=30");
      res.status(200).json(VerifyView.renderStats(stats));
    } catch (error) {
      next(error);
    }
  }
}
