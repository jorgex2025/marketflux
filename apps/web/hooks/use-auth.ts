'use client';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function logout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isPending,
    isAuthenticated: !!session?.user,
    logout,
  };
}
