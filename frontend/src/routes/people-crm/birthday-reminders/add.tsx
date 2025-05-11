// frontend/src/routes/people-crm/birthday-reminders/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import BirthdayReminderForm from "@/features/people-crm/birthday-reminder-form";
import { BirthdayReminderInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AddBirthdayReminderSearch {
  personId?: string;
}

export const Route = createFileRoute("/people-crm/birthday-reminders/add")({
  validateSearch: (search): AddBirthdayReminderSearch => ({
    personId: search.personId as string | undefined,
  }),
  component: AddBirthdayReminder,
});

function AddBirthdayReminder() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: BirthdayReminderInput) => {
    setLoading(true);
    try {
      const newReminder = await ApiService.addRecord(
        "birthday_reminders",
        data
      );
      if (newReminder) {
        addEntry(newReminder, "birthday_reminders");
        toast.success("Birthday reminder added successfully");
        navigate({ to: `/people-crm/birthday-reminders` });
      }
    } catch (error) {
      console.error("Error adding birthday reminder:", error);
      toast.error("Failed to add birthday reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/birthday-reminders" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/birthday-reminders">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Add Birthday Reminder
          </h1>
          <p className="text-muted-foreground mt-1">
            Set up a reminder for someone's birthday
          </p>
        </div>
      </div>

      {/* Form */}
      <BirthdayReminderForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        defaultPersonId={search.personId}
      />
    </div>
  );
}
