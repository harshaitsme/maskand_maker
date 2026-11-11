export type UserRole = "buyer" | "artisan" | "verifier" | "admin";

export interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserDoc {
  id: string; // User ID (e.g. "USR-001" or ObjectId hex)
  name: string; // e.g. "Ruwin Jayasuriya"
  email: string; // e.g. "r.jayasuriya@holding.lk"
  passwordHash?: string;
  role: UserRole; // "buyer" | "artisan" | "verifier" | "admin"
  initials: string; // e.g. "RJ"
  avatarUrl?: string;
  authProvider?: "local" | "google" | "preview";
  googleId?: string;
  location?: string; // e.g. "Colombo 07, Sri Lanka"
  artisanSlug?: string; // e.g. "chandana-bandara" (for artisan role)
  wishlist: string[]; // mask slugs e.g. ["gini-raksha", "naga-raja-kolam"]
  addresses: Address[];
  claimedCertIds: string[]; // e.g. ["MM-2023-0845"]
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface UserStats {
  totalUsers: number;
  buyersCount: number;
  artisansCount: number;
  verifiersCount: number;
  adminsCount: number;
}
