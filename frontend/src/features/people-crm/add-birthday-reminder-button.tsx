// frontend/src/features/people-crm/add-birthday-reminder-button.tsx
import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import BirthdayReminderForm from "./birthday-reminder-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BirthdayReminder } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

interface AddBirthdayReminderButtonProps {
  existingReminder?: BirthdayReminder;
  defaultPersonId?: string;
  onSuccess?: () => void;
}

export default function AddBirthdayReminderButton({
  existingReminder,
  defaultPersonId,
  onSuccess,
}: AddBirthdayReminderButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingReminder;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Birthday Reminder" : "Add New Reminder"}
      description={
        isEditMode
          ? "Update reminder settings."
          : "Set up a reminder for someone's birthday."
      }
      open={open}
      onOpenChange={setOpen}
      trigger={
        isEditMode ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Reminder
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <BirthdayReminderForm
              reminder={existingReminder}
              defaultPersonId={defaultPersonId}
              onSubmit={async () => {
                setOpen(false);
                onSuccess?.();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      }
      customFooter={<></>}
    />
  );
}
