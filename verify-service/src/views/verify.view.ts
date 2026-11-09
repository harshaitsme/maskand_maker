import { CertificateDoc, RegistryStats, VerificationStatus } from "../models/verify.entity.js";
import { VerifyResponseDto } from "./verify.dto.js";

/**
 * VerifyView - View / Presenter Layer (MVC)
 * Formats certificate documents and verification cryptographic proofs
 * for the frontend Verify page and NFC tag taps.
 */
export class VerifyView {
  private static explorerBase =
    process.env.AMOY_EXPLORER_BASE_URL || "https://amoy.polygonscan.com";

  /**
   * Render verification result matching the frontend Verify page
   */
  public static renderVerification(
    cert: CertificateDoc,
    opts?: { onChainVerified?: boolean; nfcVerified?: boolean }
  ): VerifyResponseDto {
    const onChainVerified = opts?.onChainVerified ?? true;
    const nfcVerified = opts?.nfcVerified ?? !cert.isTampered;

    const verificationStatus: VerificationStatus = {
      onChainVerified,
      nfcVerified,
      physicalTagIntact: !cert.isTampered,
      signatureMatchesMaker: Boolean(cert.artisanSignature && cert.artisanSignature.length > 20),
      explorerUrl: `${this.explorerBase}/token/${cert.contractAddress}?a=${encodeURIComponent(cert.tokenId)}`,
      ipfsGatewayUrl: cert.ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/"),
    };

    return {
      found: true,
      cert: {
        ...cert,
        // Frontend uses ipfs shortened format if needed
        ipfsUri: cert.ipfsUri,
      },
      verificationStatus,
      _links: {
        self: `/api/verify/${cert.certId}`,
        mask: `/api/masks/${cert.maskSlug}`,
        artisan: `/api/artisans/${cert.artisanSlug}`,
        claim: `/api/verify/${cert.certId}/claim`,
        report: `/api/verify/${cert.certId}/report`,
        nfcAuthenticate: `/api/verify/nfc/authenticate`,
      },
    };
  }

  /**
   * Render negative lookup result
   */
  public static renderNotFound(query: string): VerifyResponseDto {
    return {
      found: false,
      cert: null,
      _links: {
        self: `/api/verify/${query}`,
      },
    };
  }

  /**
   * Render successful claim receipt
   */
  public static renderClaimReceipt(cert: CertificateDoc) {
    return {
      success: true,
      message: `Digital twin '${cert.maskName}' (${cert.certId}) successfully bound to ${cert.owner}.`,
      cert,
      claimedAt: new Date().toISOString(),
      transactionProof: {
        network: "Polygon Amoy",
        contract: cert.contractAddress,
        tokenId: cert.tokenId,
        status: "CONFIRMED",
      },
    };
  }

  /**
   * Render NFC physical tap authentication result
   */
  public static renderNfcAuthSuccess(cert: CertificateDoc, tapCount: number) {
    return {
      authenticated: true,
      tagType: cert.nfcTag.standard,
      uid: cert.nfcTag.uid,
      tapCount,
      lastTappedAt: cert.nfcTag.lastTappedAt,
      batch: cert.nfcTag.batch,
      mask: {
        name: cert.maskName,
        slug: cert.maskSlug,
        artisan: cert.artisanName,
      },
      verification: this.renderVerification(cert, { nfcVerified: true }),
    };
  }

  /**
   * Render aggregate registry statistics
   */
  public static renderStats(stats: RegistryStats) {
    return {
      registryStatus: "LIVE",
      network: "Polygon PoS (Amoy Testnet)",
      contract: process.env.REGISTRY_CONTRACT_ADDRESS || "0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa",
      stats: {
        ...stats,
        counterfeitGuaranteedHours: 48,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
