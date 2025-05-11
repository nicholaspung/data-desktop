// frontend/src/features/people-crm/note-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { PersonNote, PersonNoteInput } from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import TagInput from "@/components/reusable/tag-input";

interface PersonNoteFormProps {
  note?: PersonNote;
  onSubmit: (data: PersonNoteInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultPersonId?: string;
}

const CATEGORY_OPTIONS = [
  { id: "general", label: "General" },
  { id: "important", label: "Important" },
  { id: "reminder", label: "Reminder" },
  { id: "idea", label: "Idea" },
  { id: "concern", label: "Concern" },
];

export default function PersonNoteForm({
  note,
  onSubmit,
  onCancel,
  loading = false,
  defaultPersonId,
}: PersonNoteFormProps) {
  const people = useStore(dataStore, (state) => state.people);
  const notes = useStore(dataStore, (state) => state.person_notes);

  // Initialize form data
  const [formData, setFormData] = useState<Partial<PersonNoteInput>>({
    person_id: note?.person_id || defaultPersonId || "",
    note_date: note?.note_date || new Date(),
    content: note?.content || "",
    category: note?.category || "general",
    tags: note?.tags || "",
    private: note?.private || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PersonNoteInput, value: any) => {
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

    if (!formData.note_date) {
      newErrors.note_date = "Note date is required";
    }

    if (!formData.content?.trim()) {
      newErrors.content = "Note content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData as PersonNoteInput);
    } catch (error) {
      console.error("Error submitting note form:", error);
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
          <CardTitle>Note Details</CardTitle>
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
              <Label htmlFor="note_date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.note_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.note_date
                      ? format(formData.note_date, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.note_date}
                    onSelect={(date) => handleChange("note_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.note_date && (
                <p className="text-sm text-destructive">{errors.note_date}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Note Content <span className="text-destructive">*</span>
            </Label>
            <MarkdownEditor
              value={formData.content || ""}
              onChange={(value) => handleChange("content", value)}
              placeholder="Write your note here..."
              minHeight="150px"
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <ReusableSelect
                title="category"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={(value) => handleChange("category", value)}
              />
            </div>

            <div className="space-y-2">
              <TagInput
                label="Tags"
                value={formData.tags || ""}
                onChange={(value) => handleChange("tags", value)}
                generalData={notes}
                generalDataTagField="tags"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.private}
              onCheckedChange={(checked) => handleChange("private", checked)}
            />
            <Label htmlFor="private">Make this note private</Label>
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
          {loading ? "Saving..." : note ? "Update Note" : "Add Note"}
        </Button>
      </div>
    </form>
  );
}
