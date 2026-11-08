import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRepository } from "../models/user.repository.js";
import {
  RegisterUserSchema,
  LoginUserSchema,
  UpdateProfileSchema,
  AddAddressSchema,
  UpdateAddressSchema,
} from "../views/user.dto.js";
import { UserView } from "../views/user.view.js";
import { generateToken } from "../middleware/authMiddleware.js";
import { Address } from "../models/user.entity.js";

export class UserController {
  constructor(private userRepo: UserRepository) {}

  private extractInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = RegisterUserSchema.parse(req.body);

      const existing = await this.userRepo.findByEmail(parsed.email);
      if (existing) {
        res.status(409).json({
          success: false,
          error: "Conflict",
          message: "An account with this email address already exists.",
        });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const initials = this.extractInitials(parsed.name);

      const newUser = await this.userRepo.create({
        name: parsed.name,
        email: parsed.email.toLowerCase().trim(),
        passwordHash,
        role: parsed.role,
        initials,
        location: parsed.location || "Sri Lanka",
        artisanSlug: parsed.artisanSlug,
        wishlist: [],
        addresses: [],
        claimedCertIds: [],
        isActive: true,
      });

      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json(UserView.formatAuthResponse(newUser, token));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = LoginUserSchema.parse(req.body);

      const user = await this.userRepo.findByEmail(parsed.email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid email or password.",
        });
        return;
      }

      const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid email or password.",
        });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json(UserView.formatAuthResponse(user, token));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const user = await this.userRepo.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        user: UserView.formatUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const parsed = UpdateProfileSchema.parse(req.body);
      const updated = await this.userRepo.updateProfile(req.user.userId, parsed);

      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: UserView.formatUser(updated),
      });
    } catch (error) {
      next(error);
    }
  };

  getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const user = await this.userRepo.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json(UserView.formatWishlist(user.wishlist));
    } catch (error) {
      next(error);
    }
  };

  addWishlistItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const maskSlug = req.params.maskSlug;
      if (!maskSlug) {
        res.status(400).json({ success: false, error: "BadRequest", message: "maskSlug parameter is required" });
        return;
      }

      const updated = await this.userRepo.addWishlistItem(req.user.userId, maskSlug);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Added '${maskSlug}' to wishlist`,
        wishlist: updated.wishlist,
      });
    } catch (error) {
      next(error);
    }
  };

  removeWishlistItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const maskSlug = req.params.maskSlug;
      if (!maskSlug) {
        res.status(400).json({ success: false, error: "BadRequest", message: "maskSlug parameter is required" });
        return;
      }

      const updated = await this.userRepo.removeWishlistItem(req.user.userId, maskSlug);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Removed '${maskSlug}' from wishlist`,
        wishlist: updated.wishlist,
      });
    } catch (error) {
      next(error);
    }
  };

  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const user = await this.userRepo.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json(UserView.formatAddresses(user.addresses));
    } catch (error) {
      next(error);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const parsed = AddAddressSchema.parse(req.body);
      const newAddress: Address = {
        id: `addr-${crypto.randomUUID().slice(0, 8)}`,
        ...parsed,
      };

      const updated = await this.userRepo.addAddress(req.user.userId, newAddress);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Address added successfully",
        addresses: updated.addresses,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const addressId = req.params.id;
      const parsed = UpdateAddressSchema.parse(req.body);

      const updated = await this.userRepo.updateAddress(req.user.userId, addressId, parsed);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: "NotFound",
          message: "Address or user not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        addresses: updated.addresses,
      });
    } catch (error) {
      next(error);
    }
  };

  removeAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const addressId = req.params.id;
      const updated = await this.userRepo.removeAddress(req.user.userId, addressId);
      if (!updated) {
        res.status(404).json({ success: false, error: "NotFound", message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Address removed successfully",
        addresses: updated.addresses,
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userRepo.getStats();
      res.status(200).json(UserView.formatStats(stats));
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const users = await this.userRepo.findAll(limit, offset);

      res.status(200).json({
        success: true,
        count: users.length,
        users: users.map((u) => UserView.formatUser(u)),
      });
    } catch (error) {
      next(error);
    }
  };
}
