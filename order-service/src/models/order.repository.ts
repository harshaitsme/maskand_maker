import { OrderDoc, OrderEvent, OrderStats, OrderStatus } from "./order.entity.js";
import { OrderModel } from "./order.schema.js";

/**
 * OrderRepository - Model Layer (MVC)
 * Encapsulates MongoDB database operations for orders and courier tracking.
 */
export class OrderRepository {
  /**
   * List all orders with optional status filter and pagination
   */
  public async findAll(filter?: {
    status?: OrderStatus;
    limit?: number;
    skip?: number;
  }): Promise<{ items: OrderDoc[]; total: number }> {
    const query: Record<string, any> = {};

    if (filter?.status) {
      query.status = filter.status;
    }

    const limit = Math.min(filter?.limit || 50, 100);
    const skip = filter?.skip || 0;

    const [items, total] = await Promise.all([
      OrderModel.find(query).sort({ placedAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(query),
    ]);

    return {
      items: items as unknown as OrderDoc[],
      total,
    };
  }

  /**
   * Find order by ID (e.g. "MM-ORD-3358")
   */
  public async findById(id: string): Promise<OrderDoc | null> {
    const normalized = id.trim().toUpperCase();
    const doc = await OrderModel.findOne({ id: normalized }).lean();
    return doc ? (doc as unknown as OrderDoc) : null;
  }

  /**
   * Create and persist a new order document
   */
  public async create(orderData: Partial<OrderDoc>): Promise<OrderDoc> {
    const created = await OrderModel.create(orderData);
    return created.toObject() as unknown as OrderDoc;
  }

  /**
   * Update order courier status and timeline progression
   */
  public async updateStatus(
    id: string,
    status: OrderStatus,
    eventLabel?: string
  ): Promise<OrderDoc | null> {
    const normalized = id.trim().toUpperCase();
    const order = await OrderModel.findOne({ id: normalized });

    if (!order) return null;

    order.status = status;
    const today = new Date().toISOString().split("T")[0];

    // Update status in timeline events
    if (status === "in-transit") {
      order.events.forEach((e: OrderEvent) => {
        if (e.label.includes("Workshop hand-over") || e.label.includes("Export papers")) {
          e.done = true;
          if (e.date === "—") e.date = today;
        }
      });
    } else if (status === "delivered") {
      order.events.forEach((e: OrderEvent) => {
        e.done = true;
        if (e.date === "—") e.date = today;
      });
    }

    if (eventLabel) {
      order.events.push({
        label: eventLabel,
        date: today,
        done: true,
      });
    }

    const saved = await order.save();
    return saved.toObject() as unknown as OrderDoc;
  }

  /**
   * Generate next sequential order code
   */
  public async generateNextOrderId(): Promise<string> {
    const count = await OrderModel.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `MM-ORD-${randomSuffix}`;
  }

  /**
   * Aggregate statistics
   */
  public async getStats(): Promise<OrderStats> {
    const [totalOrders, preparingCount, inTransitCount, deliveredCount, revenueAgg] =
      await Promise.all([
        OrderModel.countDocuments(),
        OrderModel.countDocuments({ status: "preparing" }),
        OrderModel.countDocuments({ status: "in-transit" }),
        OrderModel.countDocuments({ status: "delivered" }),
        OrderModel.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: "$totalLKR" } } },
        ]),
      ]);

    const totalRevenueLKR = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    return {
      totalOrders,
      preparingCount,
      inTransitCount,
      deliveredCount,
      totalRevenueLKR,
    };
  }
}

export const orderRepository = new OrderRepository();
