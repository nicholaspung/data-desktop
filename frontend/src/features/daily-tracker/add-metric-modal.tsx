// src/features/daily-tracker/components/add-metric-modal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddMetricForm from "./add-metric-form";
import { Metric } from "@/store/experiment-definitions";

/**
 * A self-contained component that provides a button to open a modal with the add/edit metric form
 * and handles all the form submission logic.
 */
export default function AddMetricModal({
  buttonLabel,
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  showIcon = true,
  metric, // Add metric data prop for editing
  onSuccess, // Callback for when form is submitted successfully
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  showIcon?: boolean;
  metric?: Metric; // Metric data to edit (optional)
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!metric;

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        {showIcon &&
          (isEdit ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          ))}
        {buttonLabel || (isEdit ? "" : "Add Metric")}
      </Button>

      <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Metric" : "Add New Metric"}
            </DialogTitle>
          </DialogHeader>

          <AddMetricForm
            metric={metric}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
