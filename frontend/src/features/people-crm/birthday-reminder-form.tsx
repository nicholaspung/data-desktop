// frontend/src/features/people-crm/birthday-reminder-form.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, X, Info } from "lucide-react";
import { format, addYears, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import {
  BirthdayReminder,
  BirthdayReminderInput,
  Person,
} from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BirthdayReminderFormProps {
  reminder?: BirthdayReminder;
  onSubmit: (data: BirthdayReminderInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultPersonId?: string;
}

export default function BirthdayReminderForm({
  reminder,
  onSubmit,
  onCancel,
  loading = false,
  defaultPersonId,
}: BirthdayReminderFormProps) {
  const people = useStore(dataStore, (state) => state.people);

  // Initialize form data
  const [formData, setFormData] = useState<Partial<BirthdayReminderInput>>({
    person_id: reminder?.person_id || defaultPersonId || "",
    reminder_date: reminder?.reminder_date || new Date(),
    advance_days: reminder?.advance_days || 7,
    reminder_note: reminder?.reminder_note || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Update selected person when person_id changes
  useEffect(() => {
    if (formData.person_id) {
      const person = people.find((p) => p.id === formData.person_id);
      setSelectedPerson(person || null);

      // If person has birthday and this is a new reminder, calculate reminder date
      if (person?.birthday && !reminder) {
        const birthday = new Date(person.birthday);
        const now = new Date();

        // Get this year's birthday
        let nextBirthday = new Date(
          now.getFullYear(),
          birthday.getMonth(),
          birthday.getDate()
        );

        // If birthday has passed this year, use next year's date
        if (nextBirthday < now) {
          nextBirthday = addYears(nextBirthday, 1);
        }

        // Calculate reminder date based on advance days
        const reminderDate = subDays(nextBirthday, formData.advance_days || 7);
        setFormData((prev) => ({ ...prev, reminder_date: reminderDate }));
      }
    }
  }, [formData.person_id, formData.advance_days, people, reminder]);

  const handleChange = (field: keyof BirthdayReminderInput, value: any) => {
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

    // If advance_days changes and we have a person selected, recalculate reminder date
    if (field === "advance_days" && selectedPerson?.birthday && !reminder) {
      const birthday = new Date(selectedPerson.birthday);
      const now = new Date();

      // Get this year's birthday
      let nextBirthday = new Date(
        now.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      // If birthday has passed this year, use next year's date
      if (nextBirthday < now) {
        nextBirthday = addYears(nextBirthday, 1);
      }

      // Calculate reminder date based on advance days
      const reminderDate = subDays(nextBirthday, parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, reminder_date: reminderDate }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.person_id) {
      newErrors.person_id = "Please select a person";
    }

    if (!formData.reminder_date) {
      newErrors.reminder_date = "Reminder date is required";
    }

    if (!formData.advance_days || formData.advance_days < 0) {
      newErrors.advance_days = "Please enter a valid number of days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData as BirthdayReminderInput);
    } catch (error) {
      console.error("Error submitting birthday reminder form:", error);
    }
  };

  // Convert people to select options
  const peopleOptions = people
    .filter((person) => person.birthday) // Only show people with birthdays set
    .map((person) => ({
      label: `${person.name} (Birthday: ${format(person.birthday!, "MMMM d")})`,
      value: person.id,
      ...person,
    }));

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Birthday Reminder Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedPerson?.birthday && formData.person_id && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This person doesn't have a birthday set. Please add a birthday
                to their profile first.
              </AlertDescription>
            </Alert>
          )}

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
                placeholder="Select a person with a birthday"
                // emptyMessage="No people with birthdays found"
              />
              {errors.person_id && (
                <p className="text-sm text-destructive">{errors.person_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance_days">
                Days Before Birthday <span className="text-destructive">*</span>
              </Label>
              <Input
                id="advance_days"
                type="number"
                min="0"
                max="365"
                value={formData.advance_days || ""}
                onChange={(e) =>
                  handleChange("advance_days", parseInt(e.target.value) || 0)
                }
                placeholder="Number of days"
                className={errors.advance_days ? "border-destructive" : ""}
              />
              {errors.advance_days && (
                <p className="text-sm text-destructive">
                  {errors.advance_days}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_date">
              Reminder Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.reminder_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.reminder_date
                    ? format(formData.reminder_date, "PPP")
                    : "Select reminder date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.reminder_date}
                  onSelect={(date) => handleChange("reminder_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.reminder_date && (
              <p className="text-sm text-destructive">{errors.reminder_date}</p>
            )}
            {selectedPerson?.birthday && (
              <p className="text-sm text-muted-foreground">
                Next birthday:{" "}
                {format(
                  addYears(
                    new Date(selectedPerson.birthday),
                    new Date().getFullYear() -
                      new Date(selectedPerson.birthday).getFullYear()
                  ),
                  "MMMM d, yyyy"
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_note">Reminder Note</Label>
            <Textarea
              id="reminder_note"
              value={formData.reminder_note}
              onChange={(e) => handleChange("reminder_note", e.target.value)}
              placeholder="Add a custom note for this reminder..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {selectedPerson?.birthday && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                You'll be reminded {formData.advance_days} days before{" "}
                {selectedPerson.name}'s birthday on{" "}
                {format(formData.reminder_date || new Date(), "MMMM d, yyyy")}.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
            : reminder
              ? "Update Reminder"
              : "Add Reminder"}
        </Button>
      </div>
    </form>
  );
}
