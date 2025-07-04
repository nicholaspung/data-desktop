import { useState, useEffect } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import DailyJournalEditor from "./daily-journal-editor";
import DailyJournalHistory from "./daily-journal-history";
import DailyRecordsPanel from "./daily-records-panel";

export default function DailyJournalMainView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRecordsPanelCollapsed, setIsRecordsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("today");

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

  const handleEditEntry = (entry: DailyJournalEntry) => {
    setSelectedDate(new Date(entry.date));
    setActiveTab("today");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Tabs */}
      <ReusableTabs
        tabsContentClassName="h-full overflow-hidden"
        value={activeTab}
        onChange={setActiveTab}
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
                onEditEntry={handleEditEntry}
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
