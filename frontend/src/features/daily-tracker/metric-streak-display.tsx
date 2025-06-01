import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { calculateStreaks } from "./streak-utils";
import { Award, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricStreakDisplayProps {
  metricId: string;
  metricType: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
  style?: "badge" | "text";
}

export default function MetricStreakDisplay({
  metricId,
  metricType,
  size = "md",
  showIcon = true,
  className,
  style = "badge",
}: MetricStreakDisplayProps) {
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];

  const { currentStreak, longestStreak } = calculateStreaks(
    dailyLogs,
    metricId,
    metricType
  );

  if (currentStreak === 0 && longestStreak === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (style === "badge") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {currentStreak > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "bg-blue-50 dark:bg-blue-900",
                    sizeClasses[size]
                  )}
                >
                  {showIcon && (
                    <Flame
                      className={cn(iconSize[size], "mr-1 text-orange-500")}
                    />
                  )}
                  <span>
                    {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Current streak: {currentStreak} day
                  {currentStreak !== 1 ? "s" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {longestStreak > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "bg-amber-50 dark:bg-amber-900",
                    sizeClasses[size]
                  )}
                >
                  {showIcon && (
                    <Award
                      className={cn(iconSize[size], "mr-1 text-amber-500")}
                    />
                  )}
                  <span>Best: {longestStreak}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Longest streak: {longestStreak} day
                  {longestStreak !== 1 ? "s" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {currentStreak > 0 && (
        <div className="flex items-center text-muted-foreground">
          {showIcon && (
            <Flame className={cn(iconSize[size], "mr-1 text-orange-500")} />
          )}
          <span className={sizeClasses[size]}>{currentStreak} day streak</span>
        </div>
      )}

      {longestStreak > 0 && (
        <div className="flex items-center text-muted-foreground">
          {showIcon && (
            <Award className={cn(iconSize[size], "mr-1 text-amber-500")} />
          )}
          <span className={sizeClasses[size]}>Best: {longestStreak} days</span>
        </div>
      )}
    </div>
  );
}
