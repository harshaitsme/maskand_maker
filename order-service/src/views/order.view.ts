import { OrderDoc, OrderStats } from "../models/order.entity.js";
import { OrderResponseDto } from "./order.dto.js";

/**
 * OrderView - View / Presenter Layer (MVC)
 * Formats internal order documents into standardized client representations
 * matching the frontend's checkout and tracking interfaces.
 */
export class OrderView {
  public static renderOrder(doc: OrderDoc): OrderResponseDto {
    return {
      ...doc,
      _links: {
        self: `/api/orders/${doc.id}`,
        updateStatus: `/api/orders/${doc.id}/status`,
        items: doc.items.map((i) => `/api/masks/${i.slug}`),
      },
    };
  }

  public static renderOrderList(docs: OrderDoc[], total: number) {
    return {
      total,
      count: docs.length,
      orders: docs.map((d) => this.renderOrder(d)),
    };
  }

  public static renderStats(stats: OrderStats) {
    return {
      service: "order-service",
      stats: {
        ...stats,
        currency: "LKR",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
