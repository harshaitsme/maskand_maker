import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticateJwt } from "../middleware/authMiddleware.js";

export function createAuthRouter(controller: UserController): Router {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/google", controller.googleLogin);
  router.post("/oauth/google", controller.googleLogin);
  router.get("/me", authenticateJwt, controller.getMe);
  router.patch("/profile", authenticateJwt, controller.updateProfile);

  return router;
}
