import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import AddMetricModal from "./add-metric-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { Metric } from "@/store/experiment-definitions";

export default function MetricManagement() {
  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  const handleDeleteMetric = async (metric: Metric) => {
    try {
      await ApiService.deleteRecord(metric.id);
      deleteEntry(metric.id, "metrics");
      toast.success("Metric deleted successfully");
    } catch (error) {
      console.error("Error deleting metric:", error);
      toast.error("Failed to delete metric");
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Metrics</h2>
        <AddMetricModal buttonLabel="Add New Metric" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No metrics added yet</p>
              <AddMetricModal
                buttonLabel="Create Your First Metric"
                buttonClassName="mt-4"
              />
            </CardContent>
          </Card>
        ) : (
          metrics.map((metric: Metric) => (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{metric.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {metric.description}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {metric.type}
                        {metric.unit ? ` (${metric.unit})` : ""}
                      </Badge>

                      <Badge variant="secondary">
                        {getCategoryName(metric.category_id)}
                      </Badge>

                      {metric.private && (
                        <Badge variant="destructive">Private</Badge>
                      )}

                      {!metric.active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AddMetricModal
                      metric={metric}
                      buttonVariant="ghost"
                      buttonSize="icon"
                      showIcon={true}
                      buttonLabel=""
                    />

                    <ConfirmDeleteDialog
                      onConfirm={() => handleDeleteMetric(metric)}
                      triggerText=""
                      title="Delete Metric"
                      description={`Are you sure you want to delete "${metric.name}"? This action cannot be undone.`}
                      size="icon"
                      variant="ghost"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
