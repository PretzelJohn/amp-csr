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

subscriptionRoutes.get("/:subscriptionId/payments", async (c) => {
  const subscriptionId = Number(c.req.param("subscriptionId"));
  if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
    return c.json({ error: "Invalid subscriptionId" }, 400);
  }

  const payments = await subscriptionService.getPaymentHistory(subscriptionId);
  return c.json(payments);
});

subscriptionRoutes.patch("/:subscriptionId/status", async (c) => {
  const user = c.get("user");
  const subscriptionId = Number(c.req.param("subscriptionId"));
  if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
    return c.json({ error: "Invalid subscriptionId" }, 400);
  }

  const body = await c.req.json().catch(() => ({ status: "active" }));
  const { status } = body as { status?: string };

  const updated = await subscriptionService.updateStatus(
    user.id,
    subscriptionId,
    status ?? "active",
  );
  return c.json(updated);
});

subscriptionRoutes.post("/:subscriptionId/transfer", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const subscriptionId = Number(c.req.param("subscriptionId"));
  const vehicleId = Number(body.vehicle_id);

  if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
    return c.json({ error: "Invalid subscriptionId" }, 400);
  }

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return c.json({ error: "Invalid vehicleId" }, 400);
  }

  const updated = await subscriptionService.transferSubscriptionToVehicle(
    user.id,
    subscriptionId,
    vehicleId,
  );
  return c.json(updated);
});
