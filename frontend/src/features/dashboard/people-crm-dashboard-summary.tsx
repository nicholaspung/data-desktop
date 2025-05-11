// frontend/src/features/dashboard/people-crm-dashboard-summary.tsx
import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import useLoadData from "@/hooks/useLoadData";
import {
  PEOPLE_FIELD_DEFINITIONS,
  MEETINGS_FIELD_DEFINITIONS,
} from "@/features/field-definitions/people-crm-definitions";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Users, Calendar, Gift } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";

export default function PeopleCRMDashboardSummary() {
  const people = useStore(dataStore, (state) => state.people);
  const meetings = useStore(dataStore, (state) => state.meetings);
  const isPeopleLoading = useStore(loadingStore, (state) => state.people);
  const isMeetingsLoading = useStore(loadingStore, (state) => state.meetings);

  // Load data for summary
  const { loadData: loadPeople } = useLoadData({
    fields: PEOPLE_FIELD_DEFINITIONS.fields,
    datasetId: "people",
    title: "People",
  });

  const { loadData: loadMeetings } = useLoadData({
    fields: MEETINGS_FIELD_DEFINITIONS.fields,
    datasetId: "meetings",
    title: "Meetings",
  });

  useEffect(() => {
    loadPeople();
    loadMeetings();
  }, []);

  // Calculate upcoming birthdays (next 30 days)
  const upcomingBirthdays = people.filter((person) => {
    if (!person.birthday) return false;
    const now = new Date();
    const birthday = new Date(person.birthday);
    const nextBirthday = new Date(
      now.getFullYear(),
      birthday.getMonth(),
      birthday.getDate()
    );

    // If birthday has passed this year, check next year
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1);
    }

    const daysUntil =
      (nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 30;
  });

  // Recent meetings (last 7 days)
  const recentMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.meeting_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return meetingDate >= weekAgo;
  });

  // Follow-ups needed
  const followUpsNeeded = meetings.filter(
    (meeting) =>
      meeting.follow_up_needed &&
      meeting.follow_up_date &&
      new Date(meeting.follow_up_date) >= new Date()
  );

  // Get latest people added
  const recentPeople = people
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  const isLoading = isPeopleLoading || isMeetingsLoading;

  return (
    <ReusableSummary
      title="People CRM"
      titleIcon={<Users className="h-5 w-5" />}
      linkText="Manage Contacts"
      linkTo="/people-crm"
      loading={isLoading}
      mainSection={{
        title: "Network Overview",
        value: people.length,
        subText: `${people.length} contacts in your network`,
        badge:
          upcomingBirthdays.length > 0
            ? {
                variant: "default",
                children: `${upcomingBirthdays.length} upcoming birthday${upcomingBirthdays.length > 1 ? "s" : ""}`,
              }
            : undefined,
      }}
      sections={[
        {
          title: "Activity Summary",
          items: [
            {
              label: "Recent Meetings",
              value: recentMeetings.length,
              subText: "in the last 7 days",
            },
            {
              label: "Follow-ups Needed",
              value: followUpsNeeded.length,
              subText: "pending follow-ups",
            },
          ],
          columns: 2,
        },
      ]}
      gridSection={{
        columns: 2,
        items: [
          {
            content: (
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Next Meeting</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {meetings.length > 0
                    ? format(
                        new Date(
                          meetings.sort(
                            (a, b) =>
                              new Date(a.meeting_date).getTime() -
                              new Date(b.meeting_date).getTime()
                          )[0].meeting_date
                        ),
                        "MMM d"
                      )
                    : "None scheduled"}
                </p>
              </div>
            ),
            action: (
              <Link to="/people-crm/meetings">
                <span className="text-xs text-primary hover:underline">
                  View All
                </span>
              </Link>
            ),
          },
          {
            content: (
              <div className="text-center">
                <Gift className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Next Birthday</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingBirthdays.length > 0
                    ? format(new Date(upcomingBirthdays[0].birthday!), "MMM d")
                    : "None upcoming"}
                </p>
              </div>
            ),
            action: (
              <Link to="/people-crm/birthdays">
                <span className="text-xs text-primary hover:underline">
                  View All
                </span>
              </Link>
            ),
          },
        ],
      }}
      footer={
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Recent Contacts</h4>
          <div className="space-y-2">
            {recentPeople.map((person) => (
              <Link
                key={person.id}
                to={`/people-crm/people/$personId`}
                params={{ personId: person.id }}
                className="flex items-center justify-between text-sm hover:bg-accent/50 px-2 py-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{person.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(person.createdAt, "MMM d")}
                </span>
              </Link>
            ))}
            {recentPeople.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No contacts yet
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}
