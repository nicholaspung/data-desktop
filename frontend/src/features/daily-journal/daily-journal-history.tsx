import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import ReactMarkdown from "react-markdown";
import { format, isToday, isYesterday } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { parseMetricsFromText } from "./metric-parser";

interface DailyJournalHistoryProps {
  entries: DailyJournalEntry[];
  showDate?: boolean;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export default function DailyJournalHistory({ 
  entries, 
  showDate = true,
  onDateSelect,
  selectedDate
}: DailyJournalHistoryProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const getTimeLabel = (date: Date) => {
    return format(date, "h:mm a");
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const getPreviewText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Journal Entries</h3>
          <p className="text-muted-foreground">
            Start writing your daily journal to see your entries here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEntries.map((entry) => {
        const entryDate = new Date(entry.date);
        const isExpanded = expandedEntry === entry.id;
        const parsedMetrics = parseMetricsFromText(entry.entry);
        const isSelectedDate = selectedDate && 
          entryDate.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
        
        return (
          <Card 
            key={entry.id} 
            className={`transition-all hover:shadow-md ${isSelectedDate ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateClick(entryDate)}
                      className="h-auto p-0 font-normal"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {getDateLabel(entryDate)}
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {getTimeLabel(entryDate)}
                  </span>
                  {parsedMetrics.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {parsedMetrics.length} metrics
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(entry.id)}
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {isExpanded ? entry.entry : getPreviewText(entry.entry)}
                </ReactMarkdown>
              </div>
              
              {/* Show parsed metrics if any */}
              {isExpanded && parsedMetrics.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Detected Metrics:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedMetrics.map((metric, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="font-medium">{metric.name}</span>
                        <span>
                          {metric.value} {metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}