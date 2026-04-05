/**
 * auth-client.ts
 * Better Auth client instance for the web app.
 * Exports `useSession` and `authClient` for use in client components.
 */
import { createAuthClient } from 'better-auth/react';

declare module 'better-auth/react' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      role: 'admin' | 'seller' | 'buyer';
      createdAt: Date;
      updatedAt: Date;
      image?: string | null;
    }
  }
}

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

export const { useSession, signIn, signOut } = authClient;

// Note: Better Auth's client doesn't expose forgetPassword directly
// We'll use the resetPassword method instead in forgot-password page
