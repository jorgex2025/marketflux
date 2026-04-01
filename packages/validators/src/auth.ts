import { z } from 'zod';

export const SignUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
