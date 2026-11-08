import { z } from "zod";

export const RegisterUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "artisan", "verifier", "admin"]).optional().default("buyer"),
  location: z.string().optional().default("Sri Lanka"),
  artisanSlug: z.string().optional(),
});

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  initials: z.string().min(1).max(4).optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  location: z.string().optional(),
  artisanSlug: z.string().optional(),
});

export const AddAddressSchema = z.object({
  label: z.string().min(1).default("Home"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  addressLine: z.string().min(3, "Address line is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default("Sri Lanka"),
  phone: z.string().optional().default(""),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateAddressSchema = AddAddressSchema.partial();

export const WishlistActionSchema = z.object({
  maskSlug: z.string().min(1, "Mask slug is required"),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginUserDto = z.infer<typeof LoginUserSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type AddAddressDto = z.infer<typeof AddAddressSchema>;
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
