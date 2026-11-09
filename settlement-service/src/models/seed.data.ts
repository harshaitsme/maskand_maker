import { SettlementTransaction } from "./settlement.entity.js";

export const initialSettlements: SettlementTransaction[] = [
  // 1. Maha Kola Sanni Yaka - Chandana Bandara
  {
    id: "SET-2026-001",
    transactionType: "primary_sale",
    orderId: "ORD-2026-8810",
    maskSlug: "maha-kola-sanni-yaka",
    maskTitle: "Maha Kola Sanni Yaka (Chief Exorcism Visage)",
    artisanSlug: "chandana-bandara",
    grossAmountLKR: 320000,
    artisanCutLKR: 195200, // 61%
    reforestationCutLKR: 60800, // 19%
    guildCutLKR: 38400, // 12%
    platformCutLKR: 25600, // 8%
    status: "settled",
    payoutMethod: "bank_transfer",
    payoutDetails: {
      bankName: "Bank of Ceylon (BOC)",
      accountNumber: "7820194812",
      accountHolder: "W. A. Chandana Bandara",
      branchName: "Ambalangoda Branch",
      referenceNote: "M&M Heritage Payout #001",
    },
    createdAt: new Date("2026-10-15T10:30:00Z"),
    settledAt: new Date("2026-10-18T14:00:00Z"),
  },
  // 2. Gurulu Raksha Mask - Chandana Bandara
  {
    id: "SET-2026-002",
    transactionType: "primary_sale",
    orderId: "ORD-2026-8814",
    maskSlug: "gurulu-raksha",
    maskTitle: "Gurulu Raksha (Eagle Solar Guardian)",
    artisanSlug: "chandana-bandara",
    grossAmountLKR: 95000,
    artisanCutLKR: 57950, // 61%
    reforestationCutLKR: 18050, // 19%
    guildCutLKR: 11400, // 12%
    platformCutLKR: 7600, // 8%
    status: "available",
    createdAt: new Date("2026-11-01T08:15:00Z"),
  },
  // 3. EIP-2981 Secondary Royalty on OpenSea/Polygon - Chandana Bandara
  {
    id: "SET-2026-003",
    transactionType: "secondary_royalty",
    maskSlug: "maha-kola-sanni-yaka",
    maskTitle: "Maha Kola Sanni Yaka (Digital Provenance Resale)",
    artisanSlug: "chandana-bandara",
    grossAmountLKR: 450000,
    artisanCutLKR: 33750, // 7.5% EIP-2981 royalty
    reforestationCutLKR: 11250, // 2.5% heritage foundation
    guildCutLKR: 0,
    platformCutLKR: 0,
    status: "settled",
    payoutMethod: "polygon_crypto",
    payoutDetails: {
      walletAddress: "0x3B6C90812F6e1864cD4f9811C6118D60C92d346F",
      polygonTxHash: "0x89ab10f234901cb00192df8940bbd234857102e3b2c1f0194801cdaee92418a1",
      referenceNote: "Polygon Amoy EIP-2981 Royalty Dispensation",
    },
    onChainTxHash: "0x89ab10f234901cb00192df8940bbd234857102e3b2c1f0194801cdaee92418a1",
    createdAt: new Date("2026-11-04T12:00:00Z"),
    settledAt: new Date("2026-11-04T12:05:00Z"),
  },
  // 4. Ginidal Raksha - Piyal Wickramasinghe
  {
    id: "SET-2026-004",
    transactionType: "primary_sale",
    orderId: "ORD-2026-8902",
    maskSlug: "ginidal-raksha",
    maskTitle: "Ginidal Raksha (Fire Demon Face)",
    artisanSlug: "piyal-wickramasinghe",
    grossAmountLKR: 85000,
    artisanCutLKR: 51850, // 61%
    reforestationCutLKR: 16150, // 19%
    guildCutLKR: 10200, // 12%
    platformCutLKR: 6800, // 8%
    status: "settled",
    payoutMethod: "bank_transfer",
    payoutDetails: {
      bankName: "Commercial Bank of Ceylon",
      accountNumber: "8001928419",
      accountHolder: "Piyal Wickramasinghe",
      branchName: "Balapitiya Branch",
      referenceNote: "M&M Fire Raksha Payout",
    },
    createdAt: new Date("2026-10-20T16:20:00Z"),
    settledAt: new Date("2026-10-23T11:00:00Z"),
  },
  // 5. Maru Raksha - Piyal Wickramasinghe (In Escrow)
  {
    id: "SET-2026-005",
    transactionType: "primary_sale",
    orderId: "ORD-2026-9011",
    maskSlug: "maru-raksha",
    maskTitle: "Maru Raksha (Demon of Death Guardian)",
    artisanSlug: "piyal-wickramasinghe",
    grossAmountLKR: 110000,
    artisanCutLKR: 67100, // 61%
    reforestationCutLKR: 20900, // 19%
    guildCutLKR: 13200, // 12%
    platformCutLKR: 8800, // 8%
    status: "escrow",
    createdAt: new Date("2026-11-08T09:40:00Z"),
  },
  // 6. Deva Sanni Yaka - Dayawansa Kalutara
  {
    id: "SET-2026-006",
    transactionType: "primary_sale",
    orderId: "ORD-2026-8994",
    maskSlug: "deva-sanni-yaka",
    maskTitle: "Deva Sanni Yaka (Divine Healing Visage)",
    artisanSlug: "dayawansa-kalutara",
    grossAmountLKR: 72000,
    artisanCutLKR: 43920, // 61%
    reforestationCutLKR: 13680, // 19%
    guildCutLKR: 8640, // 12%
    platformCutLKR: 5760, // 8%
    status: "available",
    createdAt: new Date("2026-11-06T14:10:00Z"),
  },
];
