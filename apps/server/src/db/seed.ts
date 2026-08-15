import { seed } from "drizzle-seed";
import { db } from "./index.js";
import {
  customersTable,
  subscriptionsTable,
  vehiclesTable,
  subscriptionPaymentsTable,
  purchasesTable,
  notesTable,
  auditLogsTable,
} from "./schema.js";
import { exit } from "process";

async function seedDatabase() {
  console.log("Seeding database...");

  console.log("Seeding customers table...");
  await seed(db, { customersTable }, { seed: 12345 }).refine((f) => ({
    customersTable: {
      count: 10,
      columns: {
        phone: f.phoneNumber({ template: "+1555#######" }),
      },
    },
  }));

  console.log("Seeding vehicles table...");
  const thisYear = new Date().getFullYear();
  await seed(db, { vehiclesTable }, { seed: 12345 }).refine((f) => ({
    vehiclesTable: {
      count: 20,
      columns: {
        year: f.int({ minValue: 1990, maxValue: thisYear + 1 }),
        make: f.valuesFromArray({
          values: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan"],
        }),
        model: f.valuesFromArray({
          values: [
            "Camry",
            "Civic",
            "F-150",
            "Silverado",
            "Altima",
            "Accord",
            "Escape",
            "Tahoe",
            "Rogue",
          ],
        }),
        license_plate: f.string({ isUnique: true }),
      },
    },
  }));

  console.log("Seeding subscriptions table...");
  await seed(db, { subscriptionsTable }, { seed: 12345 }).refine((f) => ({
    subscriptionsTable: {
      count: 10,
      columns: {
        customer_id: f.int({ minValue: 1, maxValue: 10 }),
        vehicle_id: f.int({ minValue: 1, maxValue: 20 }),
        plan: f.valuesFromArray({
          values: ["Basic", "Standard", "Premium"],
        }),
        status: f.valuesFromArray({
          values: ["active", "paused", "canceled"],
        }),
      },
    },
  }));

  console.log("Seeding subscription payments table...");
  await seed(db, { subscriptionPaymentsTable }, { seed: 12345 }).refine(
    (f) => ({
      subscriptionPaymentsTable: {
        count: 100,
        columns: {
          subscription_id: f.int({ minValue: 1, maxValue: 10 }),
          amount: f.number({ minValue: 10, maxValue: 100, precision: 100 }),
          status: f.valuesFromArray({
            values: ["completed", "failed", "pending"],
          }),
        },
      },
    }),
  );

  console.log("Seeding purchases table...");
  await seed(db, { purchasesTable }, { seed: 12345 }).refine((f) => ({
    purchasesTable: {
      count: 100,
      columns: {
        customer_id: f.int({ minValue: 1, maxValue: 10 }),
        type: f.valuesFromArray({
          values: ["wash", "membership", "coupon", "adjustment"],
        }),
        description: f.string(),
        amount: f.number({ minValue: 5, maxValue: 50, precision: 100 }),
        status: f.valuesFromArray({
          values: ["completed", "failed", "pending"],
        }),
      },
    },
  }));

  console.log("Seeding notes table...");
  await seed(db, { notesTable }, { seed: 12345 }).refine((f) => ({
    notesTable: {
      count: 50,
      columns: {
        customer_id: f.int({ minValue: 1, maxValue: 10 }),
        note: f.loremIpsum({ sentencesCount: 3 }),
      },
    },
  }));

  console.log("Seeding audit logs table...");
  await seed(db, { auditLogsTable }, { seed: 12345 }).refine((f) => ({
    auditLogsTable: {
      count: 200,
      columns: {
        customer_id: f.int({ minValue: 1, maxValue: 10 }),
        table_name: f.valuesFromArray({
          values: [
            "customers",
            "vehicles",
            "subscriptions",
            "subscription_payments",
            "purchases",
            "notes",
          ],
        }),
        record_id: f.int({ minValue: 1, maxValue: 10 }),
        action_type: f.valuesFromArray({
          values: ["create", "update", "delete"],
        }),
        from: f.json(),
        to: f.json(),
      },
    },
  }));

  console.log("Database seeding complete.");
  exit(0);
}

seedDatabase();
