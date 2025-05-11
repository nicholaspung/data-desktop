// frontend/src/routes/people-crm/notes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { PERSON_NOTES_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, NotebookPen, Calendar, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { PersonNote } from "@/store/people-crm-definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/people-crm/notes/")({
  component: PersonNotesList,
});

function PersonNotesList() {
  const notes = useStore(dataStore, (state) => state.person_notes);
  const isLoading = useStore(loadingStore, (state) => state.person_notes);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notes based on search
  const filteredNotes = notes.filter((note) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      note.content.toLowerCase().includes(searchLower) ||
      note.person_id_data?.name.toLowerCase().includes(searchLower) ||
      note.category?.toLowerCase().includes(searchLower)
    );
  });

  // Sort notes by date (newest first)
  const sortedNotes = filteredNotes.sort(
    (a, b) => new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
  );

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

  const PersonNoteCard = ({ note }: { note: PersonNote }) => (
    <Link to={`/people-crm/notes/$noteId`} params={{ noteId: note.id }}>
      <ReusableCard
        cardClassName="hover:border-primary/50 transition-colors cursor-pointer"
        content={
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {note.person_id_data?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(note.note_date, "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {note.category && (
                  <Badge className={`${getCategoryColor(note.category)} mb-2`}>
                    {note.category}
                  </Badge>
                )}

                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none line-clamp-3">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>

                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
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
                )}
              </div>
            </div>
          </div>
        }
      />
    </Link>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <NotebookPen className="h-8 w-8" />
            Notes
          </h1>
          <p className="text-muted-foreground mt-1">
            Notes about people in your network
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={PERSON_NOTES_FIELD_DEFINITIONS.fields}
            datasetId="person_notes"
            title="Notes"
          />
          <Link to="/people-crm/notes/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading notes...</p>
        </div>
      ) : sortedNotes.length > 0 ? (
        <div className="space-y-4">
          {sortedNotes.map((note) => (
            <PersonNoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <NotebookPen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No notes found matching your search"
                  : "No notes recorded yet"}
              </p>
              <Link to="/people-crm/notes/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Note
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
