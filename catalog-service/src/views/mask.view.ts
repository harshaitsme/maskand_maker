import { calculateSizeCategory, Mask } from "../models/mask.entity.js";
import { MaskResponseDto } from "./mask.dto.js";

/**
 * MaskView - View / Presenter Layer (MVC)
 * Formats internal domain entities into standardized client representations
 * matching the frontend's expected data shape with enriched hypermedia links.
 */
export class MaskView {
  // Approximate LKR to USD conversion for multi-currency display
  private static readonly LKR_TO_USD_RATE = 0.0033;

  /**
   * Renders a single mask entity to its public client representation
   */
  public static render(mask: Mask): MaskResponseDto {
    return {
      slug: mask.slug,
      name: mask.name,
      sinhala: mask.sinhala,
      tradition: mask.tradition,
      artisanSlug: mask.artisanSlug,
      priceLKR: mask.priceLKR,
      priceUSD: Math.round(mask.priceLKR * this.LKR_TO_USD_RATE),
      year: mask.year,
      heightCm: mask.heightCm,
      widthCm: mask.widthCm,
      depthCm: mask.depthCm,
      weightKg: mask.weightKg,
      sizeCategory: calculateSizeCategory(mask.heightCm),
      wood: mask.wood,
      dyes: mask.dyes,
      carvingDays: mask.carvingDays,
      image: mask.image,
      plateSeed: mask.plateSeed,
      plateVariant: mask.plateVariant,
      story: mask.story,
      context: mask.context,
      arAvailable: mask.arAvailable,
      verified: mask.verified,
      stock: mask.stock,
      featured: mask.featured,
      region: mask.region,
      certId: mask.certId,
      _links: {
        self: `/api/masks/${mask.slug}`,
        artisan: `/api/artisans/${mask.artisanSlug}`,
        certificate: `/api/verify/${mask.certId}`,
        model3d: mask.arAvailable ? `/models/${mask.slug}.glb` : undefined,
      },
    };
  }

  /**
   * Renders a list of masks
   */
  public static renderList(masks: Mask[]): MaskResponseDto[] {
    return masks.map((mask) => this.render(mask));
  }

  /**
   * Renders a structured collection response with metadata
   */
  public static renderCollection(masks: Mask[], totalCount: number) {
    return {
      count: masks.length,
      total: totalCount,
      data: this.renderList(masks),
    };
  }
}
