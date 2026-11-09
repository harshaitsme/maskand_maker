import mongoose, { Document, Schema } from "mongoose";
import { CourierInfo, OrderDoc, OrderEvent, OrderItem, ShippingAddress } from "./order.entity.js";

export interface OrderMongooseDoc extends OrderDoc, Document {}

const OrderItemSchema = new Schema<OrderItem>(
  {
    slug: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    priceLKR: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderEventSchema = new Schema<OrderEvent>(
  {
    label: { type: String, required: true },
    date: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<ShippingAddress>(
  {
    fullName: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Sri Lanka" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const CourierInfoSchema = new Schema<CourierInfo>(
  {
    carrier: {
      type: String,
      enum: ["Island Express", "DHL Express", "FedEx Priority"],
      default: "DHL Express",
    },
    trackingNumber: { type: String, default: "" },
    dispatchDate: { type: String, default: "" },
    estimatedDelivery: { type: String, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderMongooseDoc>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    placedAt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["preparing", "in-transit", "delivered"],
      default: "preparing",
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(v: OrderItem[]) => v.length > 0, "Order must contain at least one item"],
    },
    totalLKR: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingLKR: {
      type: Number,
      default: 4500,
    },
    events: {
      type: [OrderEventSchema],
      default: [],
    },
    shippingAddress: {
      type: ShippingAddressSchema,
    },
    courier: {
      type: CourierInfoSchema,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "refunded"],
      default: "paid",
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  {
    collection: "order-svc",
    timestamps: true,
  }
);

// Secondary Indexes
OrderSchema.index({ "items.slug": 1 });
OrderSchema.index({ placedAt: -1 });

export const OrderModel =
  mongoose.models.Order || mongoose.model<OrderMongooseDoc>("Order", OrderSchema);
