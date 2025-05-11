// frontend/src/routes/people-crm/birthday-reminders/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { BIRTHDAY_REMINDERS_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bell, Calendar, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { BirthdayReminder } from "@/store/people-crm-definitions";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

export const Route = createFileRoute("/people-crm/birthday-reminders/")({
  component: BirthdayRemindersList,
});

function BirthdayRemindersList() {
  const reminders = useStore(dataStore, (state) => state.birthday_reminders);
  const isLoading = useStore(loadingStore, (state) => state.birthday_reminders);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter reminders based on search
  const filteredReminders = reminders.filter((reminder) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      reminder.person_id_data?.name.toLowerCase().includes(searchLower) ||
      reminder.reminder_note?.toLowerCase().includes(searchLower)
    );
  });

  // Sort reminders by reminder date
  const sortedReminders = filteredReminders.sort(
    (a, b) =>
      new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
  );

  const [deletingReminderIds, setDeletingReminderIds] = useState<Set<string>>(
    new Set()
  );

  const handleDeleteReminder = async (reminderId: string) => {
    setDeletingReminderIds((prev) => new Set([...prev, reminderId]));
    try {
      await ApiService.deleteRecord(reminderId);
      deleteEntry(reminderId, "birthday_reminders");
      toast.success("Reminder deleted successfully");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    } finally {
      setDeletingReminderIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reminderId);
        return newSet;
      });
    }
  };

  const BirthdayReminderCard = ({
    reminder,
  }: {
    reminder: BirthdayReminder;
  }) => (
    <ReusableCard
      content={
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {reminder.person_id_data?.name || "Unknown Person"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Remind on:{" "}
                      {format(reminder.reminder_date, "MMMM d, yyyy")}
                    </div>
                    <span>{reminder.advance_days} days before birthday</span>
                  </div>
                </div>
              </div>

              {reminder.reminder_note && (
                <p className="text-sm text-muted-foreground mt-2">
                  {reminder.reminder_note}
                </p>
              )}

              {reminder.person_id_data?.birthday && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Birthday: {format(reminder.person_id_data.birthday, "MMMM d")}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-2">
              <Link
                to={`/people-crm/people/$personId`}
                params={{ personId: reminder.person_id }}
              >
                <Button variant="outline" size="sm">
                  <User className="h-3 w-3 mr-1" />
                  View Person
                </Button>
              </Link>
              <Link
                to={`/people-crm/birthday-reminders/$reminderId/edit`}
                params={{ reminderId: reminder.id }}
              >
                <Button variant="outline" size="sm">
                  Edit Reminder
                </Button>
              </Link>
            </div>
            <ConfirmDeleteDialog
              title="Delete Reminder"
              description="Are you sure you want to delete this birthday reminder?"
              onConfirm={() => handleDeleteReminder(reminder.id)}
              loading={deletingReminderIds.has(reminder.id)}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      }
    />
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Birthday Reminders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your birthday reminder settings
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={BIRTHDAY_REMINDERS_FIELD_DEFINITIONS.fields}
            datasetId="birthday_reminders"
            title="Birthday Reminders"
          />
          <Link to="/people-crm/birthday-reminders/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reminders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reminders...</p>
        </div>
      ) : sortedReminders.length > 0 ? (
        <div className="space-y-4">
          {sortedReminders.map((reminder) => (
            <BirthdayReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No reminders found matching your search"
                  : "No birthday reminders set yet"}
              </p>
              <Link to="/people-crm/birthday-reminders/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Reminder
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}

export default BirthdayRemindersList;
