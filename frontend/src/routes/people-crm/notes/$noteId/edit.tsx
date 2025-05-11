// frontend/src/routes/people-crm/notes/$noteId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { PersonNote, PersonNoteInput } from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import PersonNoteForm from "@/features/people-crm/note-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface NoteParams {
  noteId: string;
}

export const Route = createFileRoute("/people-crm/notes/$noteId/edit")({
  component: EditNote,
});

function EditNote() {
  const { noteId } = Route.useParams() as NoteParams;
  const navigate = useNavigate();
  const notes = useStore(dataStore, (state) => state.person_notes);

  const [note, setNote] = useState<PersonNote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundNote = notes.find((n) => n.id === noteId);
    if (foundNote) {
      setNote(foundNote);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(noteId).then((data) => {
        if (data) {
          setNote(data as PersonNote);
        }
      });
    }
  }, [noteId, notes]);

  const handleSubmit = async (data: PersonNoteInput) => {
    setLoading(true);
    try {
      const updatedNote = await ApiService.updateRecord(noteId, data);
      if (updatedNote) {
        updateEntry(noteId, updatedNote, "person_notes");
        toast.success("Note updated successfully");
        navigate({ to: `/people-crm/notes/${noteId}` });
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/notes/${noteId}` });
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
        <Link to={`/people-crm/notes/$noteId`} params={{ noteId: noteId }}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
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
        loading={loading}
      />
    </div>
  );
}
