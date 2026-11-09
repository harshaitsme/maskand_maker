import mongoose, { Document, Schema } from "mongoose";
import { NotificationCategory, NotificationChannel, NotificationPriority, RecipientRole } from "./notification.entity.js";

export interface INotificationDocument extends Document {
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

const NotificationSchema = new Schema<INotificationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    recipientId: { type: String, required: true, index: true },
    recipientRole: {
      type: String,
      required: true,
      enum: ["artisan", "buyer", "guild_curator", "system"],
      default: "artisan",
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["in_app", "email", "sms", "webhook"],
      default: "in_app",
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["order", "minting", "verification", "payout", "security", "system"],
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    link: { type: String },
    isRead: { type: Boolean, required: true, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotificationDocument>("Notification", NotificationSchema);
