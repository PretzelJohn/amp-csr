import { Hono } from "hono";
import { loginSchema } from "../schemas/common.js";
import { getUserById, loginUser } from "../services/auth.js";
import { z } from "zod";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  try {
    const result = await loginUser(parsed.data);

    return c.json({
      access_token: result.access_token,
      user: result.user,
    });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Authentication failed.",
      },
      401,
    );
  }
});

authRoutes.get("/me", async (c) => {
  const user = c.get("user");

  try {
    const storedUser = await getUserById(user.id);

    return c.json({
      user: {
        id: storedUser.id,
        first_name: storedUser.first_name,
        last_name: storedUser.last_name,
        email: storedUser.email,
        roles: storedUser.roles,
      },
    });
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
