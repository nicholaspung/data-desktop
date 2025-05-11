// frontend/src/routes/people-crm/meetings/$meetingId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Meeting, MeetingInput } from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import MeetingForm from "@/features/people-crm/meeting-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface MeetingParams {
  meetingId: string;
}

export const Route = createFileRoute("/people-crm/meetings/$meetingId/edit")({
  component: EditMeeting,
});

function EditMeeting() {
  const { meetingId } = Route.useParams() as MeetingParams;
  const navigate = useNavigate();
  const meetings = useStore(dataStore, (state) => state.meetings);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundMeeting = meetings.find((m) => m.id === meetingId);
    if (foundMeeting) {
      setMeeting(foundMeeting);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(meetingId).then((data) => {
        if (data) {
          setMeeting(data as Meeting);
        }
      });
    }
  }, [meetingId, meetings]);

  const handleSubmit = async (data: MeetingInput) => {
    setLoading(true);
    try {
      const updatedMeeting = await ApiService.updateRecord(meetingId, data);
      if (updatedMeeting) {
        updateEntry(meetingId, updatedMeeting, "meetings");
        toast.success("Meeting updated successfully");
        navigate({ to: `/people-crm/meetings/${meetingId}` });
      }
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast.error("Failed to update meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/meetings/${meetingId}` });
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
        <Link
          to={`/people-crm/meetings/$meetingId`}
          params={{ meetingId: meetingId }}
        >
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
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
        loading={loading}
      />
    </div>
  );
}
