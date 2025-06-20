import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, PenSquare } from "lucide-react";
import dataStore, { addEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { Affirmation } from "@/store/journaling-definitions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import AffirmationForm from "./affirmation-form";
import { InfoPanel } from "@/components/reusable/info-panel";
import { ApiService } from "@/services/api";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import { formatDate } from "@/lib/date-utils";

export default function AffirmationView() {
  const [isEditing, setIsEditing] = useState(false);
  const [affirmationMetric, setAffirmationMetric] = useState<Metric | null>(
    null
  );
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  const entries = useStore(
    dataStore,
    (state) => state.affirmation as Affirmation[]
  );
  const metrics = useStore(dataStore, (state) => state.metrics as Metric[]);
  const dailyLogs = useStore(
    dataStore,
    (state) => state.daily_logs as DailyLog[]
  );

  const latestAffirmation =
    entries.length > 0
      ? [...entries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : null;

  useEffect(() => {
    const metric = metrics.find(
      (m) => m.name?.toLowerCase() === "completed daily affirmation" && m.active
    );
    setAffirmationMetric(metric || null);

    if (metric) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLog = dailyLogs.find((log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return (
          log.metric_id === metric.id && logDate.getTime() === today.getTime()
        );
      });

      setHasLoggedToday(!!todayLog);
    }
  }, [entries, metrics, dailyLogs]);

  const handleLogPractice = async () => {
    if (!latestAffirmation || !affirmationMetric) return;

    try {
      const today = new Date();

      const newLog = {
        date: today,
        metric_id: affirmationMetric.id,
        value: JSON.stringify(true),
        notes: "Completed daily affirmation practice",
      };

      const response = await ApiService.addRecord("daily_logs", newLog);

      if (response) {
        addEntry(response, "daily_logs");
        setHasLoggedToday(true);
        toast.success("Practice logged successfully!");
      }
    } catch (error) {
      console.error("Error logging practice:", error);
      toast.error("Failed to log practice. Please try again.");
    }
  };

  const InfoCard = () => (
    <InfoPanel
      title="About Daily Affirmations"
      defaultExpanded={true}
      storageKey="affirmation-info-panel"
    >
      Create an affirmation to reflect on daily, then track each time you
      practice it. You can update your affirmation at any time.
    </InfoPanel>
  );

  const CurrentAffirmation = () => (
    <Card>
      <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
        <CardTitle className="text-md">
          Current Affirmation
          {latestAffirmation && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Created {formatDate(latestAffirmation.date)}
            </span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsEditing(true)}
          title={"Edit"}
        >
          <PenSquare className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
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
          <ReactMarkdown>{latestAffirmation?.affirmation || ""}</ReactMarkdown>
        </div>

        {affirmationMetric && !hasLoggedToday ? (
          <div className="mt-6 border-t pt-4">
            <Button
              className="w-full"
              variant="default"
              onClick={handleLogPractice}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Log Today's Practice
            </Button>
          </div>
        ) : hasLoggedToday && affirmationMetric ? (
          <div className="border-t pt-2 mt-4 text-center text-sm text-green-600 dark:text-green-400">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Practice logged for today</span>
            </div>
          </div>
        ) : !affirmationMetric ? (
          <div className="border-t pt-2 mt-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Tracking metric not available</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Daily Affirmation</h2>

      <InfoCard />

      {!latestAffirmation || isEditing ? (
        <AffirmationForm
          latestAffirmation={latestAffirmation}
          setIsEditing={setIsEditing}
          hasTodaysAffirmation={false}
        />
      ) : (
        <CurrentAffirmation />
      )}
    </div>
  );
}
