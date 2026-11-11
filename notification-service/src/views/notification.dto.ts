import { z } from "zod";

export const CreateNotificationSchema = z.object({
  recipientId: z.string().min(1, "recipientId is required"),
  recipientRole: z.enum(["artisan", "buyer", "guild_curator", "system"]).default("artisan"),
  channel: z.enum(["in_app", "email", "sms", "webhook"]).default("in_app"),
  category: z.enum(["order", "minting", "verification", "payout", "security", "system"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  title: z.string().min(1, "title is required"),
  message: z.string().min(1, "message is required"),
  data: z.record(z.string(), z.any()).optional(),
  link: z.string().optional(),
});

export const NotificationFilterSchema = z.object({
  recipientId: z.string().optional(),
  recipientRole: z.enum(["all", "artisan", "buyer", "guild_curator", "system"]).optional(),
  category: z.enum(["all", "order", "minting", "verification", "payout", "security", "system"]).optional(),
  channel: z.enum(["all", "in_app", "email", "sms", "webhook"]).optional(),
  isRead: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});
