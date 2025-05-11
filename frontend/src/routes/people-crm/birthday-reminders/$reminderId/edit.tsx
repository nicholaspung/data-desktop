// frontend/src/routes/people-crm/birthday-reminders/$reminderId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import {
  BirthdayReminder,
  BirthdayReminderInput,
} from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import BirthdayReminderForm from "@/features/people-crm/birthday-reminder-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface ReminderParams {
  reminderId: string;
}

export const Route = createFileRoute(
  "/people-crm/birthday-reminders/$reminderId/edit"
)({
  component: EditBirthdayReminder,
});

function EditBirthdayReminder() {
  const { reminderId } = Route.useParams() as ReminderParams;
  const navigate = useNavigate();
  const reminders = useStore(dataStore, (state) => state.birthday_reminders);

  const [reminder, setReminder] = useState<BirthdayReminder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundReminder = reminders.find((r) => r.id === reminderId);
    if (foundReminder) {
      setReminder(foundReminder);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(reminderId).then((data) => {
        if (data) {
          setReminder(data as BirthdayReminder);
        }
      });
    }
  }, [reminderId, reminders]);

  const handleSubmit = async (data: BirthdayReminderInput) => {
    setLoading(true);
    try {
      const updatedReminder = await ApiService.updateRecord(reminderId, data);
      if (updatedReminder) {
        updateEntry(reminderId, updatedReminder, "birthday_reminders");
        toast.success("Birthday reminder updated successfully");
        navigate({ to: `/people-crm/birthday-reminders` });
      }
    } catch (error) {
      console.error("Error updating birthday reminder:", error);
      toast.error("Failed to update birthday reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/birthday-reminders` });
  };

  if (!reminder) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading reminder...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm" search={{ tab: "reminders" }}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Birthday Reminder
          </h1>
          <p className="text-muted-foreground mt-1">
            Update reminder settings for{" "}
            {reminder.person_id_data?.name || "this person"}
          </p>
        </div>
      </div>

      {/* Form */}
      <BirthdayReminderForm
        reminder={reminder}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
