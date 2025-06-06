import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { PersonNote } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, NotebookPen, Calendar, User } from "lucide-react";
import ReusableCard from "@/components/reusable/reusable-card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import ReactMarkdown from "react-markdown";

interface NoteDetailProps {
  noteId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function NoteDetail({
  noteId,
  onBack,
  onEdit,
}: NoteDetailProps) {
  const notes = useStore(dataStore, (state) => state.person_notes);

  const [note, setNote] = useState<PersonNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundNote = notes.find((n) => n.id === noteId);
    if (foundNote) {
      setNote(foundNote);
    } else {
      ApiService.getRecord(noteId).then((data) => {
        if (data) {
          setNote(data as PersonNote);
        }
      });
    }
  }, [noteId, notes]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(noteId);
      deleteEntry(noteId, "person_notes");
      toast.success("Note deleted successfully");
      onBack();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleting(false);
    }
  };

  if (!note) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading note details...</p>
      </div>
    );
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "important":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "reminder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "idea":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "concern":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <NotebookPen className="h-8 w-8" />
              Note Detail
            </h1>
            <p className="text-muted-foreground mt-1">
              Note about {note.person_id_data?.name || "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <ConfirmDeleteDialog
            title="Delete Note"
            description="Are you sure you want to delete this note? This action cannot be undone."
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </div>

      {/* Note Details */}
      <ReusableCard
        content={
          <div className="space-y-6">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {note.person_id_data?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(note.note_date, "MMMM d, yyyy")}
                </span>
              </div>
              {note.category && (
                <Badge className={getCategoryColor(note.category)}>
                  {note.category}
                </Badge>
              )}
            </div>

            {/* Note Content */}
            <div>
              <h3 className="font-medium mb-3">Note Content</h3>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </div>

            {/* Tags */}
            {note.tags && (
              <div>
                <h3 className="font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {note.tags.split(",").map((tag) => (
                    <Badge
                      key={tag.trim()}
                      variant="outline"
                      className="text-xs"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Created: {format(note.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <span>
                  Last modified:{" "}
                  {format(note.lastModified, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* Related Actions */}
      <ReusableCard
        title="Related Actions"
        content={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              View Contact
            </Button>
            <Button variant="outline">
              <NotebookPen className="h-4 w-4 mr-2" />
              Add Another Note
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        }
      />
    </div>
  );
}
