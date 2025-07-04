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
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { Loader2, Edit } from "lucide-react";
import { useTodayQuestion } from "@/hooks/useTodayQuestion";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState("");

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntry = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      setTodayEntryExists(true);
      setExistingEntry(todayEntry);
      // Extract the answer from the formatted entry (remove the question part)
      const answerMatch = todayEntry.entry.match(/^##.*?\n\n(.*)$/s);
      if (answerMatch) {
        setEditedAnswer(answerMatch[1]);
      }
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

      const formattedEntry = `## ${todayQuestion}\n\n${answer}`;

      const entryData = {
        date: today,
        entry: formattedEntry,
      };

      const result = await ApiService.addRecord("question_journal", entryData);
      if (result) {
        addEntry(result, "question_journal");
        toast.success("Your answer has been saved");
        setAnswer("");

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

  const handleUpdate = async () => {
    if (!existingEntry || editedAnswer.trim() === "") {
      toast.error("Please enter your answer before updating");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedEntry = `## ${todayQuestion}\n\n${editedAnswer}`;

      const updatedData = {
        ...existingEntry,
        entry: formattedEntry,
      };

      const result = await ApiService.updateRecord(existingEntry.id, updatedData);
      if (result) {
        updateEntry(existingEntry.id, result, "question_journal");
        toast.success("Your answer has been updated");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("There was an error updating your entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (todayEntryExists && existingEntry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Today's Question - {formatDate(new Date())}</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md text-lg font-medium">
            {todayQuestion}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <h3 className="text-md font-medium">Your Answer:</h3>
              <MarkdownEditor
                value={editedAnswer}
                onChange={setEditedAnswer}
                placeholder="Edit your answer here..."
                minHeight="200px"
                maxHeight="500px"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-md font-medium mb-2">Your Answer:</h3>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{editedAnswer}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedAnswer(existingEntry.entry.match(/^##.*?\n\n(.*)$/s)?.[1] || "");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Answer"
              )}
            </Button>
          </CardFooter>
        )}
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
