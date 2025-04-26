import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import ExperimentDetail from "./experiment-detail";
import ExperimentListItem from "./experiment-list-item";
import { Experiment } from "@/store/experiment-definitions";
import AddExperimentDialog from "./add-experiment-dialog";
import ReusableTabs from "@/components/reusable/reusable-tabs";

const ExperimentList = ({
  onSelectExperiment,
}: {
  onSelectExperiment?: (experimentId: string) => void;
}) => {
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("active");

  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const isLoading =
    useStore(loadingStore, (state) => state.experiments) || false;

  const experimentsByStatus = {
    active: experimentsData.filter((exp: any) => exp.status === "active"),
    paused: experimentsData.filter((exp: any) => exp.status === "paused"),
    completed: experimentsData.filter((exp: any) => exp.status === "completed"),
  };

  const handleSelectExperiment = (experimentId: string) => {
    setSelectedExperimentId(experimentId);

    if (onSelectExperiment) {
      onSelectExperiment(experimentId);
    }
  };

  const handleBackToList = () => {
    setSelectedExperimentId(null);
  };

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
    <ReusableTabs
      tabs={[
        {
          id: "active",
          label: (
            <>
              Active
              {experimentsByStatus.active.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.active.length}
                </Badge>
              )}
            </>
          ),
          content: (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Active Experiments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : experimentsByStatus.active.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        No active experiments yet.
                      </p>
                      <AddExperimentDialog
                        buttonVariant="outline"
                        buttonClassName="mt-4"
                        onSuccess={() => setActiveTab("active")}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {experimentsByStatus.active.map(
                        (experiment: Experiment) => (
                          <ExperimentListItem
                            key={experiment.id}
                            experiment={experiment}
                            handleSelectExperiment={handleSelectExperiment}
                            status="active"
                          />
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ),
        },
        {
          id: "paused",
          label: (
            <>
              Paused
              {experimentsByStatus.paused.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.paused.length}
                </Badge>
              )}
            </>
          ),
          content: (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Paused Experiments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : experimentsByStatus.paused.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        No paused experiments.
                      </p>
                      <AddExperimentDialog
                        buttonVariant="outline"
                        buttonClassName="mt-4"
                        onSuccess={() => setActiveTab("active")}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {experimentsByStatus.paused.map(
                        (experiment: Experiment) => (
                          <ExperimentListItem
                            key={experiment.id}
                            experiment={experiment}
                            handleSelectExperiment={handleSelectExperiment}
                            status="paused"
                          />
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ),
        },
        {
          id: "completed",
          label: (
            <>
              Completed
              {experimentsByStatus.completed.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {experimentsByStatus.completed.length}
                </Badge>
              )}
            </>
          ),
          content: (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Completed Experiments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : experimentsByStatus.completed.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        No completed experiments yet.
                      </p>
                      <AddExperimentDialog
                        buttonVariant="outline"
                        buttonClassName="mt-4"
                        onSuccess={() => setActiveTab("active")}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {experimentsByStatus.completed.map(
                        (experiment: Experiment) => (
                          <ExperimentListItem
                            key={experiment.id}
                            experiment={experiment}
                            handleSelectExperiment={handleSelectExperiment}
                            status="completed"
                          />
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ),
        },
      ]}
      defaultTabId={activeTab}
      onChange={setActiveTab}
    />
  );
};

export default ExperimentList;
