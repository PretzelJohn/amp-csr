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
  rolesTable,
  usersTable,
  usersToRolesTable,
} from "./schema.js";
import { exit } from "process";
import { hashPassword } from "../lib/passwords.js";

async function seedDatabase() {
  console.log("Seeding database...");

  console.log("Seeding roles table...");
  await seed(db, { rolesTable }, { seed: 12345 }).refine((f) => ({
    rolesTable: {
      count: 1,
      columns: {
        name: f.valuesFromArray({ values: ["user"] }),
        description: f.valuesFromArray({ values: ["User role"] }),
      },
    },
  }));

  console.log("Seeding users table...");
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
  if (defaultPassword) {
    const hashedPassword = await hashPassword(defaultPassword);
    await seed(db, { usersTable }, { seed: 12345 }).refine((f) => ({
      usersTable: {
        count: 1,
        columns: {
          first_name: f.valuesFromArray({ values: ["Default"] }),
          last_name: f.valuesFromArray({ values: ["User"] }),
          email: f.valuesFromArray({ values: ["user@example.com"] }),
          password_hash: f.valuesFromArray({
            values: [hashedPassword],
          }),
        },
      },
    }));
  } else {
    console.error(
      "DEFAULT_USER_PASSWORD environment variable is not set. Please set it before running the seed script to create a default user account.",
    );
    exit(1);
  }

  console.log("Seeding users_to_roles table...");
  await db.insert(usersToRolesTable).values({
    user_id: 1,
    role_id: 1,
  });

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

  console.log("Database seeding complete.");
  exit(0);
}

seedDatabase();
