import { Hono } from "hono";
import { customerIdParamSchema } from "../schemas/common.js";
import { subscriptionService } from "../services/subscriptions.js";

export const subscriptionRoutes = new Hono();

subscriptionRoutes.get("/customers/:customerId", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const subscriptions = await subscriptionService.getByCustomer(customerId);
  return c.json(subscriptions);
});

subscriptionRoutes.get("/vehicles/:vehicleId", async (c) => {
  const vehicleId = Number(c.req.param("vehicleId"));
  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return c.json({ error: "Invalid vehicleId" }, 400);
  }

  const subscriptions = await subscriptionService.getByVehicle(vehicleId);
  return c.json(subscriptions);
});

subscriptionRoutes.get("/:subscriptionId/payments", async (c) => {
  const subscriptionId = Number(c.req.param("subscriptionId"));
  if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
    return c.json({ error: "Invalid subscriptionId" }, 400);
  }

  const payments = await subscriptionService.getPaymentHistory(subscriptionId);
  return c.json(payments);
});

subscriptionRoutes.patch("/:subscriptionId/status", async (c) => {
  const subscriptionId = Number(c.req.param("subscriptionId"));
  if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
    return c.json({ error: "Invalid subscriptionId" }, 400);
  }

  const body = await c.req.json().catch(() => ({ status: "active" }));
  const { status } = body as { status?: string };

  const updated = await subscriptionService.updateStatus(
    subscriptionId,
    status ?? "active",
  );
  return c.json(updated);
});
