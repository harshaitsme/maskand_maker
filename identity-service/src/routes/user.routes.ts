import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateJwt, requireRoles } from "../middleware/authMiddleware.js";

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  // Public/Platform stats
  router.get("/stats", controller.getStats);

  // Admin user list
  router.get("/", authenticateJwt, requireRoles("admin"), controller.getAllUsers);

  // Wishlist
  router.get("/wishlist", authenticateJwt, controller.getWishlist);
  router.post("/wishlist/:maskSlug", authenticateJwt, controller.addWishlistItem);
  router.delete("/wishlist/:maskSlug", authenticateJwt, controller.removeWishlistItem);

  // Address book
  router.get("/addresses", authenticateJwt, controller.getAddresses);
  router.post("/addresses", authenticateJwt, controller.addAddress);
  router.put("/addresses/:id", authenticateJwt, controller.updateAddress);
  router.delete("/addresses/:id", authenticateJwt, controller.removeAddress);

  return router;
}
