import { Address, UserDoc, UserStats } from "../models/user.entity.js";
import { UserMongooseDoc } from "../models/user.schema.js";

export interface UserPresenter {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarUrl?: string;
  picture?: string;
  provider?: "google" | "preview" | "local";
  location?: string;
  artisanSlug?: string;
  wishlist: string[];
  addresses: Address[];
  claimedCertIds: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  _links: {
    self: string;
    wishlist: string;
    addresses: string;
  };
}

export class UserView {
  static formatUser(doc: UserMongooseDoc | UserDoc): UserPresenter {
    const raw = (doc as any).toObject ? (doc as any).toObject() : doc;
    const userId = raw.id || (doc as any)._id?.toString() || "";

    return {
      id: userId,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      initials: raw.initials,
      avatarUrl: raw.avatarUrl || "",
      picture: raw.avatarUrl || "",
      provider: raw.authProvider || "local",
      location: raw.location || "",
      artisanSlug: raw.artisanSlug || undefined,
      wishlist: raw.wishlist || [],
      addresses: raw.addresses || [],
      claimedCertIds: raw.claimedCertIds || [],
      isActive: raw.isActive ?? true,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      _links: {
        self: `/api/users/${userId}`,
        wishlist: `/api/users/wishlist`,
        addresses: `/api/users/addresses`,
      },
    };
  }

  static formatAuthResponse(user: UserMongooseDoc | UserDoc, token: string) {
    return {
      success: true,
      message: "Authentication successful",
      token,
      tokenType: "Bearer",
      expiresIn: "7d",
      user: UserView.formatUser(user),
    };
  }

  static formatWishlist(wishlist: string[]) {
    return {
      success: true,
      count: wishlist.length,
      wishlist,
    };
  }

  static formatAddresses(addresses: Address[]) {
    return {
      success: true,
      count: addresses.length,
      addresses,
    };
  }

  static formatStats(stats: UserStats) {
    return {
      success: true,
      data: stats,
    };
  }

  static formatSuccess(message: string, data?: any) {
    return {
      success: true,
      message,
      ...(data ? { data } : {}),
    };
  }
}
