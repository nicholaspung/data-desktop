// frontend/src/features/people-crm/person-form.tsx
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
import TagInput from "@/components/reusable/tag-input";
import { Person, PersonInput } from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

interface PersonFormProps {
  person?: Person;
  onSubmit: (data: PersonInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function PersonForm({
  person,
  onSubmit,
  onCancel,
  loading = false,
}: PersonFormProps) {
  const people = useStore(dataStore, (state) => state.people);

  // Initialize form data
  const [formData, setFormData] = useState<Partial<PersonInput>>({
    name: person?.name || "",
    email: person?.email || "",
    phone: person?.phone || "",
    birthday: person?.birthday || undefined,
    address: person?.address || "",
    occupation: person?.occupation || "",
    company: person?.company || "",
    bio: person?.bio || "",
    photo_url: person?.photo_url || "",
    tags: person?.tags || "",
    first_met_date: person?.first_met_date || undefined,
    social_links: person?.social_links || "",
    private: person?.private || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PersonInput, value: any) => {
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

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData as PersonInput);
    } catch (error) {
      console.error("Error submitting person form:", error);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.birthday && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthday
                      ? format(formData.birthday, "PPP")
                      : "Select birthday"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.birthday}
                    onSelect={(date) => handleChange("birthday", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter address"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                placeholder="Enter job title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Brief biography or notes"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input
              id="photo_url"
              value={formData.photo_url}
              onChange={(e) => handleChange("photo_url", e.target.value)}
              placeholder="Enter photo URL"
            />
          </div>

          <TagInput
            label="Tags"
            value={formData.tags || ""}
            onChange={(value) => handleChange("tags", value)}
            generalData={people}
            generalDataTagField="tags"
          />

          <div className="space-y-2">
            <Label htmlFor="first_met_date">First Met Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.first_met_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.first_met_date
                    ? format(formData.first_met_date, "PPP")
                    : "Select date when you first met"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.first_met_date}
                  onSelect={(date) => handleChange("first_met_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_links">Social Links</Label>
            <Textarea
              id="social_links"
              value={formData.social_links}
              onChange={(e) => handleChange("social_links", e.target.value)}
              placeholder="JSON format: {'twitter': 'username', 'linkedin': 'url'}"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.private}
              onCheckedChange={(checked) => handleChange("private", checked)}
            />
            <Label htmlFor="private">Make this contact private</Label>
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
          {loading ? "Saving..." : person ? "Update Person" : "Add Person"}
        </Button>
      </div>
    </form>
  );
}
