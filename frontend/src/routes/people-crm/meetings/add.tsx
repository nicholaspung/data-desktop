// frontend/src/routes/people-crm/meetings/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import MeetingForm from "@/features/people-crm/meeting-form";
import { MeetingInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AddMeetingSearch {
  personId?: string;
}

export const Route = createFileRoute("/people-crm/meetings/add")({
  validateSearch: (search): AddMeetingSearch => ({
    personId: search.personId as string | undefined,
  }),
  component: AddMeeting,
});

function AddMeeting() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: MeetingInput) => {
    setLoading(true);
    try {
      const newMeeting = await ApiService.addRecord("meetings", data);
      if (newMeeting) {
        addEntry(newMeeting, "meetings");
        toast.success("Meeting added successfully");
        navigate({ to: `/people-crm/meetings/${newMeeting.id}` });
      }
    } catch (error) {
      console.error("Error adding meeting:", error);
      toast.error("Failed to add meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/meetings" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/meetings">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Add Meeting
          </h1>
          <p className="text-muted-foreground mt-1">
            Record a new meeting with someone in your network
          </p>
        </div>
      </div>

      {/* Form */}
      <MeetingForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        defaultPersonId={search.personId}
      />
    </div>
  );
}
