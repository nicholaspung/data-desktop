// src/features/journaling/question-of-the-day.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { ApiService } from "@/services/api";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";
import dataStore, { addEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { Loader2 } from "lucide-react";
import { useTodayQuestion } from "@/hooks/useTodayQuestion";

interface QuestionOfTheDayProps {
  setActiveTab?: (tab: string) => void;
}

export default function QuestionOfTheDay({
  setActiveTab,
}: QuestionOfTheDayProps) {
  const { todayQuestion } = useTodayQuestion();
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEntryExists, setTodayEntryExists] = useState(false);
  const [existingEntry, setExistingEntry] =
    useState<QuestionJournalEntry | null>(null);

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // See if we already have an entry for today
    const todayEntry = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      setTodayEntryExists(true);
      setExistingEntry(todayEntry);
    }
  }, [entries]);

  const handleSubmit = async () => {
    if (answer.trim() === "") {
      toast.error("Please enter your answer before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      // Add markdown formatting to include the question at the top
      const formattedEntry = `## ${todayQuestion}\n\n${answer}`;

      // Create entry data
      const entryData = {
        date: today,
        entry: formattedEntry,
      };

      // Save to database
      const result = await ApiService.addRecord("question_journal", entryData);
      if (result) {
        // Add to state
        addEntry(result, "question_journal");
        toast.success("Your answer has been saved");
        setAnswer(""); // Clear the form

        // Navigate to history if requested
        if (setActiveTab) {
          setActiveTab("history");
        }
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("There was an error saving your entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (todayEntryExists && existingEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Question - {formatDate(new Date())}</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: existingEntry.entry.replace(/\n/g, "<br/>"),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Question - {formatDate(new Date())}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-md text-lg font-medium">
          {todayQuestion}
        </div>

        <div className="space-y-2">
          <h3 className="text-md font-medium">Your Answer:</h3>
          <MarkdownEditor
            value={answer}
            onChange={setAnswer}
            placeholder="Write your answer here..."
            minHeight="200px"
            maxHeight="500px"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
