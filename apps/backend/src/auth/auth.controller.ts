import { Router, type Request, type Response } from "express";
import type { Env } from "../config/env.js";
import { ValidationError } from "../shared/errors.js";
import type { AuthService } from "./auth.service.js";
import { createSessionMiddleware } from "./auth.middleware.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.validation.js";
import { SESSION_COOKIE_NAME, type SessionStore } from "./session.store.js";

function cookieOptions(env: Env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function createAuthRouter(
  authService: AuthService,
  sessionStore: SessionStore,
  env: Env,
): Router {
  const router = Router();
  const requireAuth = createSessionMiddleware(sessionStore);

  router.post("/register", async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const user = await authService.register(parsed.data);
    const sessionId = await sessionStore.create(user.id);
    res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions(env));
    res.status(201).json({ data: user });
  });

  router.post("/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const user = await authService.login(parsed.data.email, parsed.data.password);
    const sessionId = await sessionStore.create(user.id);
    res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions(env));
    res.json({ data: user });
  });

  router.post("/logout", requireAuth, async (req: Request, res: Response) => {
    if (req.sessionId) {
      await sessionStore.destroy(req.sessionId);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.status(204).send();
  });

  router.get("/me", requireAuth, async (req: Request, res: Response) => {
    const user = await authService.getUserById(req.userId!);
    res.json({ data: user });
  });

  router.patch("/me", requireAuth, async (req: Request, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const user = await authService.updateProfile(
      req.userId!,
      parsed.data.whatsappPhone,
    );
    res.json({ data: user });
  });

  return router;
}
