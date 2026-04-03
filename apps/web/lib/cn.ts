import { clsx, type ClassValue } from 'clsx';
import { tailwindMerge } from 'tailwind-merge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const twMerge = (tailwindMerge as any).twMerge ?? tailwindMerge;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
