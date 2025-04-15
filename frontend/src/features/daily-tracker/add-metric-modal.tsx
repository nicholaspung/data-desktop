// src/features/daily-tracker/components/add-metric-modal.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddMetricForm from "./add-metric-form";
import { toast } from "sonner";
import { ApiService } from "@/services/api";

interface AddMetricModalProps {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  onMetricAdded?: (metric: any) => void;
  showIcon?: boolean;
}

/**
 * A self-contained component that provides a button to open a modal with the add metric form
 * and handles all the form submission logic.
 */
export default function AddMetricModal({
  buttonLabel = "Add Metric",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  onMetricAdded,
  showIcon = true,
}: AddMetricModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demo - in a real app you would fetch these
  const categories = [
    { id: "1", name: "Health & Fitness" },
    { id: "2", name: "Productivity" },
    { id: "3", name: "Learning" },
    { id: "4", name: "Finance" },
  ];

  const experiments = [
    { id: "1", name: "Morning Routine Optimization" },
    { id: "2", name: "Productivity Enhancement" },
  ];

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      // In a real app, you would call your API service
      const response = await ApiService.addRecord("metrics", formData);

      toast.success(`Metric "${formData.name}" created successfully`);

      // Close the modal
      setOpen(false);

      // Notify parent component if callback provided
      if (onMetricAdded) {
        onMetricAdded(response);
      }
    } catch (error) {
      console.error("Error creating metric:", error);
      toast.error("Failed to create metric");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={buttonClassName}
        disabled={loading}
      >
        {showIcon && <Plus className="h-4 w-4 mr-2" />}
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(value) => !loading && setOpen(value)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Metric</DialogTitle>
          </DialogHeader>

          <AddMetricForm
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            categories={categories}
            experiments={experiments}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
