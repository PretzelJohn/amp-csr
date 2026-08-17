import { createAuditLogRepo } from "../repos/audit-logs.js";
import { createSubscriptionPaymentRepo } from "../repos/subscription-payments.js";
import { createSubscriptionRepo } from "../repos/subscriptions.js";
import { withTransaction } from "../repos/utils.js";

const validStatuses = new Set(["active", "paused", "cancelled", "past_due"]);

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

  async updateStatus(subscriptionId: number, nextStatus: string) {
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
        user_id: 1,
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
