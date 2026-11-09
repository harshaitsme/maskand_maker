import { z } from "zod";
import { CertificateDoc, VerificationStatus } from "../models/verify.entity.js";

/**
 * Route parameter validation schema for certificate lookup
 */
export const CertIdParamSchema = z.object({
  certId: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Za-z0-9-_]+$/, "Certificate ID must be alphanumeric with dashes or underscores (e.g. 'MM-2024-0117')"),
});

export const MaskSlugParamSchema = z.object({
  maskSlug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Mask slug must be lowercase alphanumeric with hyphens (e.g. 'gini-raksha')"),
});

/**
 * NFC Hardware Tap Authentication schema (e.g. NTAG 424 DNA / NTAG213)
 */
export const NfcAuthBodySchema = z.object({
  tagId: z.string().min(3, "tagId or certId is required"),
  counter: z.number().int().nonnegative().optional(),
  cmac: z.string().optional(),
  readerType: z.string().default("WebNFC / Mobile Browser"),
});

export type NfcAuthBody = z.infer<typeof NfcAuthBodySchema>;

/**
 * Digital Twin Claiming schema
 */
export const ClaimTwinBodySchema = z.object({
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(100),
  ownerWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum/Polygon wallet address (0x...)")
    .optional(),
});

export type ClaimTwinBody = z.infer<typeof ClaimTwinBodySchema>;

/**
 * Counterfeit or Tamper Reporting schema
 */
export const ReportTamperBodySchema = z.object({
  reason: z.string().min(5, "Please provide a detailed reason (minimum 5 characters)").max(500),
  reporterContact: z.string().max(100).optional(),
});

export type ReportTamperBody = z.infer<typeof ReportTamperBodySchema>;

/**
 * New Certificate Registration schema (Minting Portal)
 */
export const CreateCertificateBodySchema = z.object({
  certId: z
    .string()
    .regex(/^MM-\d{4}-\d{4}$/, "Certificate code must follow 'MM-YYYY-XXXX' format (e.g. 'MM-2025-0999')"),
  maskSlug: z.string().min(2),
  maskName: z.string().min(2),
  artisanSlug: z.string().min(2),
  artisanName: z.string().min(2),
  mintedAt: z.string().default(() => new Date().toISOString().split("T")[0]),
  status: z.enum(["unclaimed", "claimed"]).default("unclaimed"),
  chain: z.literal("Polygon").default("Polygon"),
  contractAddress: z.string().default("0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa"),
  tokenId: z.string(),
  ipfsUri: z.string().startsWith("ipfs://"),
  owner: z.string().nullable().default(null),
  ownerWallet: z.string().nullable().default(null),
  history: z
    .array(
      z.object({
        label: z.string(),
        date: z.string(),
        actor: z.string(),
      })
    )
    .min(1),
  qrCodeUrl: z.string().url().optional(),
  nfcTag: z
    .object({
      uid: z.string(),
      standard: z.enum(["NTAG424_DNA", "NTAG213", "NTAG215"]).default("NTAG424_DNA"),
      tapCount: z.number().int().default(0),
      batch: z.string().default("AMB-2025-B1"),
    })
    .optional(),
  artisanSignature: z.string().min(10),
  hashProof: z.string().min(32),
});

export type CreateCertificateBody = z.infer<typeof CreateCertificateBodySchema>;

/**
 * Certificate query schema
 */
export const ListCertificatesQuerySchema = z.object({
  status: z.enum(["unclaimed", "claimed"]).optional(),
  artisanSlug: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  skip: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Standard Frontend Response DTO
 */
export interface VerifyResponseDto {
  found: boolean;
  cert: CertificateDoc | null;
  verificationStatus?: VerificationStatus;
  _links?: {
    self: string;
    mask?: string;
    artisan?: string;
    claim?: string;
    report?: string;
    nfcAuthenticate?: string;
  };
}
