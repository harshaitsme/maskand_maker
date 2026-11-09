import { NotificationItem } from "../models/notification.entity.js";

export class NotificationView {
  public static renderNotification(n: NotificationItem) {
    return {
      id: n.id,
      recipientId: n.recipientId,
      recipientRole: n.recipientRole,
      channel: n.channel,
      category: n.category,
      priority: n.priority,
      title: n.title,
      message: n.message,
      data: n.data || null,
      link: n.link || null,
      isRead: n.isRead,
      readAt: n.readAt || null,
      createdAt: n.createdAt,
    };
  }

  public static renderList(items: NotificationItem[], total: number, unreadCount: number) {
    return {
      total,
      unreadCount,
      count: items.length,
      items: items.map(this.renderNotification),
    };
  }
}
