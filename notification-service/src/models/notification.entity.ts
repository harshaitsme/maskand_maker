export type NotificationChannel = "in_app" | "email" | "sms" | "webhook";
export type NotificationCategory = "order" | "minting" | "verification" | "payout" | "security" | "system";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type RecipientRole = "artisan" | "buyer" | "guild_curator" | "system";

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: RecipientRole;
  channel: NotificationChannel;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}
