export type OrderStatus = "preparing" | "in-transit" | "delivered";

export interface OrderItem {
  slug: string;
  name?: string;
  qty: number;
  priceLKR: number;
}

export interface OrderEvent {
  label: string;
  date: string;
  done: boolean;
}

export interface ShippingAddress {
  fullName: string;
  addressLine: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CourierInfo {
  carrier: "Island Express" | "DHL Express" | "FedEx Priority";
  trackingNumber: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
}

export interface OrderDoc {
  id: string; // e.g. "MM-ORD-3358"
  placedAt: string; // ISO date e.g. "2026-01-04"
  status: OrderStatus;
  items: OrderItem[];
  totalLKR: number;
  shippingLKR: number;
  events: OrderEvent[];
  shippingAddress?: ShippingAddress;
  courier?: CourierInfo;
  paymentStatus: "paid" | "pending" | "refunded";
  customerEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreatedEvent {
  orderId: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  totalLKR: number;
  customerName?: string;
  customerEmail?: string;
  timestamp: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  preparingCount: number;
  inTransitCount: number;
  deliveredCount: number;
  totalRevenueLKR: number;
}
