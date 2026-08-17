import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import type { PgTimestampConfig } from "drizzle-orm/pg-core";

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

//users table: not implemented for this project, but a real portal would have a users table for CSR authentication and authorization

//audit_logs table: stores audit logs for all actions performed by CSRs on customer accounts
export const auditLogsTable = pgTable("audit_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  //user_id: integer().notNull().references(() => usersTable.id), //the CSR who performed the action
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

//purchases table: stores customer purchase information
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

//transactions table: stores customer transaction information for subscription payments
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
