// src/features/journaling/question-journal-history.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { QuestionJournalEntry } from "@/store/journaling-definitions";
import { formatDate } from "@/lib/date-utils";
import ReactMarkdown from "react-markdown";

export default function QuestionJournalHistory() {
  const [searchTerm, setSearchTerm] = useState("");

  const entries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );

  // Sort entries by date, newest first
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Filter entries based on search term
  const filteredEntries = sortedEntries.filter((entry) => {
    if (!searchTerm) return true;
    return entry.entry.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Function to extract question from entry
  const extractQuestion = (entry: string): string => {
    const match = entry.match(/^##\s+(.+?)(\n|$)/m);
    return match && match[1] ? match[1].trim() : "Unknown Question";
  };

  // Function to extract answer (everything after the question header)
  const extractAnswer = (entry: string): string => {
    return entry.replace(/^##.*(\n|$)/m, "").trim();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Journal History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {entries.length === 0
                  ? "No journal entries found. Start by answering today's question!"
                  : "No entries match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/10 pb-2">
                    <CardTitle className="text-md flex justify-between">
                      <span>{formatDate(entry.date)}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          entry.createdAt || entry.date
                        ).toLocaleTimeString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {extractQuestion(entry.entry)}
                    </h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {extractAnswer(entry.entry)}
                      </ReactMarkdown>
                    </div>
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
