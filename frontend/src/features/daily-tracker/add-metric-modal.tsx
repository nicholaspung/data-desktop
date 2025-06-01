import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import AddMetricForm from "./add-metric-form";
import { Metric } from "@/store/experiment-definitions";
import ReusableDialog from "@/components/reusable/reusable-dialog";

export default function AddMetricModal({
  buttonLabel,
  metric,
  onSuccess,
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  showIcon?: boolean;
  metric?: Metric;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!metric;

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
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
      variant="default"
      customFooter={<></>}
    />
  );
}
