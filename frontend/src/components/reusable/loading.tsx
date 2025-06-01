export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
