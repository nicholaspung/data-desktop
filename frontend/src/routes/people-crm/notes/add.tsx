// frontend/src/routes/people-crm/notes/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import PersonNoteForm from "@/features/people-crm/note-form";
import { PersonNoteInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AddNoteSearch {
  personId?: string;
}

export const Route = createFileRoute("/people-crm/notes/add")({
  validateSearch: (search): AddNoteSearch => ({
    personId: search.personId as string | undefined,
  }),
  component: AddNote,
});

function AddNote() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PersonNoteInput) => {
    setLoading(true);
    try {
      const newNote = await ApiService.addRecord("person_notes", data);
      if (newNote) {
        addEntry(newNote, "person_notes");
        toast.success("Note added successfully");
        navigate({ to: `/people-crm/notes/${newNote.id}` });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/notes" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/notes">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <NotebookPen className="h-8 w-8" />
            Add Note
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a note about someone in your network
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonNoteForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        defaultPersonId={search.personId}
      />
    </div>
  );
}
