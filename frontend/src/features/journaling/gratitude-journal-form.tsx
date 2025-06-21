import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandHeart } from "lucide-react";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import dataStore, { addEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { GratitudeJournalEntry } from "@/store/journaling-definitions";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useJournalingMetricsSync } from "@/hooks/useJournalingMetricsSync";

export default function GratitudeJournalForm() {
  const [entry, setEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { syncJournalingMetrics } = useJournalingMetricsSync();

  const entries = useStore(
    dataStore,
    (state) => state.gratitude_journal as GratitudeJournalEntry[]
  );

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysEntries = sortedEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry.trim()) {
      toast.error("Please enter your gratitude.");
      return;
    }

    setIsSubmitting(true);

    try {
      const date = new Date();
      const newEntry = {
        date,
        entry,
      };

      const result = await ApiService.addRecord("gratitude_journal", newEntry);

      if (result) {
        addEntry(result, "gratitude_journal");
        toast.success("Gratitude journal entry added!");
        setEntry("");

        setTimeout(() => {
          syncJournalingMetrics();
        }, 500);
      }
    } catch (error) {
      console.error("Error adding gratitude entry:", error);
      toast.error("Failed to add entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-primary" />
                <span>What are you grateful for today?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <MarkdownEditor
                  value={entry}
                  onChange={setEntry}
                  placeholder="I am grateful for..."
                  minHeight="200px"
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !entry.trim()}
                >
                  {isSubmitting ? "Saving..." : "Save Gratitude"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-md">
                Today's Entries ({todaysEntries.length})
                {todaysEntries.length >= 3 && (
                  <span className="ml-2 text-sm text-green-500 font-normal">
                    ✓ Goal reached!
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysEntries.length > 0 ? (
                <div className="space-y-4">
                  {todaysEntries.map((entry) => (
                    <Card key={entry.id} className="bg-muted/50">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          {new Date(
                            entry.createdAt || entry.date
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div
                          className="prose dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-headings:text-foreground
                   prose-p:text-foreground
                   prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                   prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:rounded prose-code:px-1 prose-code:py-0.5
                   prose-pre:bg-muted prose-pre:text-foreground prose-pre:font-mono prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto
                   prose-li:marker:text-muted-foreground
                   prose-hr:border-border max-w-none"
                        >
                          <ReactMarkdown>{entry.entry}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No entries for today yet.</p>
                  <p className="mt-2 text-sm">
                    What are you grateful for today? (Goal: 3 entries)
                  </p>
                </div>
              )}

              {entries.length > 0 && todaysEntries.length === 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    You have {entries.length} entries from previous days.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
