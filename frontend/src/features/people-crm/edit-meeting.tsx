import { Button } from "@/components/ui/button";
import { ApiService } from "@/services/api";
import dataStore, { updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { ChevronLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MeetingForm from "./meeting-form";
import { Meeting } from "@/store/people-crm-definitions";

// frontend/src/routes/people-crm/edit-meeting.tsx
export function EditMeeting({
  meetingId,
  onBack,
}: {
  meetingId: string;
  onBack: () => void;
}) {
  const meetings = useStore(dataStore, (state) => state.meetings);

  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    const foundMeeting = meetings.find((m) => m.id === meetingId);
    if (foundMeeting) {
      setMeeting(foundMeeting);
    }
  }, [meetingId, meetings]);

  interface HandleSubmitData {
    [key: string]: any; // Replace with specific fields if known
  }

  const handleSubmit = async (data: HandleSubmitData): Promise<void> => {
    try {
      const updatedMeeting: Meeting | null = await ApiService.updateRecord(
        meetingId,
        data
      );
      if (updatedMeeting) {
        updateEntry(meetingId, updatedMeeting, "meetings");
        toast.success("Meeting updated successfully");
        onBack();
      }
    } catch (error: unknown) {
      console.error("Error updating meeting:", error);
      toast.error("Failed to update meeting");
    }
  };

  const handleCancel = () => {
    onBack();
  };

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading meeting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Meeting
          </h1>
          <p className="text-muted-foreground mt-1">
            Update meeting with {meeting.person_id_data?.name || "this person"}
          </p>
        </div>
      </div>

      {/* Form */}
      <MeetingForm
        meeting={meeting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
