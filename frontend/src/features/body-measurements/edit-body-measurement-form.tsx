import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { BodyMeasurementRecord } from "./types";
import { parseISO } from "date-fns";

interface EditBodyMeasurementFormProps {
  record: BodyMeasurementRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
  showButtons?: boolean;
}

export interface EditBodyMeasurementFormRef {
  submit: () => Promise<void>;
  isValid: () => boolean;
  isSubmitting: () => boolean;
}

const EditBodyMeasurementForm = forwardRef<EditBodyMeasurementFormRef, EditBodyMeasurementFormProps>(({
  record,
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

  // Initialize form with record data
  useEffect(() => {
    if (record) {
      setDate(parseISO(record.date));
      setTime(record.time || "");
      setMeasurement(record.measurement);
      setUnit(record.unit);
      setValue(record.value.toString());
      setIsPrivate(record.private || false);
    }
  }, [record]);

  // Common measurement types for autocomplete
  const measurementSuggestions = [
    "Weight",
    "Bodyweight",
    "Waist",
    "Chest",
    "Hips",
    "Bicep",
    "Thigh",
    "Neck",
    "Body Fat",
    "Muscle Mass",
    "BMI",
    "Height",
  ];

  // Common units for autocomplete
  const unitSuggestions = [
    "lbs",
    "kg",
    "inches",
    "in",
    "cm",
    "mm",
    "%",
    "ft",
  ];

  const submitForm = async () => {
    if (!measurement.trim() || !value.trim() || !unit.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(value))) {
      toast.error("Please enter a valid number for the value");
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

      await ApiService.updateRecord(record.id, formData);
      
      toast.success("Body measurement updated successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error updating body measurement:", error);
      toast.error("Failed to update body measurement");
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
      {/* Date and Time Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-date">Date *</Label>
          <ReusableDatePicker
            value={date}
            onChange={(newDate) => newDate && setDate(newDate)}
            placeholder="Select date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-time">Time (Optional)</Label>
          <Input
            id="edit-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="HH:MM"
          />
        </div>
      </div>

      {/* Measurement and Unit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-measurement">Measurement *</Label>
          <AutocompleteInput
            value={measurement}
            onChange={setMeasurement}
            options={measurementSuggestions.map(s => ({ id: s, label: s, value: s }))}
            placeholder="e.g., Weight, Waist, Chest"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-unit">Unit *</Label>
          <AutocompleteInput
            value={unit}
            onChange={setUnit}
            options={unitSuggestions.map(s => ({ id: s, label: s, value: s }))}
            placeholder="e.g., lbs, kg, inches, cm"
          />
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label htmlFor="edit-value">Value *</Label>
        <Input
          id="edit-value"
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter measurement value"
        />
      </div>

      {/* Private checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="edit-private"
          checked={isPrivate}
          onCheckedChange={(checked) => setIsPrivate(checked === true)}
        />
        <Label htmlFor="edit-private" className="text-sm">
          Mark as private (requires PIN to view)
        </Label>
      </div>

      {showButtons && (
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Updating..." : "Update Measurement"}
          </Button>
        </div>
      )}
    </form>
  );
});

EditBodyMeasurementForm.displayName = "EditBodyMeasurementForm";

export default EditBodyMeasurementForm;