import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Target, Edit, Save } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, deleteEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import AddMetricModal from "@/features/daily-tracker/add-metric-modal";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ExperimentMetric } from "@/store/experiment-definitions";
import { ProtectedContent } from "@/components/security/protected-content";

const ExperimentMetrics = ({
  experimentId,
  showAddButton = true,
  editable = true,
}: {
  experimentId: string;
  showAddButton?: boolean;
  editable?: boolean;
}) => {
  const [experimentMetrics, setExperimentMetrics] = useState<
    ExperimentMetric[]
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ExperimentMetric | null>(
    null
  );
  const [selectedMetricId, setSelectedMetricId] = useState<string>("");
  const [selectedMetricName, setSelectedMetricName] = useState<string>("");
  const [targetValue, setTargetValue] = useState<string | number | boolean>(
    "0"
  );
  const [targetType, setTargetType] = useState<
    "atleast" | "atmost" | "exactly" | "boolean"
  >("atleast");
  const [importance, setImportance] = useState<number>(5);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];

  const currentExperiment = experiments.find(
    (exp: any) => exp.id === experimentId
  );

  useEffect(() => {
    loadExperimentMetrics();
  }, [experimentId, experimentMetricsData]);

  const loadExperimentMetrics = async () => {
    try {
      const metricsForExperiment = experimentMetricsData.filter(
        (m: any) => m.experiment_id === experimentId
      );

      setExperimentMetrics(metricsForExperiment as ExperimentMetric[]);
    } catch (error) {
      console.error("Error loading experiment metrics:", error);
      toast.error("Failed to load experiment metrics");
    }
  };

  const saveMetric = async () => {
    setLoading(true);

    try {
      const metricData = {
        experiment_id: experimentId,
        metric_id: selectedMetricId,
        target: JSON.stringify(targetValue),
        target_type: targetType,
        importance,
        private: isPrivate,
      };

      if (editingMetric) {
        const response = await ApiService.updateRecord(editingMetric.id, {
          ...editingMetric,
          ...metricData,
        });
        if (response) {
          addEntry(response, "experiment_metrics");

          toast.success("Experiment metric updated");
        }
      } else {
        const response = await ApiService.addRecord(
          "experiment_metrics",
          metricData
        );
        if (response) {
          addEntry(response, "experiment_metrics");

          toast.success("Metric added to experiment");
        }
      }

      setDialogOpen(false);
      resetForm();
      await loadExperimentMetrics();
    } catch (error) {
      console.error("Error saving experiment metric:", error);
      toast.error("Failed to save experiment metric");
    } finally {
      setLoading(false);
    }
  };

  const deleteMetric = async (metricId: string) => {
    if (!editable) return;

    try {
      await ApiService.deleteRecord(metricId);
      deleteEntry(metricId, "experiment_metrics");

      toast.success("Metric removed from experiment");
      await loadExperimentMetrics();
    } catch (error) {
      console.error("Error deleting experiment metric:", error);
      toast.error("Failed to remove metric from experiment");
    }
  };

  const resetForm = () => {
    setSelectedMetricId("");
    setSelectedMetricName("");
    setTargetValue("0");
    setTargetType("atleast");
    setImportance(5);
    setIsPrivate(false);
    setEditingMetric(null);
  };

  const openEditDialog = (metric: ExperimentMetric) => {
    if (!editable) return;

    setEditingMetric(metric);
    setSelectedMetricId(metric.metric_id);

    const metricInfo: any = metrics.find((m: any) => m.id === metric.metric_id);
    if (metricInfo) {
      setSelectedMetricName(metricInfo.name);
      try {
        setTargetValue(JSON.parse(metric.target));
      } catch (e: any) {
        console.error(e);
        if (metricInfo.type === "boolean") {
          setTargetValue(true);
        } else {
          setTargetValue(0);
        }
      }
    }

    setTargetType(metric.target_type);
    setImportance(metric.importance);
    setIsPrivate(metric.private || false);
    setDialogOpen(true);
  };

  const formatTargetValue = (metric: ExperimentMetric): string => {
    const metricInfo: any = metrics.find((m: any) => m.id === metric.metric_id);
    if (!metricInfo) return "N/A";

    try {
      const targetVal = JSON.parse(metric.target);

      if (metricInfo.type === "boolean") {
        return targetVal ? "Complete" : "Skip";
      } else {
        const value =
          typeof targetVal === "number" ? targetVal : Number(targetVal);
        const formattedValue = isNaN(value) ? targetVal : value.toString();

        switch (metric.target_type) {
          case "atleast":
            return `At least ${formattedValue}${metricInfo.unit ? ` ${metricInfo.unit}` : ""}`;
          case "atmost":
            return `At most ${formattedValue}${metricInfo.unit ? ` ${metricInfo.unit}` : ""}`;
          case "exactly":
            return `Exactly ${formattedValue}${metricInfo.unit ? ` ${metricInfo.unit}` : ""}`;
          default:
            return `${formattedValue}${metricInfo.unit ? ` ${metricInfo.unit}` : ""}`;
        }
      }
    } catch (e: any) {
      console.error(e);
      return "Invalid target";
    }
  };

  const renderTargetField = () => {
    const metricInfo: any = metrics.find((m: any) => m.id === selectedMetricId);
    if (!metricInfo) return null;

    switch (metricInfo.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="metric-target"
              checked={!!targetValue}
              onCheckedChange={(checked) => setTargetValue(!!checked)}
            />
            <Label htmlFor="metric-target">Complete this metric</Label>
          </div>
        );
      case "number":
      case "percentage":
      case "time":
        return (
          <div className="space-y-2">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="target-type">Target Type</Label>
                <AutocompleteInput
                  id="target-type-select"
                  label=""
                  value={
                    targetType === "atleast"
                      ? "At least"
                      : targetType === "atmost"
                        ? "At most"
                        : "Exactly"
                  }
                  onChange={(value) => {
                    if (value === "At least") setTargetType("atleast");
                    else if (value === "At most") setTargetType("atmost");
                    else if (value === "Exactly") setTargetType("exactly");
                  }}
                  options={[
                    { id: "atleast", label: "At least" },
                    { id: "atmost", label: "At most" },
                    { id: "exactly", label: "Exactly" },
                  ]}
                  placeholder="Select target type"
                  usePortal={true}
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="target-value">
                  Target Value {metricInfo.unit ? `(${metricInfo.unit})` : ""}
                </Label>
                <Input
                  id="target-value"
                  type="number"
                  value={targetValue as number}
                  onChange={(e) =>
                    setTargetValue(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="target-value">Target Value</Label>
            <Input
              id="target-value"
              value={targetValue as string}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
        );
    }
  };

  const renderMetricContent = (metric: ExperimentMetric) => {
    return (
      <div className="relative">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">
                {metric.metric_id_data?.name || "Unknown Metric"}
              </h3>
              <div className="text-sm text-muted-foreground">
                {metric.metric_id_data?.description}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Importance: {metric.importance}/10
              </Badge>

              {editable && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(metric)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteMetric(metric.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center">
            <Target className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">
              Goal: {formatTargetValue(metric)}
            </span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Type: {metric.metric_id_data?.type || "Unknown"}
            {metric.metric_id_data?.unit &&
              ` • Unit: ${metric.metric_id_data.unit}`}
            {metric.private && " • Private"}
          </div>
        </CardContent>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Metrics & Goals</CardTitle>
          {showAddButton && editable && (
            <ReusableDialog
              open={dialogOpen}
              onOpenChange={(value) => {
                resetForm();
                setEditingMetric(null);
                setDialogOpen(value);
              }}
              variant="outline"
              size="sm"
              triggerIcon={<Plus className="h-4 w-4 mr-2" />}
              triggerText="Add Metric"
              title={
                editingMetric ? "Edit Metric Goal" : "Add Metric to Experiment"
              }
              description={
                editingMetric
                  ? "Update the target for this metric"
                  : "Set a target for tracking this metric in your experiment"
              }
              customContent={
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="metric-select">Metric</Label>
                      {!editingMetric && (
                        <AddMetricModal
                          buttonLabel="Create New Metric"
                          buttonVariant="outline"
                          buttonSize="sm"
                          defaultExperimentId={experimentId}
                          disableExperimentSelection={true}
                          defaultExperimentName={currentExperiment?.name}
                          onSuccess={(
                            metricId?: string,
                            metricName?: string
                          ) => {
                            if (metricId && metricName) {
                              setSelectedMetricId(metricId);
                              setSelectedMetricName(metricName);
                            }
                          }}
                        />
                      )}
                    </div>
                    <AutocompleteInput
                      id="metric-select"
                      label=""
                      value={selectedMetricName}
                      onChange={(value) => {
                        setSelectedMetricName(value);
                        const metric = metrics.find(
                          (m: any) => m.name === value
                        );
                        if (metric) {
                          setSelectedMetricId(metric.id);
                        } else {
                          setSelectedMetricId("");
                        }
                      }}
                      options={metrics.map((m: any) => ({
                        id: m.id,
                        label: m.name,
                      }))}
                      placeholder="Search for a metric..."
                      disabled={!!editingMetric}
                      description={
                        selectedMetricName && !selectedMetricId
                          ? "Metric not found. Please select an existing metric or create a new one."
                          : ""
                      }
                      className={
                        selectedMetricName && !selectedMetricId
                          ? "border-destructive"
                          : ""
                      }
                      usePortal={true}
                    />
                  </div>

                  {selectedMetricId && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-medium">Set Target</h3>
                        {renderTargetField()}
                        <div className="space-y-2">
                          <Label htmlFor="importance">
                            Importance (1-10): {importance}
                          </Label>
                          <Input
                            id="importance"
                            type="range"
                            min="1"
                            max="10"
                            value={importance}
                            onChange={(e) =>
                              setImportance(parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Less important</span>
                            <span>More important</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="private"
                            checked={isPrivate}
                            onCheckedChange={(checked) =>
                              setIsPrivate(!!checked)
                            }
                          />
                          <Label htmlFor="private" className="cursor-pointer">
                            Make this metric private (PIN-protected)
                          </Label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              }
              onCancel={() => setDialogOpen(false)}
              onConfirm={saveMetric}
              footerActionDisabled={
                !selectedMetricId ||
                loading ||
                (!!selectedMetricName && !selectedMetricId)
              }
              confirmText={editingMetric ? "Update Metric" : "Add Metric"}
              confirmIcon={<Save className="h-4 w-4 mr-2" />}
            />
          )}
        </CardHeader>
        <CardContent>
          {experimentMetrics.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                No metrics added to this experiment yet.
              </p>
              {showAddButton && editable && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setEditingMetric(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Metric
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {experimentMetrics.map((metric) => (
                <Card key={metric.id} className="bg-accent/10">
                  {metric.private ? (
                    <ProtectedContent>
                      {renderMetricContent(metric)}
                    </ProtectedContent>
                  ) : (
                    renderMetricContent(metric)
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperimentMetrics;
