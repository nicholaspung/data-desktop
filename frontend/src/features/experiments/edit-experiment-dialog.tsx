// src/features/experiments/edit-experiment-dialog.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit, CalendarIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import { format } from "date-fns";
import { Experiment } from "@/store/experiment-definitions";
import ReusableDialog from "@/components/reusable/reusable-dialog";

export default function EditExperimentDialog({
  experiment,
  onSuccess,
}: {
  experiment: Experiment;
  onSuccess?: () => void;
}) {
  // Dialog state
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState(experiment?.name || "");
  const [description, setDescription] = useState(experiment?.description || "");
  const [startState, setStartState] = useState(experiment?.start_state || "");
  const [endState, setEndState] = useState(experiment?.end_state || "");
  const [goal, setGoal] = useState(experiment?.goal || "");
  const [startDate, setStartDate] = useState<Date>(
    experiment?.start_date ? new Date(experiment.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    experiment?.end_date ? new Date(experiment.end_date) : undefined
  );
  const [isPrivate, setIsPrivate] = useState(experiment?.private || false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form state when experiment changes
  useEffect(() => {
    if (experiment) {
      setName(experiment.name || "");
      setDescription(experiment.description || "");
      setStartState(experiment.start_state || "");
      setEndState(experiment.end_state || "");
      setGoal(experiment.goal || "");
      setStartDate(
        experiment.start_date ? new Date(experiment.start_date) : new Date()
      );
      setEndDate(
        experiment.end_date ? new Date(experiment.end_date) : undefined
      );
      setIsPrivate(experiment.private || false);
    }
  }, [experiment]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Validate form
    if (!name.trim()) {
      toast.error("Experiment name is required");
      return;
    }

    if (!startState.trim()) {
      toast.error("Experiment start state is required");
      return;
    }

    if (experiment.status === "completed" && !endState.trim()) {
      toast.error("Experiment end state is required");
      return;
    }

    if (!goal.trim()) {
      toast.error("Experiment goal is required");
      return;
    }

    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare updated experiment data
      const updatedExperiment = {
        ...experiment,
        name: name.trim(),
        description: description.trim(),
        start_state: startState.trim(),
        goal: goal.trim(),
        start_date: startDate,
        end_date: endDate,
        private: isPrivate,
      };
      if (experiment.status === "completed") {
        updatedExperiment.end_state = endState.trim();
      }

      // Update experiment
      const response = await ApiService.updateRecord(
        experiment.id,
        updatedExperiment
      );

      if (response) {
        // Update store
        updateEntry(experiment.id, response, "experiments");
        toast.success("Experiment updated successfully");

        // Close dialog
        setOpen(false);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error updating experiment:", error);
      toast.error("Failed to update experiment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      variant="outline"
      size="sm"
      triggerIcon={<Edit className="h-4 w-4 mr-2" />}
      triggerText="Edit Details"
      title="Edit Experiment Details"
      description="Update the details of this experiment."
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      customContent={
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Experiment Name</Label>
            <Input
              id="name"
              placeholder="e.g., 'Intermittent Fasting', 'Daily Meditation'"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this experiment is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-state">Start State</Label>
            <Textarea
              id="start-state"
              placeholder="Describe what the start state of the experiment is about..."
              value={startState}
              onChange={(e) => setStartState(e.target.value)}
              rows={3}
            />
          </div>

          {experiment.status === "completed" && (
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

          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea
              id="goal"
              placeholder="What do you want to achieve with this experiment?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(!!checked)}
            />
            <Label htmlFor="private" className="cursor-pointer">
              Make this experiment private (PIN-protected)
            </Label>
          </div>
        </div>
      }
      onCancel={() => setOpen(false)}
      onConfirm={handleSubmit}
      confirmText="Update Experiment"
      confirmIcon={<Save className="h-4 w-4 mr-2" />}
      loading={isSubmitting}
      footerActionDisabled={isSubmitting}
      footerActionLoadingText="Updating..."
    />
  );
}
