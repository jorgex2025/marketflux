import { createAuthClient } from 'better-auth/react';

// NEXT_PUBLIC_API_URL debe incluir el prefijo /api si el backend lo tiene seteado
// Ej: NEXT_PUBLIC_API_URL=http://localhost:3001
// Better Auth en el backend monta sus rutas en /api/auth/*
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
