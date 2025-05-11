// frontend/src/features/people-crm/meeting-form.tsx
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
  Meeting,
  MeetingInput,
  MeetingLocationType,
} from "@/store/people-crm-definitions.d";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";

interface MeetingFormProps {
  meeting?: Meeting;
  onSubmit: (data: MeetingInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultPersonId?: string;
}

const LOCATION_TYPE_OPTIONS = [
  { id: MeetingLocationType.RESTAURANT, label: "Restaurant" },
  { id: MeetingLocationType.HOME, label: "Home" },
  { id: MeetingLocationType.OFFICE, label: "Office" },
  { id: MeetingLocationType.VIRTUAL, label: "Virtual" },
  { id: MeetingLocationType.COFFEE_SHOP, label: "Coffee Shop" },
  { id: MeetingLocationType.OUTDOOR, label: "Outdoor" },
  { id: MeetingLocationType.OTHER, label: "Other" },
];

export default function MeetingForm({
  meeting,
  onSubmit,
  onCancel,
  loading = false,
  defaultPersonId,
}: MeetingFormProps) {
  const people = useStore(dataStore, (state) => state.people);

  // Initialize form data
  const [formData, setFormData] = useState<Partial<MeetingInput>>({
    person_id: meeting?.person_id || defaultPersonId || "",
    meeting_date: meeting?.meeting_date || new Date(),
    location: meeting?.location || "",
    location_type: meeting?.location_type || MeetingLocationType.OTHER,
    duration_minutes: meeting?.duration_minutes || undefined,
    participants: meeting?.participants || "",
    description: meeting?.description || "",
    tags: meeting?.tags || "",
    feelings: meeting?.feelings || "",
    follow_up_needed: meeting?.follow_up_needed || false,
    follow_up_date: meeting?.follow_up_date || undefined,
    private: meeting?.private || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof MeetingInput, value: any) => {
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

    if (!formData.meeting_date) {
      newErrors.meeting_date = "Meeting date is required";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData as MeetingInput);
    } catch (error) {
      console.error("Error submitting meeting form:", error);
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
          <CardTitle>Meeting Details</CardTitle>
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
              <Label htmlFor="meeting_date">
                Meeting Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.meeting_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.meeting_date
                      ? format(formData.meeting_date, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.meeting_date}
                    onSelect={(date) => handleChange("meeting_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.meeting_date && (
                <p className="text-sm text-destructive">
                  {errors.meeting_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Enter meeting location"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type</Label>
              <ReusableSelect
                title="location type"
                options={LOCATION_TYPE_OPTIONS}
                value={formData.location_type}
                onChange={(value) => handleChange("location_type", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) =>
                  handleChange(
                    "duration_minutes",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Enter duration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Other Participants</Label>
              <Input
                id="participants"
                value={formData.participants}
                onChange={(e) => handleChange("participants", e.target.value)}
                placeholder="Who else attended?"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MarkdownEditor
              value={formData.description || ""}
              onChange={(value) => handleChange("description", value)}
              placeholder="What was discussed?"
              minHeight="100px"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feelings">How did it feel?</Label>
            <Textarea
              id="feelings"
              value={formData.feelings}
              onChange={(e) => handleChange("feelings", e.target.value)}
              placeholder="Your impressions of the meeting"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="follow_up_needed"
              checked={formData.follow_up_needed}
              onCheckedChange={(checked) =>
                handleChange("follow_up_needed", checked)
              }
            />
            <Label htmlFor="follow_up_needed">Follow-up needed</Label>
          </div>

          {formData.follow_up_needed && (
            <div className="space-y-2">
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.follow_up_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.follow_up_date
                      ? format(formData.follow_up_date, "PPP")
                      : "Select follow-up date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.follow_up_date}
                    onSelect={(date) => handleChange("follow_up_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.private}
              onCheckedChange={(checked) => handleChange("private", checked)}
            />
            <Label htmlFor="private">Make this meeting private</Label>
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
          {loading ? "Saving..." : meeting ? "Update Meeting" : "Add Meeting"}
        </Button>
      </div>
    </form>
  );
}
