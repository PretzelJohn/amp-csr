import { createAuditLogRepo } from "../repos/audit-logs.js";
import { createCustomerRepo } from "../repos/customers.js";
import { createNoteRepo } from "../repos/notes.js";
import { createPurchaseRepo } from "../repos/purchases.js";
import { createSubscriptionPaymentRepo } from "../repos/subscription-payments.js";
import { createSubscriptionRepo } from "../repos/subscriptions.js";
import { createVehicleRepo } from "../repos/vehicles.js";

export const accountService = {
  async getCustomerAccountProfile(customerId: number) {
    const customerRepo = createCustomerRepo();
    const vehicleRepo = createVehicleRepo();
    const subscriptionRepo = createSubscriptionRepo();
    const paymentRepo = createSubscriptionPaymentRepo();
    const purchaseRepo = createPurchaseRepo();
    const noteRepo = createNoteRepo();
    const auditLogRepo = createAuditLogRepo();

    const [
      customer,
      vehicles,
      subscriptions,
      payments,
      purchases,
      notes,
      auditLogs,
    ] = await Promise.all([
      customerRepo.getById(customerId),
      vehicleRepo.listByCustomer(customerId),
      subscriptionRepo.listByCustomer(customerId),
      paymentRepo.listByCustomer(customerId),
      purchaseRepo.listByCustomer(customerId),
      noteRepo.listByCustomer(customerId),
      auditLogRepo.listByCustomer(customerId),
    ]);

    return {
      customer,
      vehicles,
      subscriptions,
      payments,
      purchases,
      notes,
      auditLogs,
    };
  },
};
