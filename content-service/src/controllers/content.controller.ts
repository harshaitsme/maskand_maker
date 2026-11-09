import { Request, Response, NextFunction } from "express";
import { contentRepository } from "../models/content.repository.js";
import { ContentView } from "../views/content.view.js";
import { ArticleQuerySchema, CreateArticleSchema } from "../views/content.dto.js";
import { Tradition } from "../models/content.entity.js";

/**
 * ContentController - Controller Layer (MVC)
 * Responsible for handling HTTP requests for the heritage content domain.
 */
export class ContentController {
  // --- Traditions ---
  public static async listTraditions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const traditions = await contentRepository.findTraditions();
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1 hour
      res.status(200).json(ContentView.renderTraditionList(traditions));
    } catch (error) {
      next(error);
    }
  }

  public static async getTradition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as Tradition;
      const tradition = await contentRepository.findTraditionBySlug(slug);

      if (!tradition) {
        res.status(404).json({ error: "Not Found", message: `Tradition '${slug}' not found` });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).json(ContentView.renderTradition(tradition));
    } catch (error) {
      next(error);
    }
  }

  // --- Articles ---
  public static async listArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = ArticleQuerySchema.parse(req.query);
      const articles = await contentRepository.findArticles(parsedQuery);

      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).json(ContentView.renderArticleList(articles));
    } catch (error) {
      next(error);
    }
  }

  public static async getArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const article = await contentRepository.findArticleBySlug(slug);

      if (!article) {
        res.status(404).json({ error: "Not Found", message: `Article '${slug}' not found` });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).json(ContentView.renderArticle(article));
    } catch (error) {
      next(error);
    }
  }

  public static async createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = CreateArticleSchema.parse(req.body);
      const existing = await contentRepository.findArticleBySlug(payload.slug);

      if (existing) {
        res.status(409).json({
          error: "Conflict",
          message: `Article with slug '${payload.slug}' already exists`,
        });
        return;
      }

      const created = await contentRepository.createArticle(payload);
      res.status(201).json(ContentView.renderArticle(created));
    } catch (error) {
      next(error);
    }
  }

  // --- Craft Stages ---
  public static async listStages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stages = await contentRepository.findCraftStages();
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.status(200).json(ContentView.renderCraftStages(stages));
    } catch (error) {
      next(error);
    }
  }

  // --- Workshops ---
  public static async listWorkshops(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workshops = await contentRepository.findWorkshops();
      res.status(200).json(ContentView.renderWorkshops(workshops));
    } catch (error) {
      next(error);
    }
  }

  public static async bookWorkshop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const booked = await contentRepository.bookWorkshopSpot(id);

      if (!booked) {
        res.status(400).json({ error: "Booking Failed", message: "No spots left or workshop not found" });
        return;
      }

      res.status(200).json({
        message: "Workshop spot reserved successfully",
        workshop: booked,
      });
    } catch (error) {
      next(error);
    }
  }
}
