import { Hono } from "hono";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mockUser = {
  id: 42,
  email: "user@example.com",
  first_name: "Default",
  last_name: "User",
  password_hash: "hashed-password",
  usersToRoles: [{ role: { name: "user" } }],
};

vi.mock("../lib/passwords.js", () => ({
  comparePassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("../repos/users.js", () => ({
  createUserRepo: vi.fn(() => ({
    getByEmail: vi.fn().mockResolvedValue(mockUser),
    getById: vi.fn().mockResolvedValue(mockUser),
  })),
}));

describe("authRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("JWT_SECRET", "test-jwt-secret");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns the auth token and user payload on login", async () => {
    const { authRoutes } = await import("./auth.js");
    const app = new Hono();
    app.route("/api/v1/auth", authRoutes);

    const response = await app.request(
      "http://localhost:4000/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "admin123",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      user: {
        id: 42,
        first_name: "Default",
        last_name: "User",
        email: "user@example.com",
        roles: ["user"],
      },
    });
  });
});
