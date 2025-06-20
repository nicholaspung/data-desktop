import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { formatHoursAndMinutes } from "@/lib/time-utils";
import { Clock3, Clock } from "lucide-react";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { FEATURE_ICONS } from "@/lib/icons";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function TimeTrackerDashboardSummary() {
  const timeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );

  const categories = useStore(
    dataStore,
    (state) => state.time_categories as TimeCategory[]
  );

  const todaySummary = useMemo(() => {
    if (!timeEntries.length) {
      return {
        totalMinutes: 0,
        categories: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = timeEntries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    let totalMinutes = 0;
    todayEntries.forEach((entry) => {
      totalMinutes += entry.duration_minutes;
    });

    const categoriesMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        totalMinutes: number;
        percentageOfTotal: number;
      }
    >();

    categories.forEach((cat) => {
      categoriesMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        color: cat.color || "#3b82f6",
        totalMinutes: 0,
        percentageOfTotal: 0,
      });
    });

    categoriesMap.set("uncategorized", {
      id: "uncategorized",
      name: "Uncategorized",
      color: "#94a3b8",
      totalMinutes: 0,
      percentageOfTotal: 0,
    });

    todayEntries.forEach((entry) => {
      const categoryId = entry.category_id || "uncategorized";

      if (!categoriesMap.has(categoryId)) return;

      const currentTotal = categoriesMap.get(categoryId)!.totalMinutes;
      const updatedTotal = currentTotal + entry.duration_minutes;

      categoriesMap.set(categoryId, {
        ...categoriesMap.get(categoryId)!,
        totalMinutes: updatedTotal,
        percentageOfTotal: totalMinutes
          ? (updatedTotal / totalMinutes) * 100
          : 0,
      });
    });

    const categoriesArray = Array.from(categoriesMap.values())
      .filter((cat) => cat.totalMinutes > 0)
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    return {
      totalMinutes,
      categories: categoriesArray,
    };
  }, [timeEntries, categories]);

  const todayUntrackedTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const totalMinutesInDay = 24 * 60;

    const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();

    const availableMinutes = Math.min(totalMinutesInDay, elapsedMinutesToday);

    const untrackedMinutes = Math.max(
      0,
      availableMinutes - todaySummary.totalMinutes
    );

    return {
      untrackedMinutes,
      availableMinutes,
      percentageTracked:
        availableMinutes > 0
          ? (todaySummary.totalMinutes / availableMinutes) * 100
          : 0,
    };
  }, [todaySummary.totalMinutes]);

  const topCategoriesItems = todaySummary.categories.slice(0, 3).map((cat) => ({
    label: cat.name,
    value: (
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: cat.color }}
        />
        <span>{formatHoursAndMinutes(cat.totalMinutes)}</span>
      </div>
    ),
    subText: `${Math.round(cat.percentageOfTotal)}% of tracked time`,
  }));

  if (!timeEntries.length) {
    return (
      <ReusableSummary
        title="Time Tracking"
        titleIcon={
          <FEATURE_ICONS.TIME_TRACKER className="h-5 w-5 text-primary" />
        }
        linkText="View Time Tracker"
        linkTo="/time-tracker"
        emptyState={{
          message: "No time tracking data available yet",
          actionText: "Start Tracking Time",
          actionTo: "/time-tracker",
        }}
      />
    );
  }

  const trackingProgress = (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Tracked: {Math.round(todayUntrackedTime.percentageTracked)}%
        </span>
        <span>
          {formatHoursAndMinutes(todayUntrackedTime.untrackedMinutes)} untracked
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{
            width: `${Math.min(100, todayUntrackedTime.percentageTracked)}%`,
          }}
        />
      </div>
    </div>
  );

  return (
    <ReusableSummary
      title="Time Tracking"
      titleIcon={
        <FEATURE_ICONS.TIME_TRACKER className="h-5 w-5 text-primary" />
      }
      linkText="View All"
      linkTo="/time-tracker"
      mainSection={{
        title: "Today's Tracked Time",
        value: (
          <div className="flex items-center gap-2">
            <span>{formatHoursAndMinutes(todaySummary.totalMinutes)}</span>
            {todayUntrackedTime.untrackedMinutes > 0 && (
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock3 className="h-3 w-3 mr-1" />
                {formatHoursAndMinutes(
                  todayUntrackedTime.untrackedMinutes
                )}{" "}
                untracked
              </span>
            )}
          </div>
        ),
        subComponent: trackingProgress,
      }}
      sections={[
        {
          title: "Top Categories Today",
          items:
            topCategoriesItems.length > 0
              ? topCategoriesItems
              : [{ label: "No categories tracked today", value: "-" }],
        },
      ]}
    />
  );
}

registerDashboardSummary({
  route: "/time-tracker",
  component: TimeTrackerDashboardSummary,
  defaultConfig: {
    id: "/time-tracker",
    size: "small",
    height: "large",
    order: 2,
    visible: true,
  },
  datasets: ["time_entries", "time_categories", "time_planner_configs"],
  name: "Time Tracker",
  description: "Track how you spend your time",
  icon: Clock,
});
