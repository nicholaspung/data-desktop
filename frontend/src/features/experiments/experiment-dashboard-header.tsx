import ReusableCard from "@/components/reusable/reusable-card";
import { Experiment } from "@/store/experiment-definitions";
import { getStatusBadge } from "./experiments-utils";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ProgressDataType } from "./experiment-dashboard";

export default function ExperimentDashboardHeader({
  experiment,
  progressData,
}: {
  experiment: Experiment;
  progressData: ProgressDataType;
}) {
  return (
    <ReusableCard
      showHeader={false}
      contentClassName="pt-6"
      content={
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{experiment.name}</h2>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                {experiment.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {experiment &&
                  getStatusBadge(
                    experiment.status,
                    experiment.status.charAt(0).toUpperCase() +
                      experiment.status.slice(1)
                  )}
                <div className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>
                    {format(new Date(experiment.start_date), "MMM d, yyyy")}
                    {experiment.end_date && (
                      <>
                        {" "}
                        - {format(new Date(experiment.end_date), "MMM d, yyyy")}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Time Progress
                </div>
                <div className="text-2xl font-bold">
                  {progressData.totalDays > 0
                    ? Math.round(
                        (progressData.daysElapsed / progressData.totalDays) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
              <Progress
                value={
                  progressData.totalDays > 0
                    ? (progressData.daysElapsed / progressData.totalDays) * 100
                    : 0
                }
                className="w-32 h-2"
              />
              <div className="text-sm">
                {progressData.daysRemaining === 0
                  ? "Experiment complete"
                  : `${progressData.daysRemaining} days remaining`}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Start State</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {experiment.start_state}
              </p>
            </div>
            <div>
              <h3 className="font-medium">End State</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {experiment.end_state || "Not completed"}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Goal</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {experiment.goal || "No goal specified"}
              </p>
            </div>
          </div>
        </>
      }
    />
  );
}
