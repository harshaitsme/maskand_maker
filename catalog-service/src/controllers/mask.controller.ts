import { Request, Response, NextFunction } from "express";
import { maskRepository } from "../models/mask.repository.js";
import { MaskModel } from "../models/mask.schema.js";
import { Mask } from "../models/mask.entity.js";
import { MaskView } from "../views/mask.view.js";
import { CreateMaskSchema, MaskQuerySchema } from "../views/mask.dto.js";

/**
 * MaskController - Controller Layer (MVC)
 * Responsible for handling HTTP requests, orchestrating business logic via the repository,
 * and dispatching standardized responses through the View layer.
 */
export class MaskController {
  /**
   * GET /api/masks
   * List masks with query filters: tradition, artisan, price, size, search, sort
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = MaskQuerySchema.parse(req.query);
      const masks = await maskRepository.findAll(parsedQuery);

      // Cache-friendly HTTP headers
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
      res.status(200).json(MaskView.renderList(masks));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/masks/featured
   * Return high-priority gallery showcase masks
   */
  public static async featured(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const masks = await maskRepository.findFeatured();
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).json(MaskView.renderList(masks));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/masks/:slug
   * Single mask by slug
   */
  public static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const mask = await maskRepository.findBySlug(slug);

      if (!mask) {
        res.status(404).json({
          error: "Not Found",
          message: `Mask with slug '${slug}' was not found in the heritage catalog.`,
        });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=120");
      res.status(200).json(MaskView.render(mask));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/masks/:slug/related
   * Up to 3 related masks in the same tradition
   */
  public static async related(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const mask = await maskRepository.findBySlug(slug);

      if (!mask) {
        res.status(404).json({ error: "Not Found", message: `Mask '${slug}' not found` });
        return;
      }

      const relatedMasks = await maskRepository.findRelated(slug, mask.tradition, 3);
      res.status(200).json(MaskView.renderList(relatedMasks));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/masks/artisan/:artisanSlug
   * All masks carved by a specific artisan
   */
  public static async byArtisan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { artisanSlug } = req.params;
      const masks = await maskRepository.findByArtisan(artisanSlug);
      res.status(200).json(MaskView.renderList(masks));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/masks
   * Create a new mask listing (Artisan Portal Listing Flow)
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateMaskSchema.parse(req.body);
      const certId = parsed.certId || `MM-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
      const sinhala = parsed.sinhala || parsed.name;
      const story =
        parsed.story && parsed.story.length >= 3
          ? parsed.story
          : `Hand-carved ${parsed.name} traditional wooden mask by master artisan.`;
      const context =
        parsed.context && parsed.context.length >= 3
          ? parsed.context
          : `Carved from sacred ${parsed.wood} in the living ${parsed.tradition} lineage of Ambalangoda.`;

      const maskData = {
        ...parsed,
        certId,
        sinhala,
        story,
        context,
      };

      const existing = await maskRepository.findBySlug(parsed.slug);
      let mask;
      if (existing) {
        mask = await MaskModel.findOneAndUpdate(
          { slug: parsed.slug },
          { $set: maskData },
          { new: true }
        ).lean();
      } else {
        mask = await maskRepository.create(maskData);
      }

      res.status(201).json({
        message: "Mask listing created successfully",
        mask: MaskView.render(mask as unknown as Mask),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/masks/:slug/stock
   * Adjust inventory stock (e.g., when an order is placed)
   */
  public static async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const { delta } = req.body;

      if (typeof delta !== "number") {
        res.status(400).json({ error: "Bad Request", message: "delta must be a numeric integer" });
        return;
      }

      const updated = await maskRepository.updateStock(slug, delta);
      if (!updated) {
        res.status(404).json({ error: "Not Found", message: `Mask '${slug}' not found or insufficient stock` });
        return;
      }

      res.status(200).json({
        slug: updated.slug,
        newStock: updated.stock,
      });
    } catch (error) {
      next(error);
    }
  }
}
