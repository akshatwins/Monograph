import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-pulse rounded-md bg-bg-subtle", className)} />;
}
