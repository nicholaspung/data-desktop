import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import AddMetricForm from "./add-metric-form";
import { Metric } from "@/store/experiment-definitions";
import ReusableDialog from "@/components/reusable/reusable-dialog";

export default function AddMetricModal({
  buttonLabel,
  buttonVariant,
  buttonSize,
  buttonClassName,
  metric,
  onSuccess,
  defaultExperimentId,
  disableExperimentSelection = false,
  defaultExperimentName,
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  metric?: Metric;
  onSuccess?: (metricId?: string, metricName?: string) => void;
  defaultExperimentId?: string;
  disableExperimentSelection?: boolean;
  defaultExperimentName?: string;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!metric;

  const handleSuccess = (metricId?: string, metricName?: string) => {
    setOpen(false);
    if (onSuccess) onSuccess(metricId, metricName);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={(value) => setOpen(value)}
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      title={isEdit ? "Edit Metric" : "Add New Metric"}
      customContent={
        <AddMetricForm
          metric={metric}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
          defaultExperimentId={defaultExperimentId}
          disableExperimentSelection={disableExperimentSelection}
          defaultExperimentName={defaultExperimentName}
        />
      }
      triggerIcon={
        isEdit ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )
      }
      triggerText={buttonLabel || (isEdit ? "" : "Add Metric")}
      variant={buttonVariant || "default"}
      size={buttonSize}
      triggerClassName={buttonClassName}
      customFooter={<></>}
    />
  );
}
