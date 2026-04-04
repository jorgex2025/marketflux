/**
 * use-auth.ts
 * Custom hook for authentication state management.
 * Wraps Better Auth's useSession hook.
 */
import { useSession, signIn, signOut } from '@/lib/auth-client';

export function useAuth() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user ?? null,
    session,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    signIn,
    signOut,
  };
}