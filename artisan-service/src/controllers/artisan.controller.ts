import { Request, Response, NextFunction } from "express";
import { artisanRepository } from "../models/artisan.repository.js";
import { ArtisanView } from "../views/artisan.view.js";
import { ArtisanQuerySchema, CreateArtisanSchema } from "../views/artisan.dto.js";

/**
 * ArtisanController - Controller Layer (MVC)
 * Responsible for handling HTTP requests for the artisan & workshop domain,
 * validating queries/payloads, and returning formatted representations via the View layer.
 */
export class ArtisanController {
  /**
   * GET /api/artisans
   * List all master carvers and painters with tradition and region filtering
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = ArtisanQuerySchema.parse(req.query);
      const artisans = await artisanRepository.findAll(parsedQuery);

      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
      res.status(200).json(ArtisanView.renderList(artisans));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/artisans/:slug
   * Single artisan details with lineages, bio, tools, and style notes
   */
  public static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const artisan = await artisanRepository.findBySlug(slug);

      if (!artisan) {
        res.status(404).json({
          error: "Not Found",
          message: `Artisan with slug '${slug}' was not found in the heritage registry.`,
        });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=120");
      res.status(200).json(ArtisanView.render(artisan));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/artisans/:slug/stats
   * Workshop workbench metrics for Artisan Portal dashboard
   */
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const artisan = await artisanRepository.findBySlug(slug);

      if (!artisan) {
        res.status(404).json({ error: "Not Found", message: `Artisan '${slug}' not found` });
        return;
      }

      const stats = await artisanRepository.getWorkshopStats(slug);
      res.status(200).json(ArtisanView.renderStats(artisan, stats!));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/artisans
   * Register a new master carver / workshop profile (Portal Onboarding)
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = CreateArtisanSchema.parse(req.body);
      const created = await artisanRepository.create(payload);

      res.status(201).json({
        message: "Artisan profile registered successfully",
        artisan: ArtisanView.render(created),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/artisans/:slug/metrics
   * Update orders fulfilled or customer satisfaction rating
   */
  public static async updateMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const { deltaOrders = 0, rating } = req.body;

      const updated = await artisanRepository.updateMetrics(slug, deltaOrders, rating);
      if (!updated) {
        res.status(404).json({ error: "Not Found", message: `Artisan '${slug}' not found` });
        return;
      }

      res.status(200).json({
        slug: updated.slug,
        ordersFulfilled: updated.ordersFulfilled,
        rating: updated.rating,
      });
    } catch (error) {
      next(error);
    }
  }
}
