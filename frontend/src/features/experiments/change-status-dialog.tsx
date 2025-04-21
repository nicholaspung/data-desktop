// src/features/experiments/change-status-dialog.tsx
import { useState } from "react";
import { CheckCircle, XCircle, Edit } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Experiment } from "@/store/experiment-definitions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChangeStatusDialogProps {
  experiment: Experiment;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (
    newStatus: "active" | "completed" | "paused",
    endState?: string
  ) => Promise<void>;
  isSubmitting: boolean;
}

export default function ChangeStatusDialog({
  experiment,
  isOpen,
  onOpenChange,
  onStatusChange,
  isSubmitting,
}: ChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<
    "active" | "completed" | "paused"
  >(experiment.status);
  const [endState, setEndState] = useState<string>("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedStatus(experiment.status);
    }
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    await onStatusChange(selectedStatus, endState);
  };

  return (
    <ReusableDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      variant="outline"
      triggerIcon={<Edit className="h-4 w-4 mr-2" />}
      triggerText="Change Status"
      title="Change Experiment Status"
      description="Update the status of this experiment."
      customContent={
        <div className="py-4">
          <ReusableSelect
            options={[
              { id: "active", label: "Active" },
              { id: "paused", label: "Paused" },
              { id: "completed", label: "Completed" },
            ]}
            value={selectedStatus}
            onChange={(value) =>
              setSelectedStatus(value as "active" | "completed" | "paused")
            }
            title={"status"}
            renderItem={(option) => (
              <div className="flex items-center">
                {option.id === "active" && (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                )}
                {option.id === "paused" && (
                  <XCircle className="h-4 w-4 mr-2 text-yellow-600" />
                )}
                {option.id === "completed" && (
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                )}
                {option.label}
              </div>
            )}
          />
          <div className="mt-2 text-sm text-muted-foreground">
            {selectedStatus === "active" &&
              "Mark this experiment as active and in progress."}
            {selectedStatus === "paused" &&
              "Temporarily pause this experiment."}
            {selectedStatus === "completed" &&
              "Mark this experiment as completed."}
          </div>
          {selectedStatus === "completed" && (
            <div className="space-y-2">
              <Label htmlFor="end-state">End State</Label>
              <Textarea
                id="end-state"
                placeholder="Describe what the end state of the experiment is about..."
                value={endState}
                onChange={(e) => setEndState(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>
      }
      onCancel={() => handleOpenChange(false)}
      onConfirm={handleConfirm}
      footerActionDisabled={
        isSubmitting || selectedStatus === experiment.status
      }
      loading={isSubmitting}
      footerActionLoadingText="Updating..."
      confirmText="Update Status"
    />
  );
}
