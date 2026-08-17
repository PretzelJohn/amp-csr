import { createAuditLogRepo } from "../repos/audit-logs.js";
import { createSubscriptionPaymentRepo } from "../repos/subscription-payments.js";
import { createSubscriptionRepo } from "../repos/subscriptions.js";
import { withTransaction } from "../repos/utils.js";
import { createVehicleRepo } from "../repos/vehicles.js";

const validStatuses = new Set([
  "active",
  "paused",
  "overdue",
  "expired",
  "cancelled",
]);

export const subscriptionService = {
  async getByCustomer(customerId: number) {
    const repo = createSubscriptionRepo();
    return repo.listByCustomer(customerId);
  },

  async getByVehicle(vehicleId: number) {
    const repo = createSubscriptionRepo();
    return repo.listByVehicle(vehicleId);
  },

  async getPaymentsByCustomer(customerId: number) {
    const repo = createSubscriptionPaymentRepo();
    return repo.listByCustomer(customerId);
  },

  async getPaymentHistory(subscriptionId: number) {
    const repo = createSubscriptionPaymentRepo();
    return repo.listBySubscription(subscriptionId);
  },

  async createForCustomer(
    userId: number,
    customerId: number,
    subscription: {
      vehicle_id: number;
      plan: string;
      starts_at?: string | Date | null;
      ends_at?: string | Date | null;
      status?: string;
    },
  ) {
    const plan = subscription.plan?.trim();
    if (!plan) {
      throw new Error("Subscription plan is required");
    }

    const nextStatus = subscription.status ?? "active";
    if (!validStatuses.has(nextStatus)) {
      throw new Error(`Unsupported subscription status: ${nextStatus}`);
    }

    return withTransaction(async (tx) => {
      const subscriptionRepo = createSubscriptionRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const created = await subscriptionRepo.create({
        customer_id: customerId,
        vehicle_id: subscription.vehicle_id,
        plan,
        starts_at: subscription.starts_at
          ? new Date(subscription.starts_at)
          : new Date(),
        ends_at: subscription.ends_at ? new Date(subscription.ends_at) : null,
        status: nextStatus,
      });

      if (!created) {
        throw new Error("Subscription could not be created");
      }

      await auditLogRepo.create({
        user_id: userId,
        customer_id: customerId,
        table_name: "subscriptions",
        record_id: created.id,
        action_type: "create",
        from: null,
        to: created,
      });

      return created;
    });
  },

  async transferSubscriptionToVehicle(
    userId: number,
    subscriptionId: number,
    targetVehicleId: number,
  ) {
    if (!Number.isFinite(targetVehicleId) || targetVehicleId <= 0) {
      throw new Error("Invalid vehicleId");
    }
    if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
      throw new Error("Invalid subscriptionId");
    }

    return withTransaction(async (tx) => {
      const subscriptionRepo = createSubscriptionRepo(tx);
      const vehicleRepo = createVehicleRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const previous = await subscriptionRepo.getById(subscriptionId);
      if (!previous) {
        throw new Error("Subscription not found");
      }

      const targetVehicle = await vehicleRepo.getById(targetVehicleId);
      if (!targetVehicle) {
        throw new Error("Target vehicle not found");
      }

      const updated = await subscriptionRepo.update(subscriptionId, {
        vehicle_id: targetVehicleId,
      });
      if (!updated) {
        throw new Error("Subscription could not be moved to the new vehicle");
      }

      await auditLogRepo.create({
        user_id: userId,
        customer_id: updated.customer_id,
        table_name: "subscriptions",
        record_id: subscriptionId,
        action_type: "update",
        from: previous,
        to: updated,
      });

      return updated;
    });
  },

  async updateStatus(
    userId: number,
    subscriptionId: number,
    nextStatus: string,
  ) {
    if (!validStatuses.has(nextStatus)) {
      throw new Error(`Unsupported subscription status: ${nextStatus}`);
    }

    return withTransaction(async (tx) => {
      const subscriptionRepo = createSubscriptionRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const previous = await subscriptionRepo.getById(subscriptionId);
      if (!previous) {
        throw new Error("Subscription not found");
      }

      const updated = await subscriptionRepo.update(subscriptionId, {
        status: nextStatus,
      });
      if (!updated) {
        throw new Error("Subscription could not be updated");
      }

      await auditLogRepo.create({
        user_id: userId,
        customer_id: updated.customer_id,
        table_name: "subscriptions",
        record_id: subscriptionId,
        action_type: "update",
        from: previous,
        to: updated,
      });

      return updated;
    });
  },
};
