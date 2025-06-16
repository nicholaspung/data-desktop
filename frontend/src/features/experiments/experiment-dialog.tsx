import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, PlusCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { addEntry, updateEntry } from "@/store/data-store";
import { Experiment } from "@/store/experiment-definitions";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";

interface ExperimentDialogProps {
  mode: "add" | "edit";
  experiment?: Experiment;
  onSuccess?: () => void;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
}

export default function ExperimentDialog({
  mode,
  experiment,
  onSuccess,
  buttonLabel,
  buttonVariant = mode === "add" ? "default" : "outline",
  buttonSize = "default",
}: ExperimentDialogProps) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startState, setStartState] = useState("");
  const [endState, setEndState] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<"active" | "paused" | "completed">(
    "active"
  );
  const [isPrivate, setIsPrivate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && experiment) {
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
      setStatus(experiment.status || "active");
      setIsPrivate(experiment.private || false);
    }
  }, [mode, experiment]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartState("");
    setEndState("");
    setGoal("");
    setStartDate(new Date());
    setEndDate(undefined);
    setStatus("active");
    setIsPrivate(false);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!name.trim()) {
      toast.error("Experiment name is required");
      return;
    }

    if (!startState.trim()) {
      toast.error("Experiment start state is required");
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

    if (
      mode === "edit" &&
      experiment?.status === "completed" &&
      !endState.trim()
    ) {
      toast.error("Experiment end state is required for completed experiments");
      return;
    }

    setIsSubmitting(true);

    try {
      const experimentData: Partial<Experiment> = {
        name: name.trim(),
        description: description.trim(),
        start_state: startState.trim(),
        goal: goal.trim(),
        start_date: startDate,
        end_date: endDate,
        private: isPrivate,
      };

      if (mode === "add") {
        experimentData.status = status;
        const response = await ApiService.addRecord(
          "experiments",
          experimentData
        );
        if (response) {
          addEntry(response, "experiments");
          toast.success("Experiment created successfully");
          resetForm();
        }
      } else if (mode === "edit" && experiment) {
        const updatedExperiment = {
          ...experiment,
          ...experimentData,
        };
        if (experiment.status === "completed") {
          updatedExperiment.end_state = endState.trim();
        }

        const response = await ApiService.updateRecord(
          experiment.id,
          updatedExperiment
        );
        if (response) {
          updateEntry(experiment.id, response, "experiments");
          toast.success("Experiment updated successfully");
        }
      }

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(
        `Error ${mode === "add" ? "creating" : "updating"} experiment:`,
        error
      );
      toast.error(
        `Failed to ${mode === "add" ? "create" : "update"} experiment`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
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
          placeholder="Describe what the starting state of the experiment is..."
          value={startState}
          onChange={(e) => setStartState(e.target.value)}
          rows={3}
        />
      </div>
      {mode === "edit" && experiment?.status === "completed" && (
        <div className="space-y-2">
          <Label htmlFor="end-state">End State</Label>
          <Textarea
            id="end-state"
            placeholder="Describe what the end state of the experiment is..."
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
          <ReusableDatePicker
            value={startDate}
            onChange={(date) => date && setStartDate(date)}
            placeholder="Select start date"
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (optional)</Label>
          <ReusableDatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
            minDate={startDate}
          />
        </div>
      </div>
      {mode === "add" && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            defaultValue={status}
            onValueChange={(value) =>
              setStatus(value as "active" | "paused" | "completed")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
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
  );

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      variant={buttonVariant}
      size={buttonSize}
      triggerIcon={
        mode === "add" ? (
          <PlusCircle className="h-4 w-4 mr-2" />
        ) : (
          <Edit className="h-4 w-4 mr-2" />
        )
      }
      triggerText={
        buttonLabel ||
        (mode === "add" ? "Create New Experiment" : "Edit Details")
      }
      title={
        mode === "add" ? "Create New Experiment" : "Edit Experiment Details"
      }
      description={
        mode === "add"
          ? "Set up a new experiment to track specific changes in your routine."
          : "Update the details of this experiment."
      }
      contentClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      customContent={
        <form onSubmit={handleSubmit} className="py-4">
          {formContent}
        </form>
      }
      onCancel={() => setOpen(false)}
      onConfirm={handleSubmit}
      confirmText={mode === "add" ? "Create Experiment" : "Update Experiment"}
      confirmIcon={<Save className="h-4 w-4 mr-2" />}
      loading={isSubmitting}
      footerActionDisabled={isSubmitting}
      footerActionLoadingText={mode === "add" ? "Creating..." : "Updating..."}
      disableDefaultConfirm={true}
    />
  );
}
