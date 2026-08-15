import type { NextFunction, Request, Response } from "express";
import type { SessionStore } from "./session.store.js";
import { SESSION_COOKIE_NAME } from "./session.store.js";
import { UnauthorizedError } from "../shared/errors.js";

export function createSessionMiddleware(sessionStore: SessionStore) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const sessionId = req.cookies[SESSION_COOKIE_NAME] as string | undefined;

    if (!sessionId) {
      next(new UnauthorizedError());
      return;
    }

    const userId = await sessionStore.getUserId(sessionId);
    if (!userId) {
      next(new UnauthorizedError());
      return;
    }

    req.userId = userId;
    req.sessionId = sessionId;
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}
