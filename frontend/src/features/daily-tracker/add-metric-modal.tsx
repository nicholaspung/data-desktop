import { useState, useRef } from "react";
import { Plus, Pencil, Save, Loader2 } from "lucide-react";
import AddMetricForm from "./add-metric-form";
import { Metric } from "@/store/experiment-definitions";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Button } from "@/components/ui/button";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<{ submit: () => Promise<void> }>(null);
  const isEdit = !!metric;

  const handleSuccess = (metricId?: string, metricName?: string) => {
    setOpen(false);
    if (onSuccess) onSuccess(metricId, metricName);
  };

  const handleFormSubmit = async () => {
    if (formRef.current) {
      setIsSubmitting(true);
      try {
        await formRef.current.submit();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={(value) => setOpen(value)}
      contentClassName="max-w-3xl"
      title={isEdit ? "Edit Metric" : "Add New Metric"}
      fixedFooter={true}
      disableDefaultConfirm={true}
      customContent={
        <AddMetricForm
          ref={formRef}
          metric={metric}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
          defaultExperimentId={defaultExperimentId}
          disableExperimentSelection={disableExperimentSelection}
          defaultExperimentName={defaultExperimentName}
          hideButtons={true}
          onSubmittingChange={setIsSubmitting}
        />
      }
      customFooter={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? "Update Metric" : "Create Metric"}
              </>
            )}
          </Button>
        </div>
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
    />
  );
}
