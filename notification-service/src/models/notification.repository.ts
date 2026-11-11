import { NotificationItem } from "./notification.entity.js";
import { NotificationModel } from "./notification.schema.js";

export class NotificationRepository {
  public async getNotifications(filter: {
    recipientId?: string;
    recipientRole?: string;
    category?: string;
    channel?: string;
    isRead?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<{ items: NotificationItem[]; total: number; unreadCount: number }> {
    const query: any = {};
    if (filter.recipientId && filter.recipientId !== "all") {
      const ids = filter.recipientId.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 1) {
        query.recipientId = { $in: ids };
      } else if (ids.length === 1) {
        query.recipientId = ids[0];
      }
    }
    if (filter.recipientRole && filter.recipientRole !== "all") query.recipientRole = filter.recipientRole;
    if (filter.category && filter.category !== "all") query.category = filter.category;
    if (filter.channel && filter.channel !== "all") query.channel = filter.channel;
    if (typeof filter.isRead === "boolean") query.isRead = filter.isRead;

    const limit = Math.min(filter.limit || 50, 100);
    const skip = filter.skip || 0;

    const unreadQuery: any = { isRead: false };
    if (query.recipientId) {
      unreadQuery.recipientId = query.recipientId;
    }

    const [docs, total, unreadCount] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments(unreadQuery),
    ]);

    return {
      items: docs.map(this.mapDocToEntity),
      total,
      unreadCount,
    };
  }

  public async getUnreadCount(recipientId: string): Promise<number> {
    const ids = recipientId.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length > 1) {
      return NotificationModel.countDocuments({ recipientId: { $in: ids }, isRead: false });
    }
    return NotificationModel.countDocuments({ recipientId, isRead: false });
  }

  public async create(data: Omit<NotificationItem, "id" | "createdAt" | "isRead">): Promise<NotificationItem> {
    const id = `NOTIF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const doc = await NotificationModel.create({
      ...data,
      id,
      isRead: false,
      createdAt: new Date(),
    });
    return this.mapDocToEntity(doc.toObject());
  }

  public async markAsRead(id: string): Promise<NotificationItem | null> {
    const doc = await NotificationModel.findOneAndUpdate(
      { id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();
    return doc ? this.mapDocToEntity(doc) : null;
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    const ids = recipientId.split(",").map((s) => s.trim()).filter(Boolean);
    const query = ids.length > 1 ? { recipientId: { $in: ids }, isRead: false } : { recipientId, isRead: false };
    const res = await NotificationModel.updateMany(
      query,
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.modifiedCount;
  }

  public async deleteById(id: string): Promise<boolean> {
    const res = await NotificationModel.deleteOne({ id });
    return res.deletedCount === 1;
  }

  private mapDocToEntity(doc: any): NotificationItem {
    return {
      id: doc.id,
      recipientId: doc.recipientId,
      recipientRole: doc.recipientRole,
      channel: doc.channel,
      category: doc.category,
      priority: doc.priority,
      title: doc.title,
      message: doc.message,
      data: doc.data,
      link: doc.link,
      isRead: doc.isRead,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
    };
  }
}
