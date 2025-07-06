import { useState, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";

interface AddBloodMarkerFormProps {
  onSuccess?: () => void;
}

export interface AddBloodMarkerFormRef {
  submit: () => void;
  isSubmitting: boolean;
}

const AddBloodMarkerForm = forwardRef<AddBloodMarkerFormRef, AddBloodMarkerFormProps>(
  ({ onSuccess }, ref) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    unit: "",
    general_reference: "",
    optimal_general: "",
    lower_reference: "",
    upper_reference: "",
    optimal_low: "",
    optimal_high: "",
  });

  const markers = useStore(dataStore, (state) => state.blood_markers);

  // Create category options from existing markers
  const categoryOptions = Array.from(
    new Set(
      markers
        .map((marker) => marker.category)
        .filter((category): category is string => category !== undefined && category.trim() !== "")
    )
  )
    .sort()
    .map((category) => ({
      id: category,
      label: category,
    }));

  // Create unit options from existing markers
  const unitOptions = Array.from(
    new Set(
      markers
        .map((marker) => marker.unit)
        .filter((unit): unit is string => unit !== undefined && unit.trim() !== "")
    )
  )
    .sort()
    .map((unit) => ({
      id: unit,
      label: unit,
    }));

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit(),
    isSubmitting
  }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Marker name is required");
      return;
    }

    if (!formData.category.trim()) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data for submission
      const submitData = {
        ...formData,
        // Convert numeric fields to numbers where provided
        lower_reference: formData.lower_reference ? Number(formData.lower_reference) : undefined,
        upper_reference: formData.upper_reference ? Number(formData.upper_reference) : undefined,
        optimal_low: formData.optimal_low ? Number(formData.optimal_low) : undefined,
        optimal_high: formData.optimal_high ? Number(formData.optimal_high) : undefined,
      };

      // Remove empty strings but keep undefined for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === "") {
          delete submitData[key as keyof typeof submitData];
        }
      });

      const response = await ApiService.addRecord("blood_markers", submitData);
      
      if (response) {
        addEntry(response, "blood_markers");
        toast.success("Blood marker added successfully!");
        
        // Reset form
        setFormData({
          name: "",
          category: "",
          description: "",
          unit: "",
          general_reference: "",
          optimal_general: "",
          lower_reference: "",
          upper_reference: "",
          optimal_low: "",
          optimal_high: "",
        });
        
        onSuccess?.();
      } else {
        toast.error("Failed to add blood marker");
      }
    } catch (error) {
      console.error("Error adding blood marker:", error);
      toast.error("Failed to add blood marker");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center">
          Marker Name
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter marker name"
          required
        />
      </div>

      <AutocompleteInput
        id="category"
        label="Category"
        value={formData.category}
        onChange={(value) => handleInputChange("category", value)}
        options={categoryOptions}
        placeholder="e.g., Lipids, Metabolic, Hormones"
        required
        showRecentOptions={false}
      />

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="What does this marker measure?"
          rows={3}
        />
      </div>

      <AutocompleteInput
        id="unit"
        label="Unit"
        value={formData.unit}
        onChange={(value) => handleInputChange("unit", value)}
        options={unitOptions}
        placeholder="e.g., mg/dL, mmol/L, IU/L"
        showRecentOptions={false}
      />

      <div className="space-y-2">
        <Label htmlFor="general_reference">General Reference</Label>
        <Input
          id="general_reference"
          value={formData.general_reference}
          onChange={(e) => handleInputChange("general_reference", e.target.value)}
          placeholder="e.g., 10-40 mg/dL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="optimal_general">Optimal General</Label>
        <Input
          id="optimal_general"
          value={formData.optimal_general}
          onChange={(e) => handleInputChange("optimal_general", e.target.value)}
          placeholder="e.g., 15-25 mg/dL"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lower_reference">Lower Reference</Label>
          <Input
            id="lower_reference"
            type="number"
            step="any"
            value={formData.lower_reference}
            onChange={(e) => handleInputChange("lower_reference", e.target.value)}
            placeholder="e.g., 10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upper_reference">Upper Reference</Label>
          <Input
            id="upper_reference"
            type="number"
            step="any"
            value={formData.upper_reference}
            onChange={(e) => handleInputChange("upper_reference", e.target.value)}
            placeholder="e.g., 40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="optimal_low">Optimal Low</Label>
          <Input
            id="optimal_low"
            type="number"
            step="any"
            value={formData.optimal_low}
            onChange={(e) => handleInputChange("optimal_low", e.target.value)}
            placeholder="e.g., 15"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="optimal_high">Optimal High</Label>
          <Input
            id="optimal_high"
            type="number"
            step="any"
            value={formData.optimal_high}
            onChange={(e) => handleInputChange("optimal_high", e.target.value)}
            placeholder="e.g., 25"
          />
        </div>
      </div>

    </form>
  );
});

AddBloodMarkerForm.displayName = "AddBloodMarkerForm";

export default AddBloodMarkerForm;