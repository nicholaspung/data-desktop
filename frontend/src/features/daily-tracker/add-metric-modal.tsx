// src/features/daily-tracker/components/add-metric-modal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddMetricForm from "./add-metric-form";

/**
 * A self-contained component that provides a button to open a modal with the add metric form
 * and handles all the form submission logic.
 */
export default function AddMetricModal({
  buttonLabel = "Add Metric",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  showIcon = true,
  isEdit,
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  showIcon?: boolean;
  isEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        {showIcon && <Plus className="h-4 w-4 mr-2" />}
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Metric" : "Add New Metric"}
            </DialogTitle>
          </DialogHeader>

          <AddMetricForm
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
