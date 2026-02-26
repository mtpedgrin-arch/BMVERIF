import { z } from "zod";

export const productCreateSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  priceCents: z.number().int().min(0),
  currency: z.string().min(3).max(3).default("USD"),
  downloadUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});
