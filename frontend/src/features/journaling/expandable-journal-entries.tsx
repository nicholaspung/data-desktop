// src/components/journaling/expandable-journal-entries.tsx (updated)
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import ReactMarkdown from "react-markdown";

interface JournalEntry {
  id: string;
  date: Date | string;
  entry?: string;
  affirmation?: string;
  createdAt?: Date | string;
  lastModified?: Date | string;
}

interface ExpandableJournalEntriesProps {
  title: string;
  entries: JournalEntry[];
  contentKey: "entry" | "affirmation";
  onAddEntry?: () => void;
  addButtonText?: string;
  emptyStateText?: string;
}

export default function ExpandableJournalEntries({
  title,
  entries,
  contentKey,
  emptyStateText = "No entries yet.",
}: ExpandableJournalEntriesProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );

  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}

      {sortedEntries.length > 0 ? (
        sortedEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardHeader
              className={cn(
                "bg-primary/5 pb-2 cursor-pointer",
                expandedEntries.has(entry.id) ? "border-b" : ""
              )}
              onClick={() => toggleExpand(entry.id)}
            >
              <CardTitle className="text-md flex justify-between items-center">
                <div className="flex items-center">
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  <span>{formatDate(entry.date)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.createdAt || entry.date).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            {expandedEntries.has(entry.id) && (
              <CardContent className="pt-4">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{entry[contentKey] || ""}</ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">{emptyStateText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
