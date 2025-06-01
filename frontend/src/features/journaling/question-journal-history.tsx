import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { formatDate } from "@/lib/date-utils";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableSelect from "@/components/reusable/reusable-select";

export default function QuestionJournalHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [questionOptions, setQuestionOptions] = useState<
    { id: string; label: string }[]
  >([]);

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  useEffect(() => {
    if (entries.length === 0) return;

    const questions = new Set<string>();
    entries.forEach((entry) => {
      const match = entry.entry.match(/^##\s+(.+?)(\n|$)/m);
      if (match && match[1]) {
        questions.add(match[1].trim());
      }
    });

    const options = Array.from(questions)
      .sort()
      .map((question) => ({
        id: question,
        label: question,
      }));
    setQuestionOptions(options);
  }, [entries]);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredEntries = sortedEntries.filter((entry) => {
    const matchesSearch = searchTerm
      ? entry.entry.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesQuestion = selectedQuestion
      ? entry.entry.includes(`## ${selectedQuestion}`)
      : true;

    return matchesSearch && matchesQuestion;
  });

  const extractQuestion = (entry: string): string => {
    const match = entry.match(/^##\s+(.+?)(\n|$)/m);
    return match && match[1] ? match[1].trim() : "Unknown Question";
  };

  const extractAnswer = (entry: string): string => {
    return entry.replace(/^##.*(\n|$)/m, "").trim();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedQuestion("");
  };

  const renderEntries = () => {
    if (filteredEntries.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {entries.length === 0
              ? "No journal entries found. Start by answering today's question!"
              : "No entries match your search."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredEntries.map((entry) => (
          <ReusableCard
            key={entry.id}
            title={
              <div className="flex justify-between items-center">
                <span>{formatDate(entry.date)}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.createdAt || entry.date).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
            }
            showHeader={true}
            cardClassName="overflow-hidden"
            contentClassName="pt-4"
            content={
              <>
                <h3 className="font-semibold text-lg mb-2">
                  {extractQuestion(entry.entry)}
                </h3>
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
                  <ReactMarkdown>{extractAnswer(entry.entry)}</ReactMarkdown>
                </div>
              </>
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ReusableCard
        title="Your Journal History"
        content={
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your entries..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <ReusableSelect
                options={questionOptions}
                value={selectedQuestion}
                onChange={(value) => setSelectedQuestion(value)}
                placeholder="Filter by question"
                triggerClassName="w-[180px]"
                noDefault={false}
              />

              {(searchTerm || selectedQuestion) && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {(searchTerm || selectedQuestion) && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="flex gap-1 items-center"
                  >
                    Search: {searchTerm}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {selectedQuestion && (
                  <Badge
                    variant="secondary"
                    className="flex gap-1 items-center"
                  >
                    Question:{" "}
                    {selectedQuestion.length > 20
                      ? `${selectedQuestion.substring(0, 20)}...`
                      : selectedQuestion}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedQuestion("")}
                    />
                  </Badge>
                )}
              </div>
            )}

            {renderEntries()}
          </div>
        }
      />
    </div>
  );
}
