import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import { InfoPanel } from "@/components/reusable/info-panel";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableCollapsible from "@/components/reusable/reusable-collapsible";
import { FEATURE_ICONS } from "@/lib/icons";
import settingsStore, { isMetricsEnabled } from "@/store/settings-store";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import MetricLoggerContent from "@/features/quick-actions/metric-logger-content";
import { format as formatDate, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import { DailyJournalEntry } from "@/store/journaling-definitions";

export const Route = createFileRoute("/quick-actions")({
  component: QuickActionsPage,
});

// Wrapper component to render only content without header
function MetricLoggerQuickContent() {
  return <MetricLoggerContent showPrivateMetrics={true} />;
}

function QuickActionsPage() {
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

  if (enabledFeatures.length === 0) {
    return (
      <FeatureLayout
        header={
          <FeatureHeader
            title="Quick Actions"
            description="Log data quickly across different features"
            storageKey="quick-actions"
          >
            <FEATURE_ICONS.PLUS_SQUARE className="h-8 w-8" />
          </FeatureHeader>
        }
      >
        <InfoPanel
          title="No Features Enabled"
          variant="warning"
          storageKey="quick-actions-no-features"
        >
          <p>No features are currently enabled for quick actions.</p>
          <p className="mt-2">
            To use quick actions, enable at least one of the following features
            in settings:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Metrics</li>
            <li>Daily Journal</li>
            <li>People CRM</li>
            <li>Todos</li>
          </ul>
        </InfoPanel>
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Quick Actions"
          description="Log data quickly across different features"
          storageKey="quick-actions"
          guideContent={[
            {
              title: "Getting Started",
              content: "Quick Actions provides a centralized hub for logging data across multiple features without switching between different pages."
            },
            {
              title: "Available Actions",
              content: "• **Journal Entry**: Write daily reflections in the main area\n• **Metric Logger**: Track health and personal metrics\n• **People & Meetings**: Add contacts or log meetings\n• **Todos**: Create and manage quick tasks"
            },
            {
              title: "How to Use",
              content: "1. The journal takes up the main space for focused writing\n2. Other features are collapsible on the right side\n3. All changes save immediately when you click save\n4. Enable features in Settings to see them here"
            },
            {
              title: "Tips",
              content: "• Use keyboard shortcuts: Enter to save in todos\n• The journal auto-detects today's entry\n• Meeting logs default to 60 minutes\n• All data syncs with the main feature pages"
            }
          ]}
        />
      }
    >
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 h-[calc(100vh-12rem)]">
        {/* Left column - 3/4 width for journal */}
        {isJournalingVisible && (
          <div className="lg:col-span-3">
            <QuickJournaling />
          </div>
        )}

        {/* Right column - 1/4 width for collapsible components */}
        <div className="lg:col-span-1 space-y-4 overflow-y-hidden hover:overflow-y-auto overscroll-contain transition-all duration-200 pr-2">
          {isMetricsVisible && (
            <ReusableCollapsible
              title={
                <div className="flex items-center gap-2">
                  <FEATURE_ICONS.METRIC_LOGGER className="h-4 w-4" />
                  <span>Metric Logger</span>
                </div>
              }
              content={<MetricLoggerQuickContent />}
            />
          )}
          {isPeopleVisible && (
            <ReusableCollapsible
              title={
                <div className="flex items-center gap-2">
                  <FEATURE_ICONS.PEOPLE_CRM className="h-4 w-4" />
                  <span>Quick People & Meetings</span>
                </div>
              }
              content={<QuickPeopleAndMeetings />}
            />
          )}
          {isTodosVisible && (
            <ReusableCollapsible 
              title={
                <div className="flex items-center gap-2">
                  <FEATURE_ICONS.TODOS className="h-4 w-4" />
                  <span>Quick Todos</span>
                </div>
              } 
              content={<QuickTodos />} 
            />
          )}
        </div>
      </div>
    </FeatureLayout>
  );
}

function QuickJournaling() {
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DailyJournalEntry | null>(
    null
  );
  const today = useMemo(() => new Date(), []);

  const dailyJournalEntries = useStore(
    dataStore,
    (state) => state.daily_journal || []
  );

  // Load existing entry for today
  useEffect(() => {
    const selectedYear = today.getFullYear();
    const selectedMonth = today.getMonth();
    const selectedDay = today.getDate();

    const todayEntry = dailyJournalEntries.find(
      (journalEntry: DailyJournalEntry) => {
        const entryDate = new Date(journalEntry.date);
        return (
          entryDate.getFullYear() === selectedYear &&
          entryDate.getMonth() === selectedMonth &&
          entryDate.getDate() === selectedDay
        );
      }
    );

    if (todayEntry) {
      setExistingEntry(todayEntry);
      setEntry(todayEntry.entry);
    } else {
      setExistingEntry(null);
      setEntry("");
    }
  }, [dailyJournalEntries, today]);

  // Track content changes
  useEffect(() => {
    if (entry.trim() !== "") {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setLoading(true);
    try {
      const journalData = {
        date: today.toISOString(),
        entry: entry.trim(),
      };

      let result;
      if (existingEntry) {
        // Update existing entry
        result = await ApiService.saveDailyJournalWithMetrics(
          existingEntry.id,
          journalData,
          true,
          false, // metrics disabled for quick actions
          false // todos disabled for quick actions
        );
        if (result) {
          updateEntry(existingEntry.id, result, "daily_journal");
          toast.success("Journal entry updated");
        }
      } else {
        // Create new entry
        result = await ApiService.saveDailyJournalWithMetrics(
          null,
          journalData,
          false,
          false, // metrics disabled for quick actions
          false // todos disabled for quick actions
        );
        if (result) {
          addEntry(result, "daily_journal");
          toast.success("Journal entry saved");
        }
      }

      if (result) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error saving journal:", error);
      toast.error("Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (loading) {
      return <span className="text-sm text-muted-foreground">Saving...</span>;
    }

    if (hasUnsavedChanges) {
      return <span className="text-sm text-yellow-600">Editing...</span>;
    }

    if (lastSaved) {
      return (
        <span className="text-sm text-green-600">
          Last saved: {formatDate(lastSaved, "MMM d, yyyy 'at' h:mm a")}
        </span>
      );
    }

    return null;
  };

  return (
    <ReusableCard
      title={
        <div className="flex items-center gap-2">
          <FEATURE_ICONS.BOOK_OPEN className="h-5 w-5" />
          Quick Journal Entry
        </div>
      }
      description={formatDate(today, "EEEE, MMMM d, yyyy")}
      headerActions={getStatusDisplay()}
      cardClassName="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col"
      content={
        <div className="flex flex-col h-full space-y-4">
          <Textarea
            placeholder="Write your thoughts..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="flex-1 resize-none"
          />

          <Button
            onClick={handleSave}
            disabled={loading || !entry.trim()}
            className="w-full"
          >
            {loading
              ? "Saving..."
              : existingEntry
                ? "Update Journal Entry"
                : "Save Journal Entry"}
          </Button>
        </div>
      }
    />
  );
}

function QuickPeopleAndMeetings() {
  const [activeTab, setActiveTab] = useState<"person" | "meeting">("person");
  const [personForm, setPersonForm] = useState({
    name: "",
    email: "",
    notes: "",
  });
  const [meetingForm, setMeetingForm] = useState({
    person_id: "",
    date: new Date(),
    notes: "",
    next_steps: "",
  });
  const [loading, setLoading] = useState(false);

  const people = useStore(dataStore, (state) => state.people || []);
  const peopleOptions = people.map((p: any) => ({
    id: p.id,
    value: p.id,
    label: p.name,
  }));

  const handleSavePerson = async () => {
    if (!personForm.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);
    try {
      const newPerson: any = {
        name: personForm.name.trim(),
        email: personForm.email.trim() || undefined,
        notes: personForm.notes.trim() || undefined,
        first_met_date: new Date().toISOString(),
      };

      const result = await ApiService.addRecord("people", newPerson);
      if (result) {
        addEntry(result, "people");
        toast.success("Person added successfully");
        setPersonForm({ name: "", email: "", notes: "" });
      }
    } catch (error) {
      console.error("Error saving person:", error);
      toast.error("Failed to save person");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.person_id) {
      toast.error("Please select a person");
      return;
    }

    setLoading(true);
    try {
      const newMeeting: any = {
        title: "Quick Meeting",
        person_id: meetingForm.person_id,
        date: meetingForm.date.toISOString(),
        duration_minutes: 60,
        location: "",
        meeting_type: "in-person",
        participants: [meetingForm.person_id],
        notes: meetingForm.notes.trim() || undefined,
        next_steps: meetingForm.next_steps.trim() || undefined,
      };

      const result = await ApiService.addRecord("meetings", newMeeting);
      if (result) {
        addEntry(result, "meetings");
        toast.success("Meeting logged successfully");
        setMeetingForm({
          person_id: "",
          date: new Date(),
          notes: "",
          next_steps: "",
        });
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error("Failed to save meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "person" ? "default" : "outline"}
          onClick={() => setActiveTab("person")}
          className="flex-1"
        >
          Add Person
        </Button>
        <Button
          variant={activeTab === "meeting" ? "default" : "outline"}
          onClick={() => setActiveTab("meeting")}
          className="flex-1"
        >
          Log Meeting
        </Button>
      </div>

      {activeTab === "person" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="person-name">Name *</Label>
            <Input
              id="person-name"
              value={personForm.name}
              onChange={(e) =>
                setPersonForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="person-email">Email</Label>
            <Input
              id="person-email"
              type="email"
              value={personForm.email}
              onChange={(e) =>
                setPersonForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="john@example.com"
            />
          </div>

          <div>
            <Label htmlFor="person-notes">Notes</Label>
            <Textarea
              id="person-notes"
              value={personForm.notes}
              onChange={(e) =>
                setPersonForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Additional notes..."
              className="min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSavePerson}
            disabled={loading || !personForm.name.trim()}
            className="w-full"
          >
            {loading ? "Saving..." : "Add Person"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="meeting-person">Person *</Label>
            <AutocompleteInput
              value={meetingForm.person_id}
              onChange={(value: string) =>
                setMeetingForm((prev) => ({ ...prev, person_id: value }))
              }
              options={peopleOptions}
              placeholder="Select a person"
              emptyMessage="No people found"
            />
          </div>

          <div>
            <Label htmlFor="meeting-date">Date</Label>
            <ReusableDatePicker
              value={meetingForm.date}
              onChange={(date: Date | undefined) =>
                date && setMeetingForm((prev) => ({ ...prev, date }))
              }
            />
          </div>

          <div>
            <Label htmlFor="meeting-notes">Notes</Label>
            <Textarea
              id="meeting-notes"
              value={meetingForm.notes}
              onChange={(e) =>
                setMeetingForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Meeting notes..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="meeting-next-steps">Next Steps</Label>
            <Textarea
              id="meeting-next-steps"
              value={meetingForm.next_steps}
              onChange={(e) =>
                setMeetingForm((prev) => ({
                  ...prev,
                  next_steps: e.target.value,
                }))
              }
              placeholder="Action items..."
              className="min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSaveMeeting}
            disabled={loading || !meetingForm.person_id}
            className="w-full"
          >
            {loading ? "Saving..." : "Log Meeting"}
          </Button>
        </div>
      )}
    </div>
  );
}

function QuickTodos() {
  const todos = useStore(dataStore, (state) => state.todos || []);
  const [loading, setLoading] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");

  // Get uncompleted todos sorted by created date
  const activeTodos = todos
    .filter((todo: any) => !todo.is_complete)
    .sort((a: any, b: any) => {
      const dateA = a.created_date ? parseISO(a.created_date).getTime() : 0;
      const dateB = b.created_date ? parseISO(b.created_date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10); // Show only latest 10

  const handleToggle = async (todo: any) => {
    setLoading(true);
    try {
      const isCompleting = !todo.is_complete;

      const updatedTodo = {
        ...todo,
        is_complete: isCompleting,
        completed_at: isCompleting ? new Date().toISOString() : null,
        status: isCompleting ? "completed" : "not_started",
        // Ensure dates are properly formatted
        deadline: todo.deadline ? new Date(todo.deadline).toISOString() : null,
        reminder_date: todo.reminder_date
          ? new Date(todo.reminder_date).toISOString()
          : null,
        failed_deadlines: todo.failed_deadlines
          ? JSON.stringify(todo.failed_deadlines)
          : null,
      };

      const result = await ApiService.updateRecord(todo.id, updatedTodo);
      if (result) {
        updateEntry(todo.id, result, "todos");
        toast.success(
          isCompleting ? "Todo completed!" : "Todo marked as incomplete"
        );
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      toast.error("Failed to update todo");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) {
      toast.error("Please enter a todo title");
      return;
    }

    setLoading(true);
    try {
      const newTodo: any = {
        title: newTodoTitle.trim(),
        description: "",
        deadline: null,
        priority: "medium",
        tags: "",
        related_metric_id: null,
        metric_type: null,
        failed_deadlines: null,
        reminder_date: null,
        is_complete: false,
        completed_at: null,
        status: "not_started",
        private: false,
        created_date: formatDate(new Date(), "yyyy-MM-dd"),
      };

      const result = await ApiService.addRecord("todos", newTodo);
      if (result) {
        addEntry(result, "todos");
        toast.success("Todo added successfully");
        setNewTodoTitle("");
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      toast.error("Failed to add todo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Add a new todo..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddTodo();
            }
          }}
        />
        <Button
          onClick={handleAddTodo}
          disabled={loading || !newTodoTitle.trim()}
        >
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {activeTodos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
          >
            <Checkbox
              id={todo.id}
              checked={!!todo.is_complete}
              onCheckedChange={() => handleToggle(todo)}
              disabled={loading}
            />
            <Label
              htmlFor={todo.id}
              className={cn(
                "cursor-pointer flex-1",
                todo.is_complete && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </Label>
          </div>
        ))}

        {activeTodos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active todos. Add one above!
          </p>
        )}
      </div>

      {todos.filter((t: any) => !t.is_complete).length > 10 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 10 most recent todos. View all in the Todos page.
        </p>
      )}
    </div>
  );
}
