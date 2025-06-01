import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { addEntry } from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function CreativityJournalForm() {
  const [entry, setEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry.trim()) {
      toast.error("Please enter your creativity journal entry.");
      return;
    }

    setIsSubmitting(true);

    try {
      const date = new Date();
      const newEntry = {
        date,
        entry,
      };

      const result = await ApiService.addRecord("creativity_journal", newEntry);

      if (result) {
        addEntry(result, "creativity_journal");
        toast.success("Creativity journal entry added!");
        setEntry("");
      }
    } catch (error) {
      console.error("Error adding creativity entry:", error);
      toast.error("Failed to add entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">
          New Entry - {formatDate(new Date())}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              Write down 10 random associations or ideas that come to mind.
            </h3>
            <MarkdownEditor
              value={entry}
              onChange={setEntry}
              placeholder="Random gibberish..."
              minHeight="200px"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !entry.trim()}
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Creativity Journal Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
