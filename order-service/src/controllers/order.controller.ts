import { Request, Response, NextFunction } from "express";
import { orderRepository } from "../models/order.repository.js";
import { OrderView } from "../views/order.view.js";
import {
  CreateOrderSchema,
  OrderIdParamSchema,
  OrderQuerySchema,
  UpdateOrderStatusSchema,
} from "../views/order.dto.js";
import { RabbitMQClient } from "../config/rabbitmq.js";
import { OrderCreatedEvent, OrderDoc, OrderEvent, OrderStatusUpdatedEvent } from "../models/order.entity.js";

/**
 * OrderController - Controller Layer (MVC)
 * Coordinates order placement, checkout validation, RabbitMQ event dispatching,
 * and courier status progression.
 */
export class OrderController {
  /**
   * GET /api/orders
   * List orders with optional status filter
   */
  public static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = OrderQuerySchema.parse(req.query);
      const { items, total } = await orderRepository.findAll(query);

      res.setHeader("Cache-Control", "public, max-age=30");
      res.status(200).json(OrderView.renderOrderList(items, total));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   * Fetch single order and its courier event timeline
   */
  public static async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = OrderIdParamSchema.parse(req.params);
      const order = await orderRepository.findById(id);

      if (!order) {
        res.status(404).json({ error: "Not Found", message: `Order '${id}' not found` });
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=30");
      res.status(200).json(OrderView.renderOrder(order));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/orders
   * Submit new order, calculate totals, persist to MongoDB, and broadcast RabbitMQ event.
   */
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateOrderSchema.parse(req.body);
      const orderId = await orderRepository.generateNextOrderId();
      const today = new Date().toISOString().split("T")[0];

      // Calculate shipping cost based on destination and weight if not provided
      const totalWeight = input.items.reduce((sum, item) => sum + (item.weightKg || 1.5) * item.qty, 0);
      let shippingCost = input.shippingCostLKR;
      if (shippingCost === undefined) {
        if (input.shippingAddress.country === "Sri Lanka") {
          shippingCost = 2800;
        } else if (input.carrier === "FedEx Priority") {
          shippingCost = Math.round(13200 + totalWeight * 3900);
        } else {
          shippingCost = Math.round(14500 + totalWeight * 4200);
        }
      }

      // Calculate items total
      const itemsTotal = input.items.reduce((sum, item) => sum + item.priceLKR * item.qty, 0);
      const grandTotal = itemsTotal + shippingCost;

      // Initial tracking events
      const events: OrderEvent[] = [
        { label: "Order placed", date: today, done: true },
        { label: "Registry check & provenance pack", date: today, done: true },
        { label: "Workshop hand-over", date: "—", done: false },
        { label: "Export papers & dispatch", date: "—", done: false },
        { label: "Delivered", date: "—", done: false },
      ];

      let trackingNumber = `DHL-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      if (input.carrier === "Island Express") {
        trackingNumber = `ISL-${Math.floor(10000 + Math.random() * 90000)}-LK`;
      } else if (input.carrier === "FedEx Priority") {
        trackingNumber = `FDX-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      }

      const newOrderData: Partial<OrderDoc> = {
        id: orderId,
        placedAt: today,
        status: "preparing",
        items: input.items,
        totalLKR: grandTotal,
        shippingLKR: shippingCost,
        events,
        shippingAddress: input.shippingAddress,
        courier: {
          carrier: input.carrier,
          trackingNumber,
          dispatchDate: "",
          estimatedDelivery: "",
        },
        paymentStatus: "paid",
        customerEmail: input.shippingAddress.email || "",
      };

      const created = await orderRepository.create(newOrderData);

      // --- Broadcast Asynchronous Event via RabbitMQ ---
      const eventPayload: OrderCreatedEvent = {
        orderId: created.id,
        placedAt: created.placedAt,
        status: created.status,
        items: created.items,
        totalLKR: created.totalLKR,
        customerName: input.shippingAddress.fullName,
        customerEmail: input.shippingAddress.email,
        timestamp: new Date().toISOString(),
      };

      // Fire event to topic exchange (e.g. routing key: 'order.created')
      RabbitMQClient.publish("order.created", eventPayload).catch((err) => {
        console.error("Failed to publish RabbitMQ event:", err);
      });

      res.status(201).json(OrderView.renderOrder(created));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Advance order courier status (preparing -> in-transit -> delivered)
   */
  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = OrderIdParamSchema.parse(req.params);
      const { status, note } = UpdateOrderStatusSchema.parse(req.body);

      const existing = await orderRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: "Not Found", message: `Order '${id}' not found` });
        return;
      }

      const previousStatus = existing.status;
      const updated = await orderRepository.updateStatus(id, status, note);

      if (!updated) {
        res.status(404).json({ error: "Not Found", message: `Order '${id}' not found` });
        return;
      }

      // --- Broadcast Asynchronous Event via RabbitMQ ---
      const eventPayload: OrderStatusUpdatedEvent = {
        orderId: updated.id,
        previousStatus,
        newStatus: status,
        updatedAt: new Date().toISOString(),
      };

      RabbitMQClient.publish("order.status_updated", eventPayload).catch((err) => {
        console.error("Failed to publish RabbitMQ status update event:", err);
      });

      res.status(200).json(OrderView.renderOrder(updated));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/stats
   * Get aggregate metrics
   */
  public static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await orderRepository.getStats();
      res.setHeader("Cache-Control", "public, max-age=30");
      res.status(200).json(OrderView.renderStats(stats));
    } catch (error) {
      next(error);
    }
  }
}
