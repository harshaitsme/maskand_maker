import {
  ArtisanOnboardingDoc,
  BenchOrderDoc,
  PortalDashboardStats,
  PortalListingDoc,
  SettlementRecordDoc,
} from "../models/portal.entity.js";

export class PortalView {
  static formatDashboard(
    stats: PortalDashboardStats,
    benchOrders: (BenchOrderDoc | any)[],
    listings: (PortalListingDoc | any)[]
  ) {
    return {
      success: true,
      stats: {
        settledThisMonthLKR: stats.settledThisMonthLKR,
        lifetimeRegistryRevenueLKR: stats.lifetimeRegistryRevenueLKR,
        ordersOnBench: stats.ordersOnBench,
        certificateScans30Days: stats.certificateScans30Days,
      },
      benchOrders: benchOrders.map((o) => PortalView.formatBenchOrder(o)),
      listings: listings.map((l) => PortalView.formatListing(l)),
      settlementNote: "Settlement: 61% of each sale lands within 14 days of order — visible in the bench ledger.",
      _links: {
        self: "/api/portal/dashboard",
        newListing: "/api/portal/listing",
        mintCertificate: "/api/portal/listing/mint",
        onboarding: "/api/portal/onboarding",
        ledger: "/api/portal/settlement/ledger",
      },
    };
  }

  static formatListing(doc: PortalListingDoc | any) {
    const raw = doc.toObject ? doc.toObject() : doc;
    const id = raw.id || raw._id?.toString() || "";

    return {
      id,
      maskSlug: raw.maskSlug,
      name: raw.name,
      artisanSlug: raw.artisanSlug,
      tradition: raw.tradition,
      woodSpecies: raw.woodSpecies,
      priceLKR: raw.priceLKR,
      stock: raw.stock,
      photos: raw.photos || [],
      scanUrl: raw.scanUrl || "",
      scanProgress: raw.scanProgress ?? 0,
      mintStage: raw.mintStage ?? -1,
      minted: raw.minted ?? false,
      certificateId: raw.certificateId || null,
      status: raw.status,
      blockchain: raw.blockchain || null,
      nfc: raw.nfc || null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      _links: {
        self: `/api/portal/listings/${id}`,
        mint: `/api/portal/listing/${id}/mint`,
        publish: `/api/portal/listing/${id}/publish`,
      },
    };
  }

  static formatMintResult(doc: PortalListingDoc | any, steps: string[]) {
    const raw = doc.toObject ? doc.toObject() : doc;
    const id = raw.id || raw._id?.toString() || "";

    return {
      success: true,
      message: "Certificate minted successfully on Polygon PoS",
      listingId: id,
      certificateId: raw.certificateId,
      maskSlug: raw.maskSlug,
      minted: true,
      steps: steps.map((label, idx) => ({
        stepNumber: idx + 1,
        label,
        state: "done",
      })),
      blockchain: raw.blockchain,
      nfc: raw.nfc,
      _links: {
        listing: `/api/portal/listings/${id}`,
        verifyCertificate: `/api/verify/${raw.certificateId}`,
        publish: `/api/portal/listing/${id}/publish`,
      },
    };
  }

  static formatBenchOrder(doc: BenchOrderDoc | any) {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      id: raw.orderId || raw.id,
      orderId: raw.orderId,
      piece: raw.piece,
      maskSlug: raw.maskSlug,
      buyer: raw.buyer,
      artisanSlug: raw.artisanSlug,
      status: raw.status,
      settlementShareLKR: raw.settlementShareLKR,
      deadline: raw.deadline,
      createdAt: raw.createdAt,
    };
  }

  static formatSettlements(
    settlements: (SettlementRecordDoc | any)[],
    summary: { totalGrossLKR: number; totalArtisanCutLKR: number }
  ) {
    return {
      success: true,
      summary: {
        ...summary,
        artisanFairSharePercentage: 61,
        settlementPolicy: "61% of each sale settles with the workshop within 14 days.",
      },
      records: settlements.map((s: any) => {
        const raw = s.toObject ? s.toObject() : s;
        return {
          id: raw.id || raw._id?.toString(),
          orderId: raw.orderId,
          pieceName: raw.pieceName,
          grossAmountLKR: raw.grossAmountLKR,
          artisanCutLKR: raw.artisanCutLKR,
          settlementPercent: raw.settlementPercent,
          status: raw.status,
          settledAt: raw.settledAt,
          createdAt: raw.createdAt,
        };
      }),
    };
  }

  static formatOnboarding(doc: ArtisanOnboardingDoc | any) {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      success: true,
      artisanSlug: raw.artisanSlug,
      language: raw.language,
      village: raw.village,
      tradition: raw.tradition,
      firstPhotoUrl: raw.firstPhotoUrl,
      makerStampCreated: raw.makerStampCreated,
      makerStampHash: raw.makerStampHash,
      completed: raw.completed,
    };
  }

  static formatSuccess(message: string, data?: any) {
    return {
      success: true,
      message,
      ...(data ? { data } : {}),
    };
  }
}
