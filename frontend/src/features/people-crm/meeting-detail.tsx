import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import ReusableCard from "@/components/reusable/reusable-card";
import { Button } from "@/components/ui/button";
import { ApiService } from "@/services/api";
import dataStore, { deleteEntry } from "@/store/data-store";
import { Meeting } from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import { format } from "date-fns";
import { Calendar, ChevronLeft, Clock, Edit, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

// frontend/src/routes/people-crm/meeting-detail.tsx
export function MeetingDetail({
  meetingId,
  onBack,
  onEdit,
}: {
  meetingId: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const meetings = useStore(dataStore, (state) => state.meetings);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundMeeting = meetings.find((m) => m.id === meetingId);
    if (foundMeeting) {
      setMeeting(foundMeeting);
    }
  }, [meetingId, meetings]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(meetingId);
      deleteEntry(meetingId, "meetings");
      toast.success("Meeting deleted successfully");
      onBack();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    } finally {
      setDeleting(false);
    }
  };

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading meeting details...</p>
      </div>
    );
  }

  const getLocationTypeIcon = (locationType: string) => {
    switch (locationType) {
      case "virtual":
        return "💻";
      case "office":
        return "🏢";
      case "restaurant":
        return "🍽️";
      case "coffee_shop":
        return "☕";
      case "home":
        return "🏠";
      case "outdoor":
        return "🌳";
      default:
        return "📍";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Meeting Detail
            </h1>
            <p className="text-muted-foreground mt-1">
              Meeting with {meeting.person_id_data?.name || "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <ConfirmDeleteDialog
            title="Delete Meeting"
            description="Are you sure you want to delete this meeting? This action cannot be undone."
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </div>

      {/* Meeting Details */}
      <ReusableCard
        content={
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {meeting.person_id_data?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(meeting.meeting_date, "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {meeting.location_type &&
                    getLocationTypeIcon(meeting.location_type)}{" "}
                  {meeting.location}
                </span>
              </div>
              {meeting.duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {meeting.duration_minutes} minutes
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {meeting.description && (
              <div>
                <h3 className="font-medium mb-3">Discussion</h3>
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4">
                  <ReactMarkdown>{meeting.description}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
