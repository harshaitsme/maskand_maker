export interface ServiceConfig {
  name: string;
  url: string;
  prefix: string;
  healthUrl: string;
}

export const services: Record<string, ServiceConfig> = {
  catalog: {
    name: "catalog-service",
    url: process.env.CATALOG_SVC_URL || "http://localhost:3001",
    prefix: "/api/masks",
    healthUrl: `${process.env.CATALOG_SVC_URL || "http://localhost:3001"}/health`,
  },
  artisan: {
    name: "artisan-service",
    url: process.env.ARTISAN_SVC_URL || "http://localhost:3002",
    prefix: "/api/artisans",
    healthUrl: `${process.env.ARTISAN_SVC_URL || "http://localhost:3002"}/health`,
  },
  content: {
    name: "content-service",
    url: process.env.CONTENT_SVC_URL || "http://localhost:3003",
    prefix: "/api/content",
    healthUrl: `${process.env.CONTENT_SVC_URL || "http://localhost:3003"}/health`,
  },
  verify: {
    name: "verify-service",
    url: process.env.VERIFY_SVC_URL || "http://localhost:3004",
    prefix: "/api/verify",
    healthUrl: `${process.env.VERIFY_SVC_URL || "http://localhost:3004"}/health`,
  },
  order: {
    name: "order-service",
    url: process.env.ORDER_SVC_URL || "http://localhost:3005",
    prefix: "/api/orders",
    healthUrl: `${process.env.ORDER_SVC_URL || "http://localhost:3005"}/health`,
  },
  search: {
    name: "search-service",
    url: process.env.SEARCH_SVC_URL || "http://localhost:3006",
    prefix: "/api/search",
    healthUrl: `${process.env.SEARCH_SVC_URL || "http://localhost:3006"}/health`,
  },
  identity: {
    name: "identity-service",
    url: process.env.IDENTITY_SVC_URL || "http://localhost:3007",
    prefix: "/api/identity",
    healthUrl: `${process.env.IDENTITY_SVC_URL || "http://localhost:3007"}/health`,
  },
  portal: {
    name: "portal-service",
    url: process.env.PORTAL_SVC_URL || "http://localhost:3008",
    prefix: "/api/portal",
    healthUrl: `${process.env.PORTAL_SVC_URL || "http://localhost:3008"}/health`,
  },
  media: {
    name: "media-service",
    url: process.env.MEDIA_SVC_URL || "http://localhost:3009",
    prefix: "/api/media",
    healthUrl: `${process.env.MEDIA_SVC_URL || "http://localhost:3009"}/health`,
  },
  settlement: {
    name: "settlement-service",
    url: process.env.SETTLEMENT_SVC_URL || "http://localhost:3010",
    prefix: "/api/settlement",
    healthUrl: `${process.env.SETTLEMENT_SVC_URL || "http://localhost:3010"}/health`,
  },
  notification: {
    name: "notification-service",
    url: process.env.NOTIFICATION_SVC_URL || "http://localhost:3011",
    prefix: "/api/notifications",
    healthUrl: `${process.env.NOTIFICATION_SVC_URL || "http://localhost:3011"}/health`,
  },
  ai3d: {
    name: "3d-ai-service",
    url: process.env.AI_3D_SVC_URL || "http://localhost:8000",
    prefix: "/api/ai-3d",
    healthUrl: `${process.env.AI_3D_SVC_URL || "http://localhost:8000"}/health`,
  },
};
