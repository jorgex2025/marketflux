'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 400);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounced.trim()) {
      router.push(`/search?q=${encodeURIComponent(debounced.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar productos..."
        className="pl-9"
      />
    </form>
  );
}
