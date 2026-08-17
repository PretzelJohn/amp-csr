import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "../services/auth.js";

export type AuthUserContext = {
  id: number;
  email: string;
  role: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUserContext;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token =
    getCookie(c, "token") ??
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyJwt(token);

    c.set("user", {
      id: Number(payload.userId ?? payload.sub),
      email: String(payload.email ?? ""),
      role: String(payload.role ?? "user"),
    } satisfies AuthUserContext);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
