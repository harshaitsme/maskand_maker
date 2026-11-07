import { Artisan } from "../models/artisan.entity.js";
import { WorkshopStats } from "../models/artisan.repository.js";
import { ArtisanResponseDto } from "./artisan.dto.js";

/**
 * ArtisanView - View / Presenter Layer (MVC)
 * Formats internal artisan entities into standardized client representations
 * matching the frontend's expected data shape with enriched hypermedia links.
 */
export class ArtisanView {
  /**
   * Renders a single artisan entity to its public client representation
   */
  public static render(artisan: Artisan): ArtisanResponseDto {
    const currentYear = new Date().getFullYear();
    const yearsOfMastery = Math.max(1, currentYear - artisan.since);

    return {
      slug: artisan.slug,
      name: artisan.name,
      sinhalaName: artisan.sinhalaName,
      role: artisan.role,
      region: artisan.region,
      village: artisan.village,
      born: artisan.born,
      since: artisan.since,
      yearsOfMastery,
      ordersFulfilled: artisan.ordersFulfilled,
      rating: artisan.rating,
      verified: artisan.verified,
      photo: artisan.photo,
      initials: artisan.initials,
      bio: artisan.bio,
      story: artisan.story,
      tools: artisan.tools,
      styleNotes: artisan.styleNotes,
      generations: artisan.generations,
      focusTraditions: artisan.focusTraditions,
      _links: {
        self: `/api/artisans/${artisan.slug}`,
        masks: `/api/masks/artisan/${artisan.slug}`,
        workshopStats: `/api/artisans/${artisan.slug}/stats`,
      },
    };
  }

  /**
   * Renders a list of artisans
   */
  public static renderList(artisans: Artisan[]): ArtisanResponseDto[] {
    return artisans.map((artisan) => this.render(artisan));
  }

  /**
   * Renders workshop desk stats
   */
  public static renderStats(artisan: Artisan, stats: WorkshopStats) {
    return {
      artisan: {
        slug: artisan.slug,
        name: artisan.name,
        role: artisan.role,
        village: artisan.village,
      },
      stats,
    };
  }
}
