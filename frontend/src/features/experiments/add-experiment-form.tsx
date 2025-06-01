import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { format } from "date-fns";
import { Experiment } from "@/store/experiment-definitions";

export default function AddExperimentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startState, setStartState] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<"active" | "paused" | "completed">(
    "active"
  );
  const [isPrivate, setIsPrivate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsSubmitting(true);

    try {
      const experimentData: Partial<Experiment> = {
        name: name.trim(),
        description: description.trim(),
        start_state: startState.trim(),
        goal: goal.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        private: isPrivate,
      };

      const response = await ApiService.addRecord(
        "experiments",
        experimentData
      );

      if (response) {
        addEntry(response, "experiments");
        toast.success("Experiment created successfully");

        resetForm();

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating experiment:", error);
      toast.error("Failed to create experiment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartState("");
    setGoal("");
    setStartDate(new Date());
    setEndDate(undefined);
    setStatus("active");
    setIsPrivate(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            <SelectItem value={"active"}>Active</SelectItem>
            <SelectItem value={"paused"}>Paused</SelectItem>
            <SelectItem value={"completed"}>Completed</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Experiment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
