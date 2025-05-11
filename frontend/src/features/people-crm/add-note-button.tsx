// frontend/src/features/people-crm/add-note-button.tsx
import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import PersonNoteForm from "./note-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonNote } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

interface AddNoteButtonProps {
  existingNote?: PersonNote;
  defaultPersonId?: string;
  onSuccess?: () => void;
}

export default function AddNoteButton({
  existingNote,
  defaultPersonId,
  onSuccess,
}: AddNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingNote;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Note" : "Add New Note"}
      description={
        isEditMode
          ? "Update note details."
          : "Add a note about someone in your network."
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
            Add Note
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <PersonNoteForm
              note={existingNote}
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
