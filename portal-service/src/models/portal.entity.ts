export type TraditionType = "raksha" | "sanni" | "kolam";
export type ListingStatus = "draft" | "minted" | "pending_review" | "published";
export type BenchOrderStatus = "In carving" | "Hand-over Friday" | "Export papers" | "Delivered";

export interface BlockchainMetadata {
  chain: "Polygon";
  contractAddress: string;
  tokenId: string;
  transactionHash: string;
  ipfsMetadataUri: string;
  assetSha256: string;
  blockNumber: number;
}

export interface NfcMetadata {
  tagUid: string;
  verificationUrl: string;
  counter: number;
}

export interface PortalListingDoc {
  id: string;
  maskSlug: string;
  name: string;
  artisanSlug: string;
  tradition: TraditionType;
  woodSpecies: string;
  priceLKR: number;
  stock: number;
  photos: string[];
  scanUrl?: string;
  scanProgress: number;
  mintStage: number; // -1: unstarted, 0-4: steps completed
  minted: boolean;
  certificateId?: string;
  status: ListingStatus;
  blockchain?: BlockchainMetadata;
  nfc?: NfcMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BenchOrderDoc {
  id: string; // e.g. "MM-ORD-3358"
  orderId: string;
  piece: string;
  maskSlug: string;
  buyer: string; // e.g. "Colombo 07", "Berlin", "Kyoto"
  artisanSlug: string;
  status: BenchOrderStatus;
  settlementShareLKR: number;
  deadline?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArtisanOnboardingDoc {
  artisanSlug: string;
  language: "en" | "si" | "ta";
  village: string;
  tradition: TraditionType;
  firstPhotoUrl: string;
  makerStampCreated: boolean;
  makerStampHash: string;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettlementRecordDoc {
  id: string;
  orderId: string;
  artisanSlug: string;
  pieceName: string;
  grossAmountLKR: number;
  artisanCutLKR: number; // 61%
  settlementPercent: number; // 61
  status: "settled" | "pending";
  settledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PortalDashboardStats {
  settledThisMonthLKR: number;
  lifetimeRegistryRevenueLKR: number;
  ordersOnBench: number;
  certificateScans30Days: number;
}
