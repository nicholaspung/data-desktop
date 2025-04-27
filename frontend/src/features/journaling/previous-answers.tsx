// src/features/journaling/same-question-answers.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { formatDate } from "@/lib/date-utils";
import ReactMarkdown from "react-markdown";
import { useTodayQuestion } from "@/hooks/useTodayQuestion";

export default function PreviousAnswers() {
  const { todayQuestion } = useTodayQuestion();

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  // If no question is available yet
  if (!todayQuestion) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading today's question...</p>
        </CardContent>
      </Card>
    );
  }

  // Find all entries that contain the same question
  const relevantEntries = entries
    .filter((entry) => entry.entry.includes(`## ${todayQuestion}`))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Previous Answers to Today's Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md text-lg font-medium mb-6">
            {todayQuestion}
          </div>

          {relevantEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              You haven't answered this question before.
            </p>
          ) : (
            <div className="space-y-6">
              {relevantEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/10 pb-2">
                    <CardTitle className="text-md">
                      {formatDate(entry.date)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className="pt-4 prose dark:prose-invert max-w-none
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
                    <ReactMarkdown>
                      {entry.entry.replace(/^##.*(\n|$)/m, "")}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
