// frontend/src/features/people-crm/birthday-reminder-form.tsx
import DataForm from "@/components/data-form/data-form";
import { BIRTHDAY_REMINDERS_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";

export default function BirthdayReminderForm({
  reminder,
  onSubmit,
  onCancel,
  defaultPersonId,
}: {
  reminder?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  defaultPersonId?: string;
}) {
  const initialValues = reminder
    ? {
        person_id: reminder.person_id,
        reminder_date: reminder.reminder_date
          ? new Date(reminder.reminder_date)
          : undefined,
        advance_days: reminder.advance_days || 7,
        reminder_note: reminder.reminder_note || "",
      }
    : {
        person_id: defaultPersonId || "",
        advance_days: 7,
      };

  return (
    <DataForm
      datasetId="birthday_reminders"
      fields={BIRTHDAY_REMINDERS_FIELD_DEFINITIONS.fields}
      onSuccess={(recordId) => onSubmit({})}
      onCancel={onCancel}
      initialValues={initialValues}
      submitLabel={reminder ? "Update Reminder" : "Add Reminder"}
      successMessage={
        reminder
          ? "Birthday reminder updated successfully"
          : "Birthday reminder added successfully"
      }
      mode={reminder ? "edit" : "add"}
      recordId={reminder?.id}
    />
  );
}
