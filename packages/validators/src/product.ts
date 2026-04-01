import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid(),
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;
