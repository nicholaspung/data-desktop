import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, TrendingUp, Plus } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import DailyJournalEditor from "./daily-journal-editor";
import DailyJournalHistory from "./daily-journal-history";
import DailyRecordsPanel from "./daily-records-panel";
import { format } from "date-fns";

export default function DailyJournalMainView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRecordsPanelCollapsed, setIsRecordsPanelCollapsed] = useState(false);

  const entries = useStore(
    dataStore,
    (state) => state.daily_journal as DailyJournalEntry[]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "daily-journal-records-panel-collapsed"
      );
      if (saved) {
        setIsRecordsPanelCollapsed(JSON.parse(saved));
      }
    } catch (error) {
      console.warn("Failed to load records panel state:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "daily-journal-records-panel-collapsed",
        JSON.stringify(isRecordsPanelCollapsed)
      );
    } catch (error) {
      console.warn("Failed to save records panel state:", error);
    }
  }, [isRecordsPanelCollapsed]);

  const toggleRecordsPanel = () => {
    setIsRecordsPanelCollapsed(!isRecordsPanelCollapsed);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Today's Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(selectedDate, "MMM d")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(selectedDate, "EEEE, yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              All-time journal entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <ReusableTabs
        tabsContentClassName="h-full overflow-hidden"
        tabs={[
          {
            id: "today",
            label: (
              <span className="flex gap-2 items-center">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Write Today</span>
              </span>
            ),
            content: (
              <div className="flex gap-6">
                <div className="flex-1">
                  <DailyJournalEditor
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />
                </div>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isRecordsPanelCollapsed ? "w-20" : "w-80"
                  }`}
                >
                  <DailyRecordsPanel
                    selectedDate={selectedDate}
                    onToggle={toggleRecordsPanel}
                    isCollapsed={isRecordsPanelCollapsed}
                  />
                </div>
              </div>
            ),
          },
          {
            id: "history",
            label: (
              <span className="flex gap-2 items-center">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </span>
            ),
            content: (
              <DailyJournalHistory
                entries={entries}
                showDate={true}
                onDateSelect={setSelectedDate}
              />
            ),
          },
        ]}
        defaultTabId="today"
        className="w-full flex-1 min-h-0"
        tabsListClassName="mb-4 grid grid-cols-2 w-full"
      />
    </div>
  );
}
