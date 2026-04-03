/**
 * auth-client.ts
 * Better Auth client instance for the web app.
 * Exports `useSession` and `authClient` for use in client components.
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

export const { useSession, signIn, signOut } = authClient;
