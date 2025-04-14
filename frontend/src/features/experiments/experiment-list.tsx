// src/features/experiments/experiment-list.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Beaker,
  ClipboardCheck,
  Loader2,
  PlusCircle,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { format, isAfter, differenceInDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ExperimentDetail from "./experiment-detail";
import { getStatusBadge } from "./experiments-utils";

const ExperimentList = ({
  onSelectExperiment,
}: {
  onSelectExperiment?: (experimentId: string) => void;
}) => {
  // State
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("active");

  // Access data from store
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const isLoading =
    useStore(loadingStore, (state) => state.experiments) || false;

  // Group experiments by status
  const experimentsByStatus = {
    active: experimentsData.filter((exp: any) => exp.status === "active"),
    paused: experimentsData.filter((exp: any) => exp.status === "paused"),
    completed: experimentsData.filter((exp: any) => exp.status === "completed"),
  };

  // Function to calculate days remaining or elapsed
  const getDaysInfo = (experiment: any) => {
    if (!experiment.start_date) return null;

    const startDate = new Date(experiment.start_date);
    const today = new Date();

    // If experiment hasn't started yet
    if (isAfter(startDate, today)) {
      const daysUntilStart = differenceInDays(startDate, today);
      return {
        text: `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`,
        progress: 0,
      };
    }

    // If experiment has an end date
    if (experiment.end_date) {
      const endDate = new Date(experiment.end_date);
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const daysElapsed = differenceInDays(today, startDate) + 1;

      // If experiment has ended
      if (isAfter(today, endDate)) {
        return {
          text: `Completed`,
          progress: 100,
        };
      }

      // If experiment is ongoing with end date
      const progress = Math.min(
        100,
        Math.round((daysElapsed / totalDays) * 100)
      );
      const daysRemaining = differenceInDays(endDate, today);

      return {
        text: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`,
        progress,
      };
    }

    // If experiment is ongoing without end date
    const daysElapsed = differenceInDays(today, startDate) + 1;
    return {
      text: `Day ${daysElapsed}`,
      progress: 50, // Use 50% for ongoing experiments without end date
    };
  };

  // Handle experiment selection
  const handleSelectExperiment = (experimentId: string) => {
    setSelectedExperimentId(experimentId);

    if (onSelectExperiment) {
      onSelectExperiment(experimentId);
    }
  };

  // If an experiment is selected and detail view is required
  if (selectedExperimentId) {
    return (
      <ExperimentDetail
        experimentId={selectedExperimentId}
        onClose={() => setSelectedExperimentId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Experiment List</h1>

      {/* Experiment Tabs */}
      <Tabs
        defaultValue="active"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="active">
              Active
              {experimentsByStatus.active.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.active.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused
              {experimentsByStatus.paused.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.paused.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              {experimentsByStatus.completed.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.completed.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Experiment Lists for each status */}
        {["active", "paused", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {status === "active" && "Active Experiments"}
                  {status === "paused" && "Paused Experiments"}
                  {status === "completed" && "Completed Experiments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : experimentsByStatus[
                    status as keyof typeof experimentsByStatus
                  ].length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">
                      {status === "active" && "No active experiments yet."}
                      {status === "paused" && "No paused experiments."}
                      {status === "completed" &&
                        "No completed experiments yet."}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab("new")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New Experiment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {experimentsByStatus[
                      status as keyof typeof experimentsByStatus
                    ].map((experiment: any) => {
                      const daysInfo = getDaysInfo(experiment);

                      return (
                        <Collapsible key={experiment.id}>
                          <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                  <Beaker className="h-5 w-5 mr-2 text-primary" />
                                  <h3 className="font-semibold">
                                    {experiment.name}
                                  </h3>
                                </div>
                                {getStatusBadge(
                                  experiment.status,
                                  status.charAt(0).toUpperCase() +
                                    status.slice(1)
                                )}
                              </div>

                              <CollapsibleTrigger className="w-full">
                                <div className="flex justify-between items-center text-sm">
                                  <div className="flex items-center text-muted-foreground">
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    <span>
                                      {format(
                                        new Date(experiment.start_date),
                                        "MMM d, yyyy"
                                      )}
                                      {experiment.end_date &&
                                        ` - ${format(
                                          new Date(experiment.end_date),
                                          "MMM d, yyyy"
                                        )}`}
                                    </span>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform ui-expanded:rotate-180" />
                                </div>

                                {daysInfo && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-sm">
                                      <span>{daysInfo.text}</span>
                                      <span>{daysInfo.progress}%</span>
                                    </div>
                                    <Progress
                                      value={daysInfo.progress}
                                      className="h-1 mt-1"
                                    />
                                  </div>
                                )}
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {experiment.description ||
                                      "No description provided."}
                                  </p>

                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium">
                                        Goal:
                                      </p>
                                      <p className="text-sm">
                                        {experiment.goal ||
                                          "No goal specified."}
                                      </p>
                                    </div>

                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleSelectExperiment(experiment.id)
                                      }
                                    >
                                      <ClipboardCheck className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </CardContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ExperimentList;
