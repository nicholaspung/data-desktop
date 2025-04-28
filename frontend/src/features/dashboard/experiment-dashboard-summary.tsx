// src/features/dashboard/experiment-dashboard-summary.tsx
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Badge } from "@/components/ui/badge";
import { Beaker, Calendar } from "lucide-react";
import dataStore from "@/store/data-store";
import { formatDate } from "@/lib/date-utils";
import { Experiment } from "@/store/experiment-definitions";
import { ProtectedField } from "@/components/security/protected-content";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";

export default function ExperimentDashboardSummary() {
  const [loading, setLoading] = useState(true);
  const experiments = useStore(dataStore, (state) => state.experiments) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const experimentMetrics =
    useStore(dataStore, (state) => state.experiment_metrics) || [];

  const [activeExperiments, setActiveExperiments] = useState<
    Array<Experiment & { progress: number }>
  >([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Filter for active experiments only
    const active = experiments
      .filter((exp) => exp.status === "active")
      .map((exp) => {
        // Calculate progress based on time elapsed
        const startDate = new Date(exp.start_date);
        const endDate = exp.end_date ? new Date(exp.end_date) : null;
        const now = new Date();

        let progress = 0;

        if (endDate) {
          // Calculate total duration in milliseconds
          const totalDuration = endDate.getTime() - startDate.getTime();

          // Calculate elapsed time in milliseconds
          const elapsedTime = now.getTime() - startDate.getTime();

          // Calculate progress as percentage of time elapsed
          if (totalDuration > 0) {
            progress = Math.min(
              100,
              Math.max(0, (elapsedTime / totalDuration) * 100)
            );
          }
        } else {
          // If no end date, calculate progress based on 30 days as default duration
          const defaultDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
          const elapsedTime = now.getTime() - startDate.getTime();
          progress = Math.min(
            100,
            Math.max(0, (elapsedTime / defaultDuration) * 100)
          );
        }

        return {
          ...exp,
          progress: progress,
        };
      })
      .sort((a, b) => {
        // Sort by start date, newest first
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      });

    setActiveExperiments(active);

    // Set the first experiment as selected
    if (active.length > 0 && !selectedExperiment) {
      setSelectedExperiment(active[0].id);
    }

    setLoading(false);
  }, [experiments, experimentMetrics, dailyLogs]);

  // Calculate days remaining for an experiment
  const getDaysRemaining = (experiment: Experiment) => {
    const now = new Date();
    const endDate = experiment.end_date ? new Date(experiment.end_date) : null;

    if (!endDate) return "No end date";

    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 0 ? "Ended" : `${diffDays} days left`;
  };

  const currentExperiment = activeExperiments.find(
    (exp) => exp.id === selectedExperiment
  );

  return (
    <ReusableSummary
      title="Active Experiments"
      titleIcon={<Beaker className="h-5 w-5" />}
      linkTo="/experiments"
      loading={loading}
      emptyState={
        activeExperiments.length === 0
          ? {
              message: "No active experiments",
              actionText: "Create your first experiment",
              actionTo: "/experiments",
            }
          : undefined
      }
      sections={[
        ...(activeExperiments.length > 1
          ? [
              {
                items: [
                  {
                    label: "",
                    value: (
                      <div className="flex flex-wrap gap-2">
                        {activeExperiments.map((exp) => (
                          <Badge
                            key={exp.id}
                            variant={
                              selectedExperiment === exp.id
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => setSelectedExperiment(exp.id)}
                          >
                            {exp.private ? (
                              <ProtectedField>{exp.name}</ProtectedField>
                            ) : (
                              exp.name
                            )}
                          </Badge>
                        ))}
                      </div>
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(currentExperiment
          ? [
              {
                className: "pt-2",
                items: [
                  {
                    label: "",
                    value: (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">
                            <ProtectedField>
                              {currentExperiment.name}
                            </ProtectedField>
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {getDaysRemaining(currentExperiment)}
                          </Badge>
                        </div>

                        <div className="text-sm flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              Started {formatDate(currentExperiment.start_date)}
                            </span>
                          </div>
                          {currentExperiment.end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                Ends {formatDate(currentExperiment.end_date)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Time Progress</span>
                            <span>
                              {Math.round(currentExperiment.progress)}%
                            </span>
                          </div>
                          <Progress
                            value={currentExperiment.progress}
                            className="h-2"
                          />
                        </div>

                        {!currentExperiment.private &&
                          currentExperiment.description && (
                            <p className="text-sm text-muted-foreground">
                              {currentExperiment.description}
                            </p>
                          )}
                        {currentExperiment.private &&
                          currentExperiment.description && (
                            <ProtectedField>
                              <p className="text-sm text-muted-foreground">
                                {currentExperiment.description}
                              </p>
                            </ProtectedField>
                          )}

                        <div className="pt-2">
                          <Link
                            to="/calendar"
                            className="text-sm text-primary hover:underline"
                          >
                            Log data for this experiment
                          </Link>
                        </div>
                      </div>
                    ),
                  },
                ],
              },
            ]
          : []),
      ]}
    />
  );
}
