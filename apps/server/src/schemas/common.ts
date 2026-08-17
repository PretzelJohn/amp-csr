import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("A valid email is required.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(0).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().optional(),
});

export const customerIdParamSchema = z.object({
  customerId: z.coerce.number().int().positive(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
