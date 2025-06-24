import { useState } from "react";
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
  
  const entries = useStore(
    dataStore,
    (state) => state.daily_journal as DailyJournalEntry[]
  );


  return (
    <div className="space-y-6">
      {/* Today's Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(new Date(), "MMM d")}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, yyyy")}
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
                <div className="w-80">
                  <DailyRecordsPanel selectedDate={selectedDate} />
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
        className="w-full"
        tabsListClassName="mb-4 grid grid-cols-2 w-full"
      />
    </div>
  );
}