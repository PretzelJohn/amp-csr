import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  jsonb,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { PgTimestampConfig } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

// Shared data type options for all tables
const timestampOptions: PgTimestampConfig<"date"> = {
  precision: 6,
  withTimezone: true,
};

const priceOptions = {
  precision: 10,
  scale: 2,
};

const timestamps = {
  created_at: timestamp("created_at", timestampOptions).notNull().defaultNow(),
  updated_at: timestamp("updated_at", timestampOptions).notNull().defaultNow(),
};

//TABLES - defines the database schema for the application

//audit_logs table: stores immutable audit logs for all actions performed by CSRs on customer accounts
export const auditLogsTable = pgTable("audit_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id), //the CSR who performed the action
  customer_id: integer()
    .notNull()
    .references(() => customersTable.id), //the customer account affected by the action
  table_name: varchar({ length: 50 }).notNull(), //the table affected by the action
  record_id: integer().notNull(), //the primary key of the record affected by the action
  action_type: text().notNull(),
  from: jsonb(),
  to: jsonb(),
  created_at: timestamp("created_at", timestampOptions).notNull().defaultNow(),
  //no updated_at for audit logs, as they should be immutable
});

//customers table: stores customer account information
export const customersTable = pgTable("customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  first_name: varchar({ length: 255 }).notNull(),
  last_name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 20 }).notNull(),
  ...timestamps,
});

//notes table: stores CSR notes for each customer account
export const notesTable = pgTable("notes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customer_id: integer()
    .notNull()
    .references(() => customersTable.id),
  note: text().notNull(),
  ...timestamps,
});

//purchases table: stores immutable customer purchase information
export const purchasesTable = pgTable("purchases", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customer_id: integer()
    .notNull()
    .references(() => customersTable.id),
  type: varchar({ length: 50 }).notNull(),
  description: text().notNull(),
  purchased_at: timestamp("purchased_at", timestampOptions).notNull(),
  amount: numeric("amount", priceOptions).notNull(),
  status: varchar({ length: 50 }).notNull(),
  ...timestamps,
});

//roles table: stores CSR user roles and permissions
export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
  description: text(),
  ...timestamps,
});

//subscriptions table: stores customer subscription information
export const subscriptionsTable = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customer_id: integer()
    .notNull()
    .references(() => customersTable.id),
  vehicle_id: integer()
    .notNull()
    .references(() => vehiclesTable.id),
  plan: varchar({ length: 100 }).notNull(),
  starts_at: timestamp("starts_at", timestampOptions).notNull(),
  ends_at: timestamp("ends_at", timestampOptions),
  status: varchar({ length: 50 }).notNull(),
  ...timestamps,
});

//transactions table: stores immutable customer transaction information for subscription payments
export const subscriptionPaymentsTable = pgTable("subscription_payments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subscription_id: integer()
    .notNull()
    .references(() => subscriptionsTable.id),
  amount: numeric("amount", priceOptions).notNull(),
  payment_at: timestamp("payment_at", timestampOptions).notNull(), //may be different from created_at if we want to record the actual time of the transaction
  status: varchar({ length: 50 }).notNull(),
  ...timestamps,
});

//users table: stores CSR user information
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  last_seen_at: timestamp("last_seen_at", timestampOptions)
    .notNull()
    .defaultNow(),
  ...timestamps,
});

//user roles table: stores the many-to-many relationship between users and roles
export const usersToRolesTable = pgTable(
  "users_to_roles",
  {
    user_id: integer()
      .notNull()
      .references(() => usersTable.id),
    role_id: integer()
      .notNull()
      .references(() => rolesTable.id),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.user_id, t.role_id] })],
);

//vehicles table: stores customer vehicle information
export const vehiclesTable = pgTable("vehicles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  year: integer().notNull(),
  make: varchar({ length: 100 }).notNull(),
  model: varchar({ length: 100 }).notNull(),
  license_plate: varchar({ length: 20 }).notNull().unique(),
  //could use VIN instead of license plate, but for this project, we'll use license plate as the unique identifier for vehicles to keep it simple and easier for automated license plate scanning
  ...timestamps,
});

//vehicle owners table: stores the ownership data of vehicles per customer
export const vehicleOwnersTable = pgTable(
  "vehicle_owners",
  {
    vehicle_id: integer()
      .notNull()
      .references(() => vehiclesTable.id),
    customer_id: integer()
      .notNull()
      .references(() => customersTable.id),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.vehicle_id, t.customer_id] })],
);

//RELATIONS - sets up drizzle ORM relations between tables for easier querying and joins

//customers -> notes 1:M
//customers -> purchases 1:M
//customers -> subscriptions 1:M
//customers -> audit_logs 1:M
export const customersRelations = relations(customersTable, ({ many }) => ({
  notes: many(notesTable),
  purchases: many(purchasesTable),
  subscriptions: many(subscriptionsTable),
  auditLogs: many(auditLogsTable),
}));

//notes -> customers M:1
export const notesRelations = relations(notesTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [notesTable.customer_id],
    references: [customersTable.id],
  }),
}));

//purchases -> customers M:1
export const purchasesRelations = relations(purchasesTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [purchasesTable.customer_id],
    references: [customersTable.id],
  }),
}));

//subscriptions -> customers M:1
//subscriptions -> subscription_payments 1:M
//subscriptions -> vehicles 1:1
export const subscriptionsRelations = relations(
  subscriptionsTable,
  ({ many, one }) => ({
    customer: one(customersTable, {
      fields: [subscriptionsTable.customer_id],
      references: [customersTable.id],
    }),
    payments: many(subscriptionPaymentsTable),
    vehicle: one(vehiclesTable, {
      fields: [subscriptionsTable.vehicle_id],
      references: [vehiclesTable.id],
    }),
  }),
);

//payments -> subscriptions M:1
export const subscriptionPaymentsRelations = relations(
  subscriptionPaymentsTable,
  ({ one }) => ({
    subscription: one(subscriptionsTable, {
      fields: [subscriptionPaymentsTable.subscription_id],
      references: [subscriptionsTable.id],
    }),
  }),
);

//vehicles -> subscriptions 1:1
export const vehiclesRelations = relations(vehiclesTable, ({ one }) => ({
  subscription: one(subscriptionsTable, {
    fields: [vehiclesTable.id],
    references: [subscriptionsTable.vehicle_id],
  }),
}));

//users -> roles M:N (through users_to_roles)
//users -> audit_logs 1:M
export const usersRelations = relations(usersTable, ({ many }) => ({
  usersToRoles: many(usersToRolesTable),
  auditLogs: many(auditLogsTable),
}));

//roles -> users M:N (through users_to_roles)
export const rolesRelations = relations(rolesTable, ({ many }) => ({
  usersToRoles: many(usersToRolesTable),
}));

//users_to_roles -> users M:1
//users_to_roles -> roles M:1
export const usersToRolesRelations = relations(
  usersToRolesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToRolesTable.user_id],
      references: [usersTable.id],
    }),
    role: one(rolesTable, {
      fields: [usersToRolesTable.role_id],
      references: [rolesTable.id],
    }),
  }),
);

//audit_logs -> users M:1
//audit_logs -> customers M:1
export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [auditLogsTable.user_id],
    references: [usersTable.id],
  }),
  customer: one(customersTable, {
    fields: [auditLogsTable.customer_id],
    references: [customersTable.id],
  }),
}));
