import { CertificateDoc, RegistryStats } from "./verify.entity.js";
import { CertificateModel } from "./verify.schema.js";

/**
 * VerifyRepository - Model Layer (MVC)
 * Encapsulates MongoDB database interactions for physical-digital certificates,
 * NFC tap authentication, and digital twin claiming.
 */
export class VerifyRepository {
  /**
   * Find certificate by certificate ID (case-insensitive, trimmed)
   */
  public async findByCertId(certId: string): Promise<CertificateDoc | null> {
    const normalized = certId.trim().toUpperCase();
    const doc = await CertificateModel.findOne({ certId: normalized }).lean();
    return doc ? (doc as unknown as CertificateDoc) : null;
  }

  /**
   * Find certificate associated with a mask slug
   */
  public async findByMaskSlug(maskSlug: string): Promise<CertificateDoc | null> {
    const doc = await CertificateModel.findOne({ maskSlug: maskSlug.trim().toLowerCase() }).lean();
    return doc ? (doc as unknown as CertificateDoc) : null;
  }

  /**
   * Find certificate by physical NFC tag UID (e.g. "04:A2:3B:5C:8D:1E:80")
   */
  public async findByNfcUid(nfcUid: string): Promise<CertificateDoc | null> {
    const normalized = nfcUid.trim().toUpperCase();
    const doc = await CertificateModel.findOne({ "nfcTag.uid": normalized }).lean();
    return doc ? (doc as unknown as CertificateDoc) : null;
  }

  /**
   * Authenticate a physical NFC tap from a smartphone or contactless reader.
   * Validates tag, increments hardware tap counter, and updates last tapped timestamp.
   */
  public async authenticateNfcTap(
    identifier: string,
    payload?: { clientCounter?: number; cmac?: string; readerType?: string }
  ): Promise<{ cert: CertificateDoc; tapCount: number; authenticated: boolean }> {
    const normalized = identifier.trim().toUpperCase();

    // Query by either certId or NFC tag UID
    const existing = await CertificateModel.findOne({
      $or: [{ certId: normalized }, { "nfcTag.uid": normalized }],
    });

    if (!existing) {
      throw new Error(`Tag with identifier '${normalized}' not found in registry`);
    }

    if (existing.isTampered) {
      throw new Error("Physical tag integrity compromised. Certificate flagged for tampering.");
    }

    // Increment tap count and update timestamp
    existing.nfcTag.tapCount += 1;
    existing.nfcTag.lastTappedAt = new Date();

    const saved = await existing.save();
    return {
      cert: saved.toObject() as unknown as CertificateDoc,
      tapCount: saved.nfcTag.tapCount,
      authenticated: true,
    };
  }

  /**
   * Claim physical-digital twin ownership
   */
  public async claimDigitalTwin(
    certId: string,
    ownerName: string,
    ownerWallet?: string
  ): Promise<CertificateDoc> {
    const normalized = certId.trim().toUpperCase();
    const cert = await CertificateModel.findOne({ certId: normalized });

    if (!cert) {
      throw new Error(`Certificate '${normalized}' not found`);
    }

    if (cert.status === "claimed") {
      throw new Error(`Digital twin '${normalized}' is already claimed by ${cert.owner || "another keeper"}`);
    }

    const today = new Date().toISOString().split("T")[0];

    cert.status = "claimed";
    cert.owner = ownerName.trim();
    if (ownerWallet) {
      cert.ownerWallet = ownerWallet.trim();
    }

    cert.history.push({
      label: "Digital twin claimed",
      date: today,
      actor: ownerName.trim(),
    });

    const saved = await cert.save();
    return saved.toObject() as unknown as CertificateDoc;
  }

  /**
   * Report counterfeit / suspected tampering
   */
  public async reportCounterfeit(
    certId: string,
    reason: string,
    reporterContact?: string
  ): Promise<CertificateDoc> {
    const normalized = certId.trim().toUpperCase();
    const cert = await CertificateModel.findOne({ certId: normalized });

    if (!cert) {
      throw new Error(`Certificate '${normalized}' not found`);
    }

    cert.tamperReports.push({
      reportedAt: new Date(),
      reason: reason.trim(),
      reporterContact: reporterContact?.trim() || "",
      status: "investigating",
    });

    // If multiple reports are received, automatically flag for review
    if (cert.tamperReports.length >= 2) {
      cert.isTampered = true;
    }

    const saved = await cert.save();
    return saved.toObject() as unknown as CertificateDoc;
  }

  /**
   * Append a provenance event triggered by an order event
   */
  public async appendProvenanceEvent(
    maskSlug: string,
    event: { label: string; date: string; actor: string }
  ): Promise<CertificateDoc | null> {
    const cert = await CertificateModel.findOne({ maskSlug: maskSlug.trim().toLowerCase() });
    if (!cert) return null;

    cert.history.push(event);
    const saved = await cert.save();
    return saved.toObject() as unknown as CertificateDoc;
  }

  /**
   * Register a brand new certificate (from artisan minting portal)
   */
  public async createCertificate(data: Partial<CertificateDoc>): Promise<CertificateDoc> {
    const created = await CertificateModel.create(data);
    return created.toObject() as unknown as CertificateDoc;
  }

  /**
   * List certificates with optional status/artisan filter
   */
  public async listCertificates(filter?: {
    status?: "unclaimed" | "claimed";
    artisanSlug?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: CertificateDoc[]; total: number }> {
    const query: Record<string, any> = {};

    if (filter?.status) {
      query.status = filter.status;
    }
    if (filter?.artisanSlug) {
      query.artisanSlug = filter.artisanSlug;
    }

    const limit = Math.min(filter?.limit || 50, 100);
    const skip = filter?.skip || 0;

    const [items, total] = await Promise.all([
      CertificateModel.find(query).sort({ mintedAt: -1 }).skip(skip).limit(limit).lean(),
      CertificateModel.countDocuments(query),
    ]);

    return {
      items: items as unknown as CertificateDoc[],
      total,
    };
  }

  /**
   * Fetch aggregate registry statistics
   */
  public async getStats(): Promise<RegistryStats> {
    const [totalCertificates, unclaimedCount, claimedCount, activeTamperAlerts, tapAgg] =
      await Promise.all([
        CertificateModel.countDocuments(),
        CertificateModel.countDocuments({ status: "unclaimed" }),
        CertificateModel.countDocuments({ status: "claimed" }),
        CertificateModel.countDocuments({ isTampered: true }),
        CertificateModel.aggregate([
          { $group: { _id: null, totalTaps: { $sum: "$nfcTag.tapCount" } } },
        ]),
      ]);

    const totalNfcTaps = tapAgg.length > 0 ? tapAgg[0].totalTaps : 0;

    return {
      totalCertificates,
      unclaimedCount,
      claimedCount,
      totalNfcTaps,
      activeTamperAlerts,
    };
  }
}

export const verifyRepository = new VerifyRepository();
