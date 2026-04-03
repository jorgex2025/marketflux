export default function AdminDashboardLoading() {
  return (
    <main className="p-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
