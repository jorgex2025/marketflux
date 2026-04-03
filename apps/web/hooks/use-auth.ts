'use client';
import { useSession, signOut } from '../lib/auth-client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  image?: string | null;
};

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id:    session.user.id,
        name:  session.user.name,
        email: session.user.email,
        role:  (session.user as { role?: string }).role as AuthUser['role'] ?? 'buyer',
        image: session.user.image,
      }
    : null;

  return {
    user,
    isLoading:       isPending,
    isAuthenticated: Boolean(user),
    isAdmin:         user?.role === 'admin',
    isSeller:        user?.role === 'seller' || user?.role === 'admin',
    error,
    signOut: () => signOut(),
  };
}
