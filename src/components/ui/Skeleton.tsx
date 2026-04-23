import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-white/5", className)} />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[200px]">
      <Skeleton className="h-4 w-[80%]" />
      <Skeleton className="h-4 w-[100%]" />
      <Skeleton className="h-3 w-[40%] self-end" />
    </div>
  );
}
