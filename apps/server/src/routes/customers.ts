import { Hono } from "hono";
import {
  customerIdParamSchema,
  paginationQuerySchema,
} from "../schemas/common.js";
import { customerService } from "../services/customers.js";
import { subscriptionService } from "../services/subscriptions.js";

export const customerRoutes = new Hono();

customerRoutes.get("/", async (c) => {
  const query = paginationQuerySchema.parse(c.req.query());
  const result = await customerService.list(query);
  return c.json(result);
});

customerRoutes.get("/:customerId", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });

  const result = await customerService.getById(customerId);

  if (!result.customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  return c.json(result);
});

customerRoutes.get("/:customerId/vehicles", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const vehicles =
    await customerService.getVehiclesWithSubscriptionStatus(customerId);
  return c.json(vehicles);
});

customerRoutes.get("/:customerId/notes", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const notes = await customerService.getNotes(customerId);
  return c.json(notes);
});

customerRoutes.post("/:customerId/notes", async (c) => {
  const user = c.get("user");
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const body = await c.req.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!note) {
    return c.json({ error: "Note is required" }, 400);
  }

  const created = await customerService.createNote(user.id, customerId, note);
  return c.json(created);
});

customerRoutes.patch("/:customerId/notes/:noteId", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const noteId = Number(c.req.param("noteId"));

  if (!Number.isFinite(noteId)) {
    return c.json({ error: "Invalid note id" }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!note) {
    return c.json({ error: "Note is required" }, 400);
  }

  const updated = await customerService.updateNote(customerId, noteId, note);
  if (!updated) {
    return c.json({ error: "Note not found" }, 404);
  }

  return c.json(updated);
});

customerRoutes.delete("/:customerId/notes/:noteId", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const noteId = Number(c.req.param("noteId"));

  if (!Number.isFinite(noteId)) {
    return c.json({ error: "Invalid note id" }, 400);
  }

  const deleted = await customerService.deleteNote(customerId, noteId);
  if (!deleted) {
    return c.json({ error: "Note not found" }, 404);
  }

  return c.json({ success: true });
});

customerRoutes.get("/:customerId/subscriptions", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const subscriptions = await subscriptionService.getByCustomer(customerId);
  return c.json(subscriptions);
});

customerRoutes.post("/:customerId/subscriptions", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });

  const body = await c.req.json().catch(() => ({}));
  const vehicleId = Number(body.vehicle_id);
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";

  if (!Number.isFinite(vehicleId) || vehicleId <= 0) {
    return c.json({ error: "Invalid vehicle_id" }, 400);
  }

  if (!plan) {
    return c.json({ error: "Subscription plan is required" }, 400);
  }

  const created = await subscriptionService.createForCustomer(customerId, {
    vehicle_id: vehicleId,
    plan,
    starts_at: body.starts_at,
    ends_at: body.ends_at ?? null,
    status: typeof body.status === "string" ? body.status : "active",
  });

  return c.json(created);
});

customerRoutes.get("/:customerId/payments", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const payments = await subscriptionService.getPaymentsByCustomer(customerId);
  return c.json(payments);
});

customerRoutes.get("/:customerId/purchases", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const purchases = await customerService.getPurchases(customerId);
  return c.json(purchases);
});

customerRoutes.get("/:customerId/audit-logs", async (c) => {
  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const logs = await customerService.getAuditLogs(customerId);
  return c.json(logs);
});

customerRoutes.patch("/:customerId", async (c) => {
  const user = c.get("user");

  const { customerId } = customerIdParamSchema.parse({
    customerId: c.req.param("customerId"),
  });
  const body = await c.req.json().catch(() => ({}));

  const updated = await customerService.updateCustomerProfile(
    user.id,
    customerId,
    body,
  );

  if (!updated) {
    return c.json({ error: "No changes were made" }, 404);
  }

  return c.json(updated);
});
