// src/features/experiments/experiment-detail.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { useStore } from "@tanstack/react-store";
import dataStore, { deleteEntry, updateEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { Edit, CheckCircle, XCircle, Loader2, ChevronLeft } from "lucide-react";
import ExperimentDashboard from "./experiment-dashboard";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableCard from "@/components/reusable/reusable-card";
import { Experiment } from "@/store/experiment-definitions";
import { ProtectedContent } from "@/components/security/protected-content";
import EditExperimentDialog from "./edit-experiment-dialog";

const ExperimentDetail = ({
  experimentId,
  onClose,
  onDelete,
  handleBackToList,
}: {
  experimentId: string;
  onClose?: () => void;
  onDelete?: () => void;
  handleBackToList: () => void;
}) => {
  // State
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"active" | "completed" | "paused">(
    "active"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Access data from store
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];

  // Load experiment data
  useEffect(() => {
    loadExperiment();
  }, [experimentId, experimentsData]);

  const loadExperiment = async () => {
    setLoading(true);

    try {
      const experimentData: any = experimentsData.find(
        (exp: any) => exp.id === experimentId
      );
      if (experimentData) {
        setExperiment(experimentData);
        setNewStatus(
          experimentData.status as "active" | "completed" | "paused"
        );
      }
    } catch (error) {
      console.error("Error loading experiment:", error);
      toast.error("Failed to load experiment");
    } finally {
      setLoading(false);
    }
  };

  // Handle experiment deletion
  const handleDelete = async () => {
    try {
      await ApiService.deleteRecord(experimentId);
      deleteEntry(experimentId, "experiments");

      toast.success("Experiment deleted");

      if (onDelete) {
        onDelete();
      }

      // Navigate back after deletion
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting experiment:", error);
      toast.error("Failed to delete experiment");
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    setIsSubmitting(true);

    try {
      const updatedExperiment = {
        ...experiment,
        status: newStatus,
      };

      await ApiService.updateRecord(experimentId, updatedExperiment);
      updateEntry(experimentId, updatedExperiment, "experiments");

      toast.success(`Experiment marked as ${newStatus}`);
      setStatusDialogOpen(false);
      loadExperiment();
    } catch (error) {
      console.error("Error updating experiment status:", error);
      toast.error("Failed to update experiment status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <ReusableCard
        showHeader={false}
        contentClassName="p-8 text-center"
        content={
          <>
            <p className="text-muted-foreground">Experiment not found</p>
            {onClose && (
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Go Back
              </Button>
            )}
          </>
        }
      />
    );
  }

  const Content = () => (
    <div className="space-y-6">
      {/* Experiment Header with Controls */}
      <div className="flex justify-between items-start">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToList}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Experiments
        </Button>

        <div className="flex gap-2">
          <EditExperimentDialog
            experiment={experiment}
            onSuccess={loadExperiment}
          />
          <ReusableDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
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
                  value={newStatus}
                  onChange={(value) =>
                    setNewStatus(value as "active" | "completed" | "paused")
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
                  {newStatus === "active" &&
                    "Mark this experiment as active and in progress."}
                  {newStatus === "paused" &&
                    "Temporarily pause this experiment."}
                  {newStatus === "completed" &&
                    "Mark this experiment as completed."}
                </div>
              </div>
            }
            onCancel={() => setStatusDialogOpen(false)}
            onConfirm={handleStatusChange}
            footerActionDisabled={
              isSubmitting || newStatus === experiment.status
            }
            loading={isSubmitting}
            footerActionLoadingText="Updating..."
            confirmText="Update Status"
          />

          <ConfirmDeleteDialog
            title="Delete Experiment"
            description="Are you sure you want to delete this experiment? This action cannot be undone and will remove all associated data."
            triggerText="Delete"
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {/* Experiment Dashboard */}
      <ExperimentDashboard experimentId={experimentId} />
    </div>
  );

  return experiment.private ? (
    <ProtectedContent>
      <Content />
    </ProtectedContent>
  ) : (
    <Content />
  );
};

export default ExperimentDetail;
