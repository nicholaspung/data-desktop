import { cn } from "@/lib/utils";
import { Infinity as InfinityIcon } from "lucide-react";

interface OngoingIndicatorProps {
  daysElapsed: number;
  className?: string;
}

export function OngoingIndicator({
  daysElapsed,
  className,
}: OngoingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <div className="h-1.5 w-24 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full" />
        </div>
        <InfinityIcon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm text-muted-foreground">
        Day {daysElapsed} - Ongoing
      </span>
    </div>
  );
}
