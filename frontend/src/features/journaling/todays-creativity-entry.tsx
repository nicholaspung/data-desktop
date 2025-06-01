import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { updateEntry } from "@/store/data-store";
import { CreativityJournalEntry } from "@/store/journaling-definitions";
import { Pencil, Save, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDate } from "@/lib/date-utils";

export default function TodaysCreativityEntry({
  entry,
}: {
  entry: CreativityJournalEntry;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.entry);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast.error("Please enter some content before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedEntry = {
        ...entry,
        entry: editContent,
      };

      const result = await ApiService.updateRecord(entry.id, updatedEntry);

      if (result) {
        updateEntry(entry.id, result, "creativity_journal");
        toast.success("Creativity journal entry updated!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating creativity entry:", error);
      toast.error("Failed to update entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditContent(entry.entry);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">
          Today's Entry - {formatDate(new Date())}
        </CardTitle>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <MarkdownEditor
              value={editContent}
              onChange={setEditContent}
              placeholder="Random gibberish..."
              minHeight="200px"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting || !editContent.trim()}
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{entry.entry}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
