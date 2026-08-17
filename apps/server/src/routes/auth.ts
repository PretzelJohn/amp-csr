import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { loginSchema } from "../schemas/common.js";
import { loginUser, verifyJwt } from "../services/auth.js";
import { z } from "zod";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  try {
    const result = await loginUser(parsed.data);
    setCookie(c, "token", result.token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
    });

    return c.json({
      access_token: result.token,
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
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
