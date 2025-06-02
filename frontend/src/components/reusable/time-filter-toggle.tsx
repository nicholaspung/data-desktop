import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import {
  timeFilterStore,
  toggleHiddenHour,
  clearHiddenHours,
} from "@/store/time-filter-store";
import ReusableCollapsible from "./reusable-collapsible";

interface TimeFilterToggleProps {
  className?: string;
  compact?: boolean;
}

export default function TimeFilterToggle({
  className,
  compact = false,
}: TimeFilterToggleProps) {
  const hiddenHours = useStore(timeFilterStore, (state) => state.hiddenHours);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const hasHiddenHours = hiddenHours.length > 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-8 px-2 text-xs",
            hasHiddenHours && "text-orange-600 dark:text-orange-400"
          )}
        >
          {hasHiddenHours ? (
            <EyeOff className="h-3 w-3 mr-1" />
          ) : (
            <Eye className="h-3 w-3 mr-1" />
          )}
          Filter Hours
          {hasHiddenHours && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {hiddenHours.length}
            </Badge>
          )}
        </Button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md p-3 max-w-md">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Hide Hours</Label>
              {hasHiddenHours && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHiddenHours}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={hiddenHours.includes(hour) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleHiddenHour(hour)}
                  className={cn(
                    "h-8 px-1 text-xs",
                    hiddenHours.includes(hour) &&
                      "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                  )}
                >
                  {hour}
                </Button>
              ))}
            </div>

            {hasHiddenHours && (
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">
                  Hidden hours:
                </div>
                <div className="flex flex-wrap gap-1">
                  {hiddenHours.map((hour) => (
                    <Badge
                      key={hour}
                      variant="secondary"
                      className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                    >
                      {formatHour(hour)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleHiddenHour(hour)}
                        className="h-3 w-3 p-0 ml-1 hover:bg-orange-200 dark:hover:bg-orange-800"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <ReusableCollapsible
      title="Hour Filter Settings"
      defaultOpen={false}
      headerClassName="pb-0"
      content={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Hide Specific Hours</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Time entries during these hours will be hidden from summaries
                and calendars
              </p>
            </div>
            {hasHiddenHours && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHiddenHours}
                className="h-8 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-8 gap-2">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant={hiddenHours.includes(hour) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleHiddenHour(hour)}
                className={cn(
                  "h-10 px-2 text-xs flex flex-row items-center justify-center",
                  hiddenHours.includes(hour) &&
                    "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                )}
              >
                <Clock className="h-3 w-3 mb-0.5" />
                <span>{hour}</span>
              </Button>
            ))}
          </div>

          {hasHiddenHours && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Currently Hidden ({hiddenHours.length} hours):
              </Label>
              <div className="flex flex-wrap gap-2">
                {hiddenHours.map((hour) => (
                  <Badge
                    key={hour}
                    variant="secondary"
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-800"
                    onClick={() => toggleHiddenHour(hour)}
                  >
                    {formatHour(hour)}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
