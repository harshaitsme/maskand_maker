import { z } from "zod";
import { OrderDoc } from "../models/order.entity.js";

export const OrderIdParamSchema = z.object({
  id: z
    .string()
    .min(5)
    .max(30)
    .regex(/^MM-ORD-\d+$/i, "Order ID must follow 'MM-ORD-XXXX' format (e.g. 'MM-ORD-3358')"),
});

export const OrderItemInputSchema = z.object({
  slug: z.string().min(2),
  name: z.string().optional(),
  qty: z.number().int().positive().default(1),
  priceLKR: z.number().positive(),
  weightKg: z.number().optional().default(1.5),
});

export const ShippingAddressInputSchema = z
  .object({
    fullName: z.string().optional(),
    name: z.string().optional(),
    addressLine: z.string().optional(),
    line1: z.string().optional(),
    city: z.string().min(2, "City is required"),
    postalCode: z.string().optional(),
    postal: z.string().optional(),
    country: z.string().default("Sri Lanka"),
    phone: z.string().optional(),
    email: z.string().email("Valid email required").optional(),
  })
  .transform((val) => ({
    fullName: val.fullName || val.name || "Customer",
    addressLine: val.addressLine || val.line1 || "",
    city: val.city,
    postalCode: val.postalCode || val.postal || "",
    country: val.country,
    phone: val.phone || "",
    email: val.email || "",
  }));

export const CarrierSchema = z
  .string()
  .optional()
  .default("DHL Express")
  .transform((val) => {
    const lower = (val || "").toLowerCase();
    if (lower.includes("island")) return "Island Express" as const;
    if (lower.includes("fedex")) return "FedEx Priority" as const;
    return "DHL Express" as const;
  });

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, "At least one mask item is required to place an order"),
  shippingAddress: ShippingAddressInputSchema,
  carrier: CarrierSchema,
  shippingCostLKR: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["card", "crypto", "cod", "demo"]).optional().default("card"),
  userId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "in-transit", "delivered"]),
  note: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const OrderQuerySchema = z.object({
  status: z.enum(["preparing", "in-transit", "delivered"]).optional(),
  email: z.string().optional(),
  customerEmail: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  skip: z.coerce.number().int().nonnegative().default(0),
});

export interface OrderResponseDto extends OrderDoc {
  _links: {
    self: string;
    updateStatus: string;
    items: string[];
  };
}
