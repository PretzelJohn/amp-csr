import { createAuditLogRepo } from "../repos/audit-logs.js";
import { createCustomerRepo } from "../repos/customers.js";
import { createNoteRepo } from "../repos/notes.js";
import { createSubscriptionPaymentRepo } from "../repos/subscription-payments.js";
import { createSubscriptionRepo } from "../repos/subscriptions.js";
import { createVehicleRepo } from "../repos/vehicles.js";
import { withTransaction } from "../repos/utils.js";
import { createPurchaseRepo } from "../repos/purchases.js";

export type CustomerListItem = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export type CustomerDetail = {
  customer: Awaited<
    ReturnType<ReturnType<typeof createCustomerRepo>["getById"]>
  >;
  vehicles: Awaited<
    ReturnType<ReturnType<typeof createVehicleRepo>["listByCustomer"]>
  >;
  subscriptions: Awaited<
    ReturnType<ReturnType<typeof createSubscriptionRepo>["listByCustomer"]>
  >;
  payments: Awaited<
    ReturnType<
      ReturnType<typeof createSubscriptionPaymentRepo>["listByCustomer"]
    >
  >;
  notes: Awaited<
    ReturnType<ReturnType<typeof createNoteRepo>["listByCustomer"]>
  >;
  auditLogs: Awaited<
    ReturnType<ReturnType<typeof createAuditLogRepo>["listByCustomer"]>
  >;
};

export const customerService = {
  async list({
    page,
    pageSize,
    search,
  }: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const customerRepo = createCustomerRepo();
    const customers = await customerRepo.list();

    const filtered = search
      ? customers.filter((customer) => {
          const haystack =
            `${customer.first_name} ${customer.last_name} ${customer.email} ${customer.phone}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
      : customers;

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getById(customerId: number) {
    const customerRepo = createCustomerRepo();
    const vehicleRepo = createVehicleRepo();
    const subscriptionRepo = createSubscriptionRepo();
    const paymentRepo = createSubscriptionPaymentRepo();
    const noteRepo = createNoteRepo();
    const auditLogRepo = createAuditLogRepo();

    const [customer, vehicles, subscriptions, payments, notes, auditLogs] =
      await Promise.all([
        customerRepo.getById(customerId),
        vehicleRepo.listByCustomer(customerId),
        subscriptionRepo.listByCustomer(customerId),
        paymentRepo.listByCustomer(customerId),
        noteRepo.listByCustomer(customerId),
        auditLogRepo.listByCustomer(customerId),
      ]);

    return {
      customer,
      vehicles,
      subscriptions,
      payments,
      notes,
      auditLogs,
    } satisfies CustomerDetail;
  },

  async getAuditLogs(customerId: number) {
    const auditLogRepo = createAuditLogRepo();
    return auditLogRepo.listByCustomer(customerId);
  },

  async getNotes(customerId: number) {
    const noteRepo = createNoteRepo();
    return noteRepo.listByCustomer(customerId);
  },

  async createNote(userId: number, customerId: number, note: string) {
    return withTransaction(async (tx) => {
      const noteRepo = createNoteRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const createdNote = await noteRepo.create({
        customer_id: customerId,
        note,
      });

      //insert audit log
      await auditLogRepo.create({
        user_id: userId,
        customer_id: customerId,
        table_name: "notes",
        record_id: createdNote?.id ?? 0,
        action_type: "create",
        from: null,
        to: createdNote,
      });

      return createdNote;
    });
  },

  async updateNote(customerId: number, noteId: number, note: string) {
    const noteRepo = createNoteRepo();
    const existing = await noteRepo.getById(noteId);

    if (!existing || existing.customer_id !== customerId) {
      return null;
    }

    return noteRepo.update(noteId, { note });
  },

  async deleteNote(customerId: number, noteId: number) {
    const noteRepo = createNoteRepo();
    const existing = await noteRepo.getById(noteId);

    if (!existing || existing.customer_id !== customerId) {
      return false;
    }

    await noteRepo.delete(noteId);
    return true;
  },

  async getPurchases(customerId: number) {
    const purchaseRepo = createPurchaseRepo();
    return purchaseRepo.listByCustomer(customerId);
  },

  async getVehiclesWithSubscriptionStatus(customerId: number) {
    const vehicleRepo = createVehicleRepo();
    const subscriptionRepo = createSubscriptionRepo();

    const vehicles = await vehicleRepo.listByCustomer(customerId);
    const subscriptions = await subscriptionRepo.listByCustomer(customerId);

    return vehicles.map((vehicle) => {
      const current = subscriptions.find(
        (sub) => sub.vehicle_id === vehicle.id,
      );
      return {
        ...vehicle,
        subscriptionStatus: current?.status ?? null,
        subscriptionPlan: current?.plan ?? null,
      };
    });
  },

  async updateCustomerProfile(
    userId: number,
    customerId: number,
    patch: Record<string, unknown>,
  ) {
    return withTransaction(async (tx) => {
      const customerRepo = createCustomerRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const previous = await customerRepo.getById(customerId);
      if (!previous) {
        throw new Error("Customer not found");
      }

      // Compare previous and patch to determine what changed
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of Object.keys(patch)) {
        if (
          previous[key as keyof typeof previous] !==
          patch[key as keyof typeof patch]
        ) {
          changes[key] = {
            from: previous[key as keyof typeof previous],
            to: patch[key as keyof typeof patch],
          };
        }
      }

      if (Object.keys(changes).length > 0) {
        const updated = await customerRepo.update(customerId, patch as never);
        if (!updated) {
          throw new Error("Customer could not be updated");
        }

        await auditLogRepo.create({
          user_id: userId,
          customer_id: customerId,
          table_name: "customers",
          record_id: customerId,
          action_type: "update",
          from: previous,
          to: patch,
        });

        return updated;
      }

      return null; // No changes were made
    });
  },
};
