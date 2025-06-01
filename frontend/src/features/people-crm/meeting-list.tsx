import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { MEETINGS_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Input } from "@/components/ui/input";
import { Search, Calendar } from "lucide-react";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { Meeting } from "@/store/people-crm-definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import AddMeetingButton from "@/features/people-crm/add-meeting-button";

interface MeetingsListProps {
  onShowDetail?: (type: string, id: string) => void;
}

export default function MeetingsList({ onShowDetail }: MeetingsListProps) {
  const meetings = useStore(dataStore, (state) => state.meetings);
  const isLoading = useStore(loadingStore, (state) => state.meetings);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMeetings = meetings.filter((meeting) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      meeting.person_id_data?.name.toLowerCase().includes(searchLower) ||
      meeting.location.toLowerCase().includes(searchLower) ||
      meeting.description?.toLowerCase().includes(searchLower)
    );
  });

  const sortedMeetings = filteredMeetings.sort(
    (a, b) =>
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
  );

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

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <div onClick={() => onShowDetail?.("meeting", meeting.id)}>
      <ReusableCard
        cardClassName="hover:border-primary/50 transition-colors cursor-pointer"
        content={
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Meeting with {meeting.person_id_data?.name || "Unknown"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(meeting.meeting_date, "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        {meeting.location_type &&
                          getLocationTypeIcon(meeting.location_type)}
                        {meeting.location}
                      </div>
                    </div>
                  </div>
                </div>

                {meeting.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {meeting.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {meeting.duration_minutes && (
                    <Badge variant="secondary" className="text-xs">
                      {meeting.duration_minutes} minutes
                    </Badge>
                  )}
                  {meeting.follow_up_needed && (
                    <Badge variant="outline" className="text-xs">
                      Follow-up needed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Meetings
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all your meetings and interactions
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={MEETINGS_FIELD_DEFINITIONS.fields}
            datasetId="meetings"
            title="Meetings"
          />
          <AddMeetingButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading meetings...</p>
        </div>
      ) : sortedMeetings.length > 0 ? (
        <div className="space-y-4">
          {sortedMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No meetings found matching your search"
                  : "No meetings recorded yet"}
              </p>
              <AddMeetingButton />
            </div>
          }
        />
      )}
    </div>
  );
}
