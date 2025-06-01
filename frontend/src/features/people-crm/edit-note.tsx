import { ChevronLeft, Edit } from "lucide-react";
import PersonNoteForm from "./note-form";
import { toast } from "sonner";
import dataStore, { updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { PersonNote } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

export function EditNote({
  noteId,
  onBack,
}: {
  noteId: string;
  onBack: () => void;
}) {
  const notes = useStore(dataStore, (state) => state.person_notes);

  const [note, setNote] = useState<PersonNote | null>(null);

  useEffect(() => {
    const foundNote = notes.find((n) => n.id === noteId);
    if (foundNote) {
      setNote(foundNote);
    }
  }, [noteId, notes]);

  interface HandleSubmitData {
    [key: string]: any;
  }

  const handleSubmit = async (data: HandleSubmitData): Promise<void> => {
    try {
      const updatedNote: PersonNote | null = await ApiService.updateRecord(
        noteId,
        data
      );
      if (updatedNote) {
        updateEntry(noteId, updatedNote, "person_notes");
        toast.success("Note updated successfully");
        onBack();
      }
    } catch (error: unknown) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleCancel = () => {
    onBack();
  };

  if (!note) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Note
          </h1>
          <p className="text-muted-foreground mt-1">
            Update note about {note.person_id_data?.name || "this person"}
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonNoteForm
        note={note}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
