import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("A valid email is required.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const customerIdParamSchema = z.object({
  customerId: z.coerce.number().int().positive(),
});
