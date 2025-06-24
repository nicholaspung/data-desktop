import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Zap } from "lucide-react";
import { FEATURE_ICONS } from "@/lib/icons";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import { parseMetricsFromText } from "@/features/daily-journal/metric-parser";
import { format, isToday } from "date-fns";

interface DailyJournalDashboardSummaryProps {
  showPrivateMetrics?: boolean;
}

export default function DailyJournalDashboardSummary({
  // showPrivateMetrics = true, // Currently not filtering private data
}: DailyJournalDashboardSummaryProps) {
  const entries = useStore(dataStore, (state) => state.daily_journal as DailyJournalEntry[] || []);

  // Get today's entries
  const todayEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return isToday(entryDate);
  });

  // Get total metrics detected today
  const todayMetrics = todayEntries.flatMap(entry => parseMetricsFromText(entry.entry));

  // Get recent entry
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastEntry = sortedEntries[0];

  // const getEntryPreview = (entry: DailyJournalEntry) => {
  //   const preview = entry.entry.substring(0, 100);
  //   return preview.length < entry.entry.length ? preview + "..." : preview;
  // };

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
        subText: todayMetrics.length > 0 ? `${todayMetrics.length} auto-detected metrics` : "No metrics detected",
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
                <div className="text-2xl font-bold text-blue-600">{todayEntries.length}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            ),
          },
          {
            content: (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4" />
                  {todayMetrics.length}
                </div>
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