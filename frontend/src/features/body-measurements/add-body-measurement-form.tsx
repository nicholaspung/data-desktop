import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import useLoadData from "@/hooks/useLoadData";
import { BODY_MEASUREMENTS_FIELD_DEFINITIONS } from "@/features/field-definitions/body-measurements-definitions";

interface AddBodyMeasurementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showButtons?: boolean;
}

export interface AddBodyMeasurementFormRef {
  submit: () => Promise<void>;
  isValid: () => boolean;
  isSubmitting: () => boolean;
}

const AddBodyMeasurementForm = forwardRef<AddBodyMeasurementFormRef, AddBodyMeasurementFormProps>(({
  onSuccess,
  onCancel,
  showButtons = true,
}, ref) => {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");
  const [measurement, setMeasurement] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { loadData } = useLoadData({
    fields: BODY_MEASUREMENTS_FIELD_DEFINITIONS.fields,
    datasetId: "body_measurements",
    title: "Body Measurements",
  });

  // Common measurement types for autocomplete
  const measurementSuggestions = [
    "Weight",
    "Bodyweight",
    "Waist",
    "Chest",
    "Hips",
    "Neck",
    "Upper Arm (Right)",
    "Upper Arm (Left)",
    "Forearm (Right)",
    "Forearm (Left)",
    "Thigh (Right)",
    "Thigh (Left)",
    "Calf (Right)",
    "Calf (Left)",
    "Body Fat Percentage",
    "Muscle Mass",
    "Bicep",
    "Shoulders",
  ];

  // Common units for autocomplete
  const unitSuggestions = [
    "lbs",
    "kg",
    "inches",
    "cm",
    "mm",
    "%",
    "g",
  ];

  const submitForm = async () => {
    if (!measurement || !value || !unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        date: date.toISOString(),
        time: time || undefined,
        measurement,
        value: parseFloat(value),
        unit,
        private: isPrivate,
      };

      await ApiService.addRecord("body_measurements", formData);
      await loadData();
      
      toast.success("Body measurement added successfully!");
      
      // Reset form
      setDate(new Date());
      setTime("");
      setMeasurement("");
      setUnit("");
      setValue("");
      setIsPrivate(false);
      
      onSuccess?.();
    } catch (error) {
      console.error("Error adding body measurement:", error);
      toast.error("Failed to add body measurement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const isFormValid = Boolean(measurement && value && unit && !isNaN(parseFloat(value)));

  useImperativeHandle(ref, () => ({
    submit: submitForm,
    isValid: () => isFormValid,
    isSubmitting: () => isSubmitting,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium">
            Date *
          </Label>
          <ReusableDatePicker
            value={date}
            onChange={(newDate) => newDate && setDate(newDate)}
            placeholder="Select date"
            className="w-full"
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm font-medium">
            Time
          </Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Measurement */}
      <div className="space-y-2">
        <Label htmlFor="measurement" className="text-sm font-medium">
          Measurement *
        </Label>
        <AutocompleteInput
          value={measurement}
          onChange={setMeasurement}
          options={measurementSuggestions.map(suggestion => ({ id: suggestion, label: suggestion }))}
          placeholder="Enter measurement type (e.g., Weight, Waist, Chest)"
          className="w-full"
          usePortal={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit */}
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">
            Unit *
          </Label>
          <AutocompleteInput
            value={unit}
            onChange={setUnit}
            options={unitSuggestions.map(suggestion => ({ id: suggestion, label: suggestion }))}
            placeholder="Enter unit (e.g., lbs, kg, inches, cm)"
            className="w-full"
            usePortal={true}
          />
        </div>

        {/* Value */}
        <div className="space-y-2">
          <Label htmlFor="value" className="text-sm font-medium">
            Value *
          </Label>
          <Input
            id="value"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter measurement value"
            className="w-full"
          />
        </div>
      </div>

      {/* Private */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="private"
          checked={isPrivate}
          onCheckedChange={(checked) => setIsPrivate(checked === "indeterminate" ? false : !!checked)}
        />
        <Label
          htmlFor="private"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Mark as private (requires PIN to view)
        </Label>
      </div>

      {/* Form Buttons */}
      {showButtons && (
        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Measurement"}
          </Button>
        </div>
      )}
    </form>
  );
});

AddBodyMeasurementForm.displayName = "AddBodyMeasurementForm";

export default AddBodyMeasurementForm;