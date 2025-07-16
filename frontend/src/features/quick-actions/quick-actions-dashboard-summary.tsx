import { registerDashboardSummary } from "@/lib/dashboard-registry";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import settingsStore, { isMetricsEnabled } from "@/store/settings-store";
import ReusableCard from "@/components/reusable/reusable-card";
import { FEATURE_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { DailyJournalEntry } from "@/store/journaling-definitions";

function QuickActionsDashboardSummary() {
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);
  const isMetricsVisible = isMetricsEnabled(visibleRoutes);
  const isJournalingVisible = visibleRoutes["/daily-journal"] === true;
  const isPeopleVisible = visibleRoutes["/people-crm"] === true;
  const isTodosVisible = visibleRoutes["/todos"] === true;

  const enabledFeatures = [
    isMetricsVisible && "metrics",
    isJournalingVisible && "journaling",
    isPeopleVisible && "people",
    isTodosVisible && "todos",
  ].filter(Boolean);

  const todos = useStore(dataStore, (state) => state.todos || []);
  const activeTodosCount = todos.filter((todo: any) => !todo.is_complete).length;

  const dailyJournalEntries = useStore(
    dataStore,
    (state) => state.daily_journal || []
  );

  // Check if there's a journal entry for today
  const today = new Date();
  const todayEntry = dailyJournalEntries.find(
    (entry: DailyJournalEntry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === today.getFullYear() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getDate() === today.getDate()
      );
    }
  );

  const people = useStore(dataStore, (state) => state.people || []);
  const meetings = useStore(dataStore, (state) => state.meetings || []);
  
  // Get today's meetings
  const todayMeetings = meetings.filter((meeting: any) => {
    const meetingDate = new Date(meeting.date);
    return (
      meetingDate.getFullYear() === today.getFullYear() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getDate() === today.getDate()
    );
  });

  return (
    <ReusableCard
      title="Quick Actions"
      content={
        <div className="space-y-3">
          {enabledFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No features enabled. Enable features in settings to use quick actions.
            </p>
          ) : (
            <>
              {isJournalingVisible && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Today's Journal</span>
                  <span className={cn(
                    "text-sm font-medium",
                    todayEntry ? "text-green-600" : "text-yellow-600"
                  )}>
                    {todayEntry ? "Written" : "Not Written"}
                  </span>
                </div>
              )}
              
              {isTodosVisible && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Todos</span>
                  <span className="text-sm font-medium">{activeTodosCount}</span>
                </div>
              )}
              
              {isPeopleVisible && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total People</span>
                    <span className="text-sm font-medium">{people.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Today's Meetings</span>
                    <span className="text-sm font-medium">{todayMeetings.length}</span>
                  </div>
                </>
              )}
              
              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {enabledFeatures.length} feature{enabledFeatures.length !== 1 ? 's' : ''} enabled
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}

registerDashboardSummary({
  route: "/quick-actions",
  component: QuickActionsDashboardSummary,
  defaultConfig: {
    id: "/quick-actions",
    size: "small",
    height: "small",
    order: 16,
    visible: true,
  },
  name: "Quick Actions",
  description: "Log data quickly across features",
  icon: FEATURE_ICONS.PLUS_SQUARE,
});

export default QuickActionsDashboardSummary;