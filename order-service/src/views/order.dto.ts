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
});

export const ShippingAddressInputSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  addressLine: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().optional(),
  country: z.string().default("Sri Lanka"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, "At least one mask item is required to place an order"),
  shippingAddress: ShippingAddressInputSchema,
  carrier: z.enum(["Island Express", "DHL Express", "FedEx Priority"]).default("DHL Express"),
  shippingCostLKR: z.number().nonnegative().default(4500),
  paymentMethod: z.enum(["card", "crypto", "cod"]).default("card"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "in-transit", "delivered"]),
  note: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const OrderQuerySchema = z.object({
  status: z.enum(["preparing", "in-transit", "delivered"]).optional(),
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
