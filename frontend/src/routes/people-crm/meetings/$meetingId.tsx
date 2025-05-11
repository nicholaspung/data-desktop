// frontend/src/routes/people-crm/meetings/$meetingId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Meeting } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  Calendar,
  User,
  MapPin,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import ReactMarkdown from "react-markdown";

interface MeetingParams {
  meetingId: string;
}

export const Route = createFileRoute("/people-crm/meetings/$meetingId")({
  component: MeetingDetail,
});

function MeetingDetail() {
  const { meetingId } = Route.useParams() as MeetingParams;
  const navigate = useNavigate();
  const meetings = useStore(dataStore, (state) => state.meetings);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(meetingId);
      deleteEntry(meetingId, "meetings");
      toast.success("Meeting deleted successfully");
      navigate({ to: "/people-crm/meetings" });
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
          <Link to="/people-crm/meetings">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
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
          <Link
            to={`/people-crm/meetings/$meetingId/edit`}
            params={{ meetingId: meetingId }}
          >
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
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
                  {getLocationTypeIcon(meeting.location_type)}{" "}
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

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meeting.participants && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Other Participants
                  </h3>
                  <p className="text-muted-foreground">
                    {meeting.participants}
                  </p>
                </div>
              )}

              {meeting.feelings && (
                <div>
                  <h3 className="font-medium mb-2">How it felt</h3>
                  <p className="text-muted-foreground">{meeting.feelings}</p>
                </div>
              )}
            </div>

            {/* Follow-up */}
            {meeting.follow_up_needed && (
              <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <h3 className="font-medium">Follow-up needed</h3>
                </div>
                {meeting.follow_up_date && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Follow up on:{" "}
                    {format(meeting.follow_up_date, "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {meeting.tags && (
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {meeting.tags.split(",").map((tag) => (
                    <Badge
                      key={tag.trim()}
                      variant="outline"
                      className="text-xs"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Created:{" "}
                  {format(meeting.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <span>
                  Last modified:{" "}
                  {format(meeting.lastModified, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* Related Actions */}
      <ReusableCard
        title="Related Actions"
        content={
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/people-crm/people/$personId`}
              params={{ personId: meeting.person_id }}
            >
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Contact
              </Button>
            </Link>
            <Link
              to={`/people-crm/meetings/add`}
              params={{ personId: meeting.person_id }}
            >
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Another Meeting
              </Button>
            </Link>
            <Link
              to={`/people-crm/notes/add`}
              params={{ personId: meeting.person_id }}
            >
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
