export interface CertificateEvent {
  label: string;
  date: string;
  actor: string;
}

export interface NfcTagData {
  uid: string; // 7-byte hex string, e.g. "04:A2:3B:5C:8D:1E:80"
  standard: "NTAG424_DNA" | "NTAG213" | "NTAG215";
  tapCount: number;
  lastTappedAt: Date | null;
  batch: string;
}

export interface TamperReport {
  reportedAt: Date;
  reason: string;
  reporterContact?: string;
  status: "investigating" | "resolved";
}

export interface CertificateDoc {
  certId: string; // e.g. "MM-2024-0117"
  maskSlug: string; // e.g. "gini-raksha"
  maskName: string; // e.g. "Gini Raksha"
  artisanSlug: string; // e.g. "chandana-bandara"
  artisanName: string; // e.g. "Chandana Bandara"
  mintedAt: string; // e.g. "2024-03-11"
  status: "unclaimed" | "claimed";
  chain: "Polygon";
  contractAddress: string;
  tokenId: string; // e.g. "42161 · #0117"
  ipfsUri: string; // e.g. "ipfs://bafybeic4v7pd9aw72xqm2..."
  owner: string | null; // e.g. "R. Jayasuriya · Colombo 07"
  ownerWallet: string | null;
  history: CertificateEvent[];
  qrCodeUrl: string; // e.g. "https://maskandmaker.com/verify/MM-2024-0117"
  nfcTag: NfcTagData;
  artisanSignature: string; // Cryptographic signature
  hashProof: string; // SHA-256 hash of photogrammetry mesh + craft measurements
  isTampered: boolean;
  tamperReports: TamperReport[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VerificationStatus {
  onChainVerified: boolean;
  nfcVerified: boolean;
  physicalTagIntact: boolean;
  signatureMatchesMaker: boolean;
  explorerUrl: string;
  ipfsGatewayUrl: string;
}

export interface RegistryStats {
  totalCertificates: number;
  unclaimedCount: number;
  claimedCount: number;
  totalNfcTaps: number;
  activeTamperAlerts: number;
}
