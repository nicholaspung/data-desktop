import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { formatDate } from "@/lib/date-utils";
import ReactMarkdown from "react-markdown";
import ReusableTabs from "@/components/reusable/reusable-tabs";

export default function SameQuestionAnswers() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    if (entries.length === 0) return;

    const uniqueQuestions = new Set<string>();

    entries.forEach((entry) => {
      const match = entry.entry.match(/^##\s+(.+?)(\n|$)/m);
      if (match && match[1]) {
        uniqueQuestions.add(match[1].trim());
      }
    });

    const questionList = Array.from(uniqueQuestions);
    setQuestions(questionList);

    if (questionList.length > 0) {
      setSelectedQuestion(questionList[0]);
    }
  }, [entries]);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No journal entries found. Start by answering today's question!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>View Answers to the Same Question</CardTitle>
        </CardHeader>
        <CardContent>
          <ReusableTabs
            tabs={questions.map((q) => ({
              id: q,
              label: q.length > 30 ? q.substring(0, 30) + "..." : q,
              content: (
                <>
                  <div className="bg-muted p-4 rounded-md text-lg font-medium mb-6">
                    {q}
                  </div>
                  {entries.filter((entry) => entry.entry.includes(`## ${q}`))
                    .length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No answers found for this question.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {entries
                        .filter((entry) => entry.entry.includes(`## ${q}`))
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .map((entry) => (
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
                </>
              ),
            }))}
            defaultTabId={selectedQuestion}
            onChange={setSelectedQuestion}
            tabsListClassName="mb-4 flex flex-wrap h-auto"
          />
        </CardContent>
      </Card>
    </div>
  );
}
