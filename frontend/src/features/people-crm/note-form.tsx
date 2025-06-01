import DataForm from "@/components/data-form/data-form";
import { PERSON_NOTES_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";

export default function PersonNoteForm({
  note,
  onSubmit,
  onCancel,
  defaultPersonId,
}: {
  note?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  defaultPersonId?: string;
}) {
  const initialValues = note
    ? {
        person_id: note.person_id,
        note_date: note.note_date ? new Date(note.note_date) : undefined,
        content: note.content || "",
        category: note.category || "general",
        tags: note.tags || "",
        private: note.private || false,
      }
    : {
        person_id: defaultPersonId || "",
      };

  return (
    <DataForm
      datasetId="person_notes"
      fields={PERSON_NOTES_FIELD_DEFINITIONS.fields}
      onSuccess={() => onSubmit({})}
      onCancel={onCancel}
      initialValues={initialValues}
      submitLabel={note ? "Update Note" : "Add Note"}
      successMessage={
        note ? "Note updated successfully" : "Note added successfully"
      }
      mode={note ? "edit" : "add"}
      recordId={note?.id}
    />
  );
}
