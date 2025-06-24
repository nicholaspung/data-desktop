import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { FEATURE_ICONS } from "@/lib/icons";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import { format, isToday } from "date-fns";

export default function DailyJournalDashboardSummary() {
  const entries = useStore(
    dataStore,
    (state) => (state.daily_journal as DailyJournalEntry[]) || []
  );

  const todayEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return isToday(entryDate);
  });

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastEntry = sortedEntries[0];

  return (
    <ReusableSummary
      title="Daily Journal"
      titleIcon={<FEATURE_ICONS.BOOK_OPEN className="h-5 w-5" />}
      linkTo="/daily-journal"
      loading={false}
      emptyState={
        entries.length === 0
          ? {
              message: "No journal entries yet. Start writing today!",
              actionText: "Start Writing",
              actionTo: "/daily-journal",
            }
          : undefined
      }
      mainSection={{
        title: "Today's Activity",
        value: `${todayEntries.length} entries`,
        badge: {
          variant: todayEntries.length > 0 ? "success" : "outline",
          children: todayEntries.length > 0 ? "Active" : "No entries",
          className: todayEntries.length > 0 ? "bg-green-500" : "",
        },
      }}
      gridSection={{
        columns: 2,
        items: [
          {
            content: (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {todayEntries.length}
                </div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            ),
          },
          {
            content: (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Metrics</div>
              </div>
            ),
          },
        ],
        className: "mt-4",
      }}
      footer={
        lastEntry ? (
          <div className="text-xs text-muted-foreground text-center">
            Latest: {format(new Date(lastEntry.date), "MMM d, h:mm a")}
          </div>
        ) : (
          <div />
        )
      }
    />
  );
}
