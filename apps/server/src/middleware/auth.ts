import { createMiddleware } from "hono/factory";
import { verifyJwt } from "../services/auth.js";

export type AuthUserContext = {
  id: number;
  email: string;
  roles: string[];
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUserContext;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyJwt(token);

    if (
      !payload.userId ||
      !payload.email ||
      !Array.isArray(payload.roles) ||
      (!payload.roles.includes("user") && !payload.roles.includes("admin"))
    ) {
      return c.json({ error: "Invalid token payload" }, 401);
    }

    c.set("user", {
      id: Number(payload.userId ?? payload.sub),
      email: String(payload.email ?? ""),
      roles: (payload.roles as string[]) ?? ["user"],
    } satisfies AuthUserContext);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
