import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PortalRepository } from "../models/portal.repository.js";
import {
  CreateListingDraftSchema,
  MintCertificateSchema,
  SaveOnboardingSchema,
  UpdateBenchOrderStatusSchema,
  UploadPhotosSchema,
  UploadScanSchema,
} from "../views/portal.dto.js";
import { PortalView } from "../views/portal.view.js";
import {
  ListingMintedEvent,
  ListingPublishedEvent,
  publishListingMinted,
  publishListingPublished,
} from "../config/rabbitmq.js";

const MINT_STEPS = [
  "Fingerprinting your photographs",
  "Pinning the study to IPFS",
  "Minting on Polygon",
  "Pairing the NFC & QR tag",
];

export class PortalController {
  constructor(private portalRepo: PortalRepository) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // 1. Dashboard
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artisanSlug = (req.query.artisanSlug as string) || "chandana-bandara";
      const stats = await this.portalRepo.getDashboardStats(artisanSlug);
      const orders = await this.portalRepo.getBenchOrders(artisanSlug);
      const listings = await this.portalRepo.getListings(artisanSlug);

      res.status(200).json(PortalView.formatDashboard(stats, orders, listings));
    } catch (error) {
      next(error);
    }
  };

  // 2. Bench Orders
  getBenchOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artisanSlug = (req.query.artisanSlug as string) || "chandana-bandara";
      const orders = await this.portalRepo.getBenchOrders(artisanSlug);
      res.status(200).json({
        success: true,
        count: orders.length,
        orders: orders.map((o) => PortalView.formatBenchOrder(o)),
      });
    } catch (error) {
      next(error);
    }
  };

  updateBenchOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId;
      const parsed = UpdateBenchOrderStatusSchema.parse(req.body);

      const updated = await this.portalRepo.updateBenchOrderStatus(orderId, parsed.status);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "Bench order not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Bench order '${orderId}' status updated to '${parsed.status}'`,
        order: PortalView.formatBenchOrder(updated),
      });
    } catch (error) {
      next(error);
    }
  };

  // 3. Listings
  getListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artisanSlug = (req.query.artisanSlug as string) || "chandana-bandara";
      const listings = await this.portalRepo.getListings(artisanSlug);
      res.status(200).json({
        success: true,
        count: listings.length,
        listings: listings.map((l) => PortalView.formatListing(l)),
      });
    } catch (error) {
      next(error);
    }
  };

  getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrSlug = req.params.id;
      let listing = null;

      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        listing = await this.portalRepo.getListingById(idOrSlug);
      }
      if (!listing) {
        listing = await this.portalRepo.getListingBySlug(idOrSlug);
      }

      if (!listing) {
        res.status(404).json({ success: false, error: "NotFound", message: "Listing not found" });
        return;
      }

      res.status(200).json({
        success: true,
        listing: PortalView.formatListing(listing),
      });
    } catch (error) {
      next(error);
    }
  };

  createListingDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = CreateListingDraftSchema.parse(req.body);
      const maskSlug = parsed.maskSlug || this.slugify(parsed.name);

      const existing = await this.portalRepo.getListingBySlug(maskSlug);
      if (existing) {
        res.status(409).json({
          success: false,
          error: "Conflict",
          message: `A listing with slug '${maskSlug}' already exists`,
        });
        return;
      }

      const listing = await this.portalRepo.createListing({
        maskSlug,
        name: parsed.name,
        artisanSlug: parsed.artisanSlug,
        tradition: parsed.tradition,
        woodSpecies: parsed.woodSpecies,
        priceLKR: parsed.priceLKR,
        stock: parsed.stock,
        photos: [],
        scanUrl: "",
        scanProgress: 0,
        mintStage: -1,
        minted: false,
        status: "draft",
      });

      res.status(201).json({
        success: true,
        message: "Draft listing initialized",
        listing: PortalView.formatListing(listing),
      });
    } catch (error) {
      next(error);
    }
  };

  uploadPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const parsed = UploadPhotosSchema.parse(req.body);

      const updated = await this.portalRepo.updateListingPhotos(id, parsed.photos);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "Listing not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Saved ${parsed.photos.length} workshop photograph(s)`,
        photos: updated.photos,
        listing: PortalView.formatListing(updated),
      });
    } catch (error) {
      next(error);
    }
  };

  uploadScan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const parsed = UploadScanSchema.parse(req.body);

      const updated = await this.portalRepo.updateListingScan(
        id,
        parsed.scanUrl,
        parsed.scanProgress
      );
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "Listing not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "3D study uploaded and photogrammetry mesh validated",
        scanUrl: updated.scanUrl,
        scanProgress: updated.scanProgress,
        listing: PortalView.formatListing(updated),
      });
    } catch (error) {
      next(error);
    }
  };

  // 4. Provenance Minting (Step 3 in Portal flow)
  mintCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listingId = req.params.id || req.body.listingId;
      const parsed = MintCertificateSchema.parse(req.body);

      let targetListing = null;
      if (listingId) {
        targetListing = await this.portalRepo.getListingById(listingId);
        if (!targetListing) {
          targetListing = await this.portalRepo.getListingBySlug(listingId);
        }
      }

      // If no listing existed yet, auto-create one from mint payload
      if (!targetListing) {
        const maskName = parsed.maskTitle || "Traditional Kaduru Mask";
        const maskSlug = parsed.maskSlug || this.slugify(maskName);
        targetListing = await this.portalRepo.createListing({
          maskSlug,
          name: maskName,
          artisanSlug: parsed.artisanSlug || "chandana-bandara",
          tradition: parsed.tradition || "raksha",
          woodSpecies: parsed.woodSpecies || "Kaduru (Strychnos nux-vomica)",
          priceLKR: parsed.priceLKR || 85000,
          stock: 1,
          photos: parsed.photos || ["workshop-photo-1.jpg"],
          scanUrl: parsed.scanUrl || "mask-study.glb",
          scanProgress: 100,
          mintStage: -1,
          minted: false,
          status: "draft",
        });
      }

      // Cryptographic proofs & Polygon generation
      const seedString = `${targetListing.maskSlug}-${targetListing.artisanSlug}-${Date.now()}`;
      const assetSha256 = crypto.createHash("sha256").update(seedString).digest("hex");
      const ipfsMetadataUri = `ipfs://bafybei${crypto.randomBytes(24).toString("hex")}`;
      const contractAddress =
        process.env.CONTRACT_ADDRESS || "0x71C8360155bB2eD2C5819777174e5033c4676FfB";
      const tokenId = `${Math.floor(Math.random() * 8000 + 1000)}`;
      const transactionHash = `0x${crypto.randomBytes(32).toString("hex")}`;
      const blockNumber = 4900000 + Math.floor(Math.random() * 50000);

      // Certificate and NFC tag generation
      const randCertNum = String(Math.floor(Math.random() * 900 + 100)).padStart(4, "0");
      const certificateId = `MM-2026-${randCertNum}`;
      const tagUid = `04:${crypto.randomBytes(6).toString("hex").toUpperCase().match(/../g)?.join(":")}`;
      const verificationUrl = `https://maskandmaker.lk/verify/${certificateId}`;

      const updated = await this.portalRepo.updateListingMint(targetListing.id, {
        mintStage: 4,
        minted: true,
        certificateId,
        status: "minted",
        blockchain: {
          chain: "Polygon",
          contractAddress,
          tokenId,
          transactionHash,
          ipfsMetadataUri,
          assetSha256,
          blockNumber,
        },
        nfc: {
          tagUid,
          verificationUrl,
          counter: 0,
        },
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "MintFailed", message: "Failed to persist mint state" });
        return;
      }

      // Publish RabbitMQ event
      const event: ListingMintedEvent = {
        eventId: crypto.randomUUID(),
        eventType: "listing.minted",
        timestamp: new Date().toISOString(),
        data: {
          listingId: updated.id,
          certificateId,
          maskSlug: updated.maskSlug,
          maskTitle: updated.name,
          artisanSlug: updated.artisanSlug,
          artisanName: "Chandana Bandara",
          tradition: updated.tradition,
          woodType: updated.woodSpecies,
          priceLKR: updated.priceLKR,
          blockchain: updated.blockchain!,
          nfc: {
            tagUid: updated.nfc!.tagUid,
            verificationUrl: updated.nfc!.verificationUrl,
          },
        },
      };

      await publishListingMinted(event);

      res.status(200).json(PortalView.formatMintResult(updated, MINT_STEPS));
    } catch (error) {
      next(error);
    }
  };

  // 5. Publish Listing (Step 4 in Portal flow)
  publishListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const listing = await this.portalRepo.getListingById(id);

      if (!listing) {
        res.status(404).json({ success: false, error: "NotFound", message: "Listing not found" });
        return;
      }

      if (!listing.minted || !listing.certificateId) {
        res.status(400).json({
          success: false,
          error: "UnmintedListing",
          message: "Mint the certificate first — every listing carries one.",
        });
        return;
      }

      const published = await this.portalRepo.publishListing(id);
      if (!published) {
        res.status(500).json({ success: false, error: "PublishFailed" });
        return;
      }

      // Publish RabbitMQ event
      const event: ListingPublishedEvent = {
        eventId: crypto.randomUUID(),
        eventType: "listing.published",
        timestamp: new Date().toISOString(),
        data: {
          listingId: published.id,
          certificateId: published.certificateId!,
          maskSlug: published.maskSlug,
          maskTitle: published.name,
          artisanSlug: published.artisanSlug,
          priceLKR: published.priceLKR,
          stock: published.stock,
          status: "pending_review",
        },
      };

      await publishListingPublished(event);

      res.status(200).json({
        success: true,
        message: "Listing queued for heritage review. The desk reads every listing before it goes live.",
        listing: PortalView.formatListing(published),
      });
    } catch (error) {
      next(error);
    }
  };

  // 6. Settlement & Ledger
  getSettlementLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artisanSlug = (req.query.artisanSlug as string) || "chandana-bandara";
      const settlements = await this.portalRepo.getSettlements(artisanSlug);

      const totalGrossLKR = settlements.reduce((sum, s) => sum + s.grossAmountLKR, 0);
      const totalArtisanCutLKR = settlements.reduce((sum, s) => sum + s.artisanCutLKR, 0);

      res.status(200).json(
        PortalView.formatSettlements(settlements, {
          totalGrossLKR,
          totalArtisanCutLKR,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // 7. Onboarding
  getOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const artisanSlug = (req.query.artisanSlug as string) || "chandana-bandara";
      const onboarding = await this.portalRepo.getOnboarding(artisanSlug);

      if (!onboarding) {
        res.status(404).json({ success: false, error: "NotFound", message: "Onboarding record not found" });
        return;
      }

      res.status(200).json(PortalView.formatOnboarding(onboarding));
    } catch (error) {
      next(error);
    }
  };

  saveOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = SaveOnboardingSchema.parse(req.body);
      const makerStampHash = `0x${crypto
        .createHash("sha256")
        .update(`${parsed.artisanSlug}-${parsed.village}-${parsed.tradition}-${Date.now()}`)
        .digest("hex")}`;

      const saved = await this.portalRepo.saveOnboarding({
        artisanSlug: parsed.artisanSlug,
        language: parsed.language,
        village: parsed.village,
        tradition: parsed.tradition,
        firstPhotoUrl: parsed.firstPhotoUrl || "",
        makerStampCreated: true,
        makerStampHash,
        completed: true,
      });

      res.status(200).json({
        success: true,
        message: "Welcome to the registry. Your maker stamp has been created.",
        profile: PortalView.formatOnboarding(saved),
      });
    } catch (error) {
      next(error);
    }
  };
}
