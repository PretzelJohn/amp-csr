import { z } from "zod";

export const customerRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .loose();

export const subscriptionRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    vehicleName: z.string(),
    plate: z.string(),
    plan: z.string(),
    status: z.string(),
    renewalDate: z.string(),
    autoRenew: z.boolean(),
  })
  .loose();

export const purchaseRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    description: z.string(),
    type: z.string(),
    date: z.string(),
    amount: z.number(),
    status: z.string(),
  })
  .loose();

export const noteRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    customer_id: z.union([z.string(), z.number()]),
    note: z.string(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .loose();

export const customerDetailRecordSchema = customerRecordSchema
  .extend({
    subscriptions: z.array(subscriptionRecordSchema),
    purchaseHistory: z.array(purchaseRecordSchema),
    notes: z.array(noteRecordSchema),
  })
  .loose();

export type CustomerRecord = z.infer<typeof customerRecordSchema>;
export type SubscriptionRecord = z.infer<typeof subscriptionRecordSchema>;
export type PurchaseRecord = z.infer<typeof purchaseRecordSchema>;
export type NoteRecord = z.infer<typeof noteRecordSchema>;
export type CustomerDetailRecord = z.infer<typeof customerDetailRecordSchema>;
