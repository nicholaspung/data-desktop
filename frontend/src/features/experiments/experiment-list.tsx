// Updated version to add the new button to experiment-list.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import ExperimentDetail from "./experiment-detail";
import ExperimentListItem from "./experiment-list-item";
import { Experiment } from "@/store/experiment-definitions";
import AddExperimentDialog from "./add-experiment-dialog"; // Add this import

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

  // Handle experiment selection
  const handleSelectExperiment = (experimentId: string) => {
    setSelectedExperimentId(experimentId);

    if (onSelectExperiment) {
      onSelectExperiment(experimentId);
    }
  };

  // Handle going back to experiment list
  const handleBackToList = () => {
    setSelectedExperimentId(null);
  };

  // If an experiment is selected and detail view is required
  if (selectedExperimentId) {
    return (
      <ExperimentDetail
        experimentId={selectedExperimentId}
        onClose={handleBackToList}
        handleBackToList={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Experiment List</h1>

        {/* Add the new button here */}
        <AddExperimentDialog
          buttonLabel="Create New Experiment"
          onSuccess={() => setActiveTab("active")}
        />
      </div>

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
                    {/* Replace this button with our AddExperimentDialog */}
                    <AddExperimentDialog
                      buttonVariant="outline"
                      buttonClassName="mt-4"
                      onSuccess={() => setActiveTab("active")}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {experimentsByStatus[
                      status as keyof typeof experimentsByStatus
                    ].map((experiment: Experiment) => (
                      <ExperimentListItem
                        key={experiment.id}
                        experiment={experiment}
                        handleSelectExperiment={handleSelectExperiment}
                        status={status}
                      />
                    ))}
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
