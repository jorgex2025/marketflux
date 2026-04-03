export default function VendorDashboardLoading() {
  return (
    <main className="p-6">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
