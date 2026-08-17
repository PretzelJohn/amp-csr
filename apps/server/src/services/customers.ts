import { createAuditLogRepo, AuditLog } from "../repos/audit-logs.js";
import { createCustomerRepo, Customer } from "../repos/customers.js";
import {
  createSubscriptionRepo,
  Subscription,
} from "../repos/subscriptions.js";
import {
  createSubscriptionPaymentRepo,
  PaymentWithSubscription,
} from "../repos/subscription-payments.js";
import { createNoteRepo, Note } from "../repos/notes.js";
import { createVehicleRepo, Vehicle } from "../repos/vehicles.js";
import { withTransaction } from "../repos/utils.js";
import { createPurchaseRepo, Purchase } from "../repos/purchases.js";
import { PaginationQuery } from "../schemas/common.js";
import { createVehicleOwnersRepo } from "../repos/vehicle-owners.js";

export type CustomerListItem = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export type CustomerDetail = {
  customer: Customer | null;
  vehicles: Vehicle[];
  subscriptions: Subscription[];
  payments: PaymentWithSubscription[];
  purchases: Purchase[];
  notes: Note[];
  auditLogs: AuditLog[];
};

export const customerService = {
  async list({ limit, offset, q }: PaginationQuery) {
    const customerRepo = createCustomerRepo();
    const customers = await customerRepo.list();

    const filtered = q
      ? customers.filter((customer) => {
          const haystack =
            `${customer.first_name} ${customer.last_name} ${customer.email} ${customer.phone}`.toLowerCase();
          return haystack.includes(q.toLowerCase());
        })
      : customers;

    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      limit,
      offset,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getById(customerId: number) {
    const customerRepo = createCustomerRepo();
    const vehicleRepo = createVehicleRepo();
    const subscriptionRepo = createSubscriptionRepo();
    const paymentRepo = createSubscriptionPaymentRepo();
    const purchasesRepo = createPurchaseRepo();
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
      purchasesRepo.listByCustomer(customerId),
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

  async updateNote(
    userId: number,
    customerId: number,
    noteId: number,
    note: string,
  ) {
    return withTransaction(async (tx) => {
      const noteRepo = createNoteRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const existing = await noteRepo.getById(noteId);

      if (!existing || existing.customer_id !== customerId) {
        return null;
      }

      const updatedNote = await noteRepo.update(noteId, { note });

      //insert audit log
      await auditLogRepo.create({
        user_id: userId,
        customer_id: customerId,
        table_name: "notes",
        record_id: noteId,
        action_type: "update",
        from: existing,
        to: updatedNote,
      });

      return updatedNote;
    });
  },

  async deleteNote(userId: number, customerId: number, noteId: number) {
    return withTransaction(async (tx) => {
      const noteRepo = createNoteRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const existing = await noteRepo.getById(noteId);

      if (!existing || existing.customer_id !== customerId) {
        return false;
      }

      await noteRepo.delete(noteId);

      //insert audit log
      await auditLogRepo.create({
        user_id: userId,
        customer_id: customerId,
        table_name: "notes",
        record_id: noteId,
        action_type: "delete",
        from: existing,
        to: null,
      });

      return true;
    });
  },

  async getPurchases(customerId: number) {
    const purchaseRepo = createPurchaseRepo();
    return purchaseRepo.listByCustomer(customerId);
  },

  async getVehicles(customerId: number) {
    const vehicleRepo = createVehicleRepo();
    return vehicleRepo.listByCustomer(customerId);
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

  async createVehicleForCustomer(
    userId: number,
    customerId: number,
    vehicleInput: {
      year: number;
      make: string;
      model: string;
      license_plate: string;
    },
  ) {
    return withTransaction(async (tx) => {
      const vehicleRepo = createVehicleRepo(tx);
      const vehicleOwnersRepo = createVehicleOwnersRepo(tx);
      const auditLogRepo = createAuditLogRepo(tx);

      const vehicle = await vehicleRepo.create(vehicleInput);

      if (!vehicle) {
        throw new Error("Vehicle could not be created");
      }

      await vehicleOwnersRepo.create({
        vehicle_id: vehicle.id,
        customer_id: customerId,
      });

      await auditLogRepo.create({
        user_id: userId,
        customer_id: customerId,
        table_name: "vehicles",
        record_id: vehicle.id,
        action_type: "create",
        from: null,
        to: vehicle,
      });

      return vehicle;
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
