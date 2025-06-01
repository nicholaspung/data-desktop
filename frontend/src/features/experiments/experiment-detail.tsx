import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { useStore } from "@tanstack/react-store";
import dataStore, { deleteEntry, updateEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { Loader2, ChevronLeft } from "lucide-react";
import ExperimentDashboard from "./experiment-dashboard";
import ReusableCard from "@/components/reusable/reusable-card";
import { Experiment } from "@/store/experiment-definitions";
import { ProtectedContent } from "@/components/security/protected-content";
import EditExperimentDialog from "./edit-experiment-dialog";
import ChangeStatusDialog from "./change-status-dialog";

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
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];

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
      }
    } catch (error) {
      console.error("Error loading experiment:", error);
      toast.error("Failed to load experiment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ApiService.deleteRecord(experimentId);
      deleteEntry(experimentId, "experiments");

      toast.success("Experiment deleted");

      if (onDelete) {
        onDelete();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting experiment:", error);
      toast.error("Failed to delete experiment");
    }
  };

  const handleStatusChange = async (
    newStatus: "active" | "completed" | "paused",
    endState?: string
  ) => {
    setIsSubmitting(true);

    try {
      const updatedExperiment = {
        ...experiment,
        status: newStatus,
      };
      if (newStatus === "completed" && endState) {
        updatedExperiment.end_state = endState;
      }

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
          <ChangeStatusDialog
            experiment={experiment}
            isOpen={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            onStatusChange={handleStatusChange}
            isSubmitting={isSubmitting}
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
