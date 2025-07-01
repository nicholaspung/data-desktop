import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import ReusableSelect from "@/components/reusable/reusable-select";
import { parseISO, isValid } from "date-fns";

const QuickAddMeeting: React.FC = () => {
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    return {
      title: "",
      date: now.toISOString(),
      duration_minutes: "60",
      location: "",
      notes: "",
      participants: [] as string[],
      meeting_type: "in-person",
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const people = useStore(dataStore, (state) => state.people) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (formData.participants.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    setIsLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
      };

      const result = await ApiService.addRecord("meetings", dataToSave);
      
      if (result?.id) {
        addEntry(result, "meetings");
        toast.success("Meeting added successfully!");
        const now = new Date();
        setFormData({
          title: "",
          date: now.toISOString(),
          duration_minutes: "60",
          location: "",
          notes: "",
          participants: [],
          meeting_type: "in-person",
        });
        // Don't navigate to detail page after adding
      }
    } catch (error) {
      toast.error("Failed to add meeting");
      console.error("Error adding meeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const peopleOptions = people.map(person => ({
    id: person.id,
    value: person.id,
    label: person.name,
  }));

  const meetingTypeOptions = [
    { id: "in-person", value: "in-person", label: "In Person" },
    { id: "video-call", value: "video-call", label: "Video Call" },
    { id: "phone-call", value: "phone-call", label: "Phone Call" },
    { id: "other", value: "other", label: "Other" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Team meeting, Coffee chat, etc."
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Participants *</Label>
        <ReusableMultiSelect
          options={peopleOptions}
          selected={formData.participants || []}
          onChange={(value) => setFormData(prev => ({ ...prev, participants: value }))}
          placeholder="Select participants"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <ReusableDatePicker
            value={(() => {
              try {
                if (!formData.date) return new Date();
                const parsedDate = parseISO(formData.date);
                return isValid(parsedDate) ? parsedDate : new Date();
              } catch (error) {
                console.warn("Date parsing error:", error);
                return new Date();
              }
            })()}
            onChange={(date) => {
              try {
                const dateString = date ? date.toISOString() : new Date().toISOString();
                setFormData(prev => ({ ...prev, date: dateString }));
              } catch (error) {
                console.warn("Date onChange error:", error);
                setFormData(prev => ({ ...prev, date: new Date().toISOString() }));
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="60"
            value={formData.duration_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Meeting Type</Label>
          <ReusableSelect
            options={meetingTypeOptions}
            value={formData.meeting_type}
            onChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
            placeholder="Select type"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Office, Zoom, etc."
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Meeting agenda, discussion points..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        <CalendarPlus className="h-4 w-4 mr-2" />
        {isLoading ? "Adding..." : "Add Meeting"}
      </Button>
    </form>
  );
};

export default QuickAddMeeting;