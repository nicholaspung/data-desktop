import DataForm from "@/components/data-form/data-form";
import { MEETINGS_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";

export default function MeetingForm({
  meeting,
  onSubmit,
  onCancel,
  defaultPersonId,
}: {
  meeting?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  defaultPersonId?: string;
}) {
  const initialValues = meeting
    ? {
        person_id: meeting.person_id,
        meeting_date: meeting.meeting_date
          ? new Date(meeting.meeting_date)
          : undefined,
        location: meeting.location || "",
        location_type: meeting.location_type || "",
        duration_minutes: meeting.duration_minutes || "",
        participants: meeting.participants || "",
        description: meeting.description || "",
        tags: meeting.tags || "",
        feelings: meeting.feelings || "",
        follow_up_needed: meeting.follow_up_needed || false,
        follow_up_date: meeting.follow_up_date
          ? new Date(meeting.follow_up_date)
          : undefined,
        private: meeting.private || false,
      }
    : {
        person_id: defaultPersonId || "",
      };

  return (
    <DataForm
      datasetId="meetings"
      fields={MEETINGS_FIELD_DEFINITIONS.fields}
      onSuccess={() => onSubmit({})}
      onCancel={onCancel}
      initialValues={initialValues}
      submitLabel={meeting ? "Update Meeting" : "Add Meeting"}
      successMessage={
        meeting ? "Meeting updated successfully" : "Meeting added successfully"
      }
      mode={meeting ? "edit" : "add"}
      recordId={meeting?.id}
    />
  );
}
