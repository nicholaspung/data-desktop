import ReusableCard from "@/components/reusable/reusable-card";
import { Button } from "@/components/ui/button";
import { dateStrToLocalDate } from "@/lib/date-utils";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import { format } from "date-fns";
import { ListTodo } from "lucide-react";

export default function ExperimentDashboardLogs({
  dailyLogs,
  metrics,
}: {
  dailyLogs: DailyLog[];
  metrics: Metric[];
}) {
  return (
    <ReusableCard
      title="Recent Daily Logs"
      content={
        dailyLogs.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No logs recorded yet</p>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/experiments?tab=daily_logs">
                <ListTodo className="h-4 w-4 mr-2" />
                Go to Daily Tracker
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group logs by date */}
            {Object.entries(
              dailyLogs.reduce((acc: Record<string, any[]>, log) => {
                const dateStr = format(new Date(log.date), "yyyy-MM-dd");
                if (!acc[dateStr]) acc[dateStr] = [];
                acc[dateStr].push(log);
                return acc;
              }, {})
            )
              .sort(
                (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
              )
              .slice(0, 7) // Show most recent 7 days
              .map(([dateStr, logs]) => (
                <div key={dateStr} className="space-y-2">
                  <h3 className="font-medium">
                    {format(dateStrToLocalDate(dateStr), "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    {logs.map((log) => {
                      const metric = metrics.find(
                        (m) => m.id === log.metric_id
                      );
                      if (!metric) return null;

                      let displayValue;
                      try {
                        const value = JSON.parse(log.value);
                        if (metric.type === "boolean") {
                          displayValue = value ? "Completed" : "Not Completed";
                        } else {
                          displayValue = `${value}${metric.unit ? ` ${metric.unit}` : ""}`;
                        }
                      } catch (e: any) {
                        console.error(e);
                        displayValue = log.value;
                      }

                      return (
                        <ReusableCard
                          showHeader={false}
                          cardClassName="bg-accent/10"
                          contentClassName="p-3"
                          content={
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{metric.name}</div>
                                <div className="text-sm">{displayValue}</div>
                                {log.notes && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {log.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )
      }
    />
  );
}
