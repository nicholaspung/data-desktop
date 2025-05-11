// frontend/src/features/people-crm/attribute-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import {
  PersonAttribute,
  PersonAttributeInput,
} from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

interface PersonAttributeFormProps {
  attribute?: PersonAttribute;
  onSubmit: (data: PersonAttributeInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultPersonId?: string;
}

const CATEGORY_OPTIONS = [
  { id: "preferences", label: "Preferences" },
  { id: "hobbies", label: "Hobbies" },
  { id: "facts", label: "Facts" },
  { id: "skills", label: "Skills" },
  { id: "allergies", label: "Allergies" },
  { id: "dietary", label: "Dietary" },
  { id: "other", label: "Other" },
];

export default function PersonAttributeForm({
  attribute,
  onSubmit,
  onCancel,
  loading = false,
  defaultPersonId,
}: PersonAttributeFormProps) {
  const people = useStore(dataStore, (state) => state.people);

  // Initialize form data
  const [formData, setFormData] = useState<Partial<PersonAttributeInput>>({
    person_id: attribute?.person_id || defaultPersonId || "",
    attribute_name: attribute?.attribute_name || "",
    attribute_value: attribute?.attribute_value || "",
    category: attribute?.category || "other",
    learned_date: attribute?.learned_date || undefined,
    notes: attribute?.notes || "",
    source: attribute?.source || "",
    private: attribute?.private || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PersonAttributeInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.person_id) {
      newErrors.person_id = "Please select a person";
    }

    if (!formData.attribute_name?.trim()) {
      newErrors.attribute_name = "Attribute name is required";
    }

    if (!formData.attribute_value?.trim()) {
      newErrors.attribute_value = "Attribute value is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData as PersonAttributeInput);
    } catch (error) {
      console.error("Error submitting attribute form:", error);
    }
  };

  // Convert people to select options
  const peopleOptions = people.map((person) => ({
    label: person.name,
    value: person.id,
    ...person,
  }));

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attribute Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="person_id">
                Person <span className="text-destructive">*</span>
              </Label>
              <ReusableSelect
                title="person"
                options={peopleOptions}
                value={formData.person_id}
                onChange={(value) => handleChange("person_id", value)}
                // className={errors.person_id ? "border-destructive" : ""}
              />
              {errors.person_id && (
                <p className="text-sm text-destructive">{errors.person_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <ReusableSelect
                title="category"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(value) => handleChange("category", value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribute_name">
              Attribute Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="attribute_name"
              value={formData.attribute_name}
              onChange={(e) => handleChange("attribute_name", e.target.value)}
              placeholder="e.g., Favorite Color, Allergies, Skills"
              className={errors.attribute_name ? "border-destructive" : ""}
            />
            {errors.attribute_name && (
              <p className="text-sm text-destructive">
                {errors.attribute_name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribute_value">
              Attribute Value <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="attribute_value"
              value={formData.attribute_value}
              onChange={(e) => handleChange("attribute_value", e.target.value)}
              placeholder="Enter the attribute value or description"
              rows={3}
              className={errors.attribute_value ? "border-destructive" : ""}
            />
            {errors.attribute_value && (
              <p className="text-sm text-destructive">
                {errors.attribute_value}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="learned_date">Date Learned</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.learned_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.learned_date
                      ? format(formData.learned_date, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.learned_date}
                    onSelect={(date) => handleChange("learned_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
                placeholder="How did you learn this?"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional context or notes"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.private}
              onCheckedChange={(checked) => handleChange("private", checked)}
            />
            <Label htmlFor="private">Make this attribute private</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading
            ? "Saving..."
            : attribute
              ? "Update Attribute"
              : "Add Attribute"}
        </Button>
      </div>
    </form>
  );
}
