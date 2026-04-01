import { z } from 'zod';

export const CreateOrderSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddressId: z.string().uuid(),
  shippingMethodId: z.string().uuid(),
  couponCode: z.string().optional(),
});

export type CreateOrder = z.infer<typeof CreateOrderSchema>;
