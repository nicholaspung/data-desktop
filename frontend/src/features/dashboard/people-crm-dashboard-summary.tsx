import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import {
  Users,
  Calendar,
  NotebookPen,
  Tag,
  Gift,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, addYears } from "date-fns";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function PeopleCRMDashboardSummary() {
  const people = useStore(dataStore, (state) => state.people);
  const meetings = useStore(dataStore, (state) => state.meetings);
  const personNotes = useStore(dataStore, (state) => state.person_notes);
  const personAttributes = useStore(
    dataStore,
    (state) => state.person_attributes
  );
  const birthdayReminders = useStore(
    dataStore,
    (state) => state.birthday_reminders
  );

  const isLoading = useStore(
    loadingStore,
    (state) =>
      state.people ||
      state.meetings ||
      state.person_notes ||
      state.person_attributes
  );

  const peopleWithBirthdays = people.filter((person) => person.birthday);
  const today = new Date();

  const upcomingBirthdays = peopleWithBirthdays
    .map((person) => {
      const birthday = new Date(person.birthday!);
      let nextBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      if (nextBirthday < today) {
        nextBirthday = addYears(nextBirthday, 1);
      }

      const daysUntil = differenceInDays(nextBirthday, today);
      const age = nextBirthday.getFullYear() - birthday.getFullYear();

      return {
        ...person,
        daysUntil,
        age,
        nextBirthday,
      };
    })
    .filter((person) => person.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const recentMeetings = meetings
    .slice()
    .sort(
      (a, b) =>
        new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
    )
    .slice(0, 5);

  const stats = {
    people: people.length,
    meetings: meetings.length,
    notes: personNotes.length,
    attributes: personAttributes.length,
    upcomingBirthdays: upcomingBirthdays.length,
    hasReminders: birthdayReminders.length,
  };

  const getBirthdayBadge = (daysUntil: number) => {
    if (daysUntil === 0) return "bg-green-500 text-white";
    if (daysUntil === 1) return "bg-orange-500 text-white";
    if (daysUntil <= 7) return "bg-blue-500 text-white";
    return "bg-purple-500 text-white";
  };

  return (
    <ReusableSummary
      title="People CRM"
      titleIcon={
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <Badge
            variant="outline"
            className="text-xs border-orange-200 text-orange-600 bg-orange-50"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alpha
          </Badge>
        </div>
      }
      linkTo="/people-crm"
      loading={isLoading}
      emptyState={
        people.length === 0
          ? {
              message: "No people in your network yet",
              actionText: "Add Person",
              actionTo: "/people-crm",
            }
          : undefined
      }
      mainSection={{
        title: "Network",
        value: `${stats.people} people`,
        subText: `Across ${stats.meetings} meetings and ${stats.notes} notes`,
      }}
      sections={[
        {
          title: "Quick Stats",
          items: [
            {
              label: "Total People",
              value: stats.people,
            },
            {
              label: "This Month",
              value: `${
                meetings.filter(
                  (m) =>
                    new Date(m.meeting_date).getMonth() === today.getMonth() &&
                    new Date(m.meeting_date).getFullYear() ===
                      today.getFullYear()
                ).length
              } meetings`,
            },
            {
              label: "Active Attributes",
              value: stats.attributes,
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gift className="h-4 w-4 text-primary" />
                  Upcoming Birthdays
                </div>
                {upcomingBirthdays.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingBirthdays.slice(0, 3).map((person) => (
                      <Link
                        key={person.id}
                        to="/people-crm"
                        search={{
                          tab: "birthdays",
                          detail: { type: "birthday", id: person.id },
                        }}
                        className="block"
                      >
                        <div className="flex items-center justify-between text-sm hover:bg-accent/50 rounded px-2 py-1">
                          <div>
                            <div className="font-medium">{person.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(person.birthday!, "MMM d")} • {person.age}{" "}
                              years old
                            </div>
                          </div>
                          <Badge className={getBirthdayBadge(person.daysUntil)}>
                            {person.daysUntil === 0
                              ? "Today"
                              : person.daysUntil === 1
                                ? "Tomorrow"
                                : `${person.daysUntil}d`}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                    {upcomingBirthdays.length > 3 && (
                      <Link
                        to="/people-crm"
                        search={{ tab: "birthdays" }}
                        className="text-xs text-primary hover:underline"
                      >
                        View all {upcomingBirthdays.length} upcoming birthdays
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No birthdays in the next 30 days
                  </p>
                )}
              </div>
            ),
          },
          {
            content: (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  Recent Meetings
                </div>
                {recentMeetings.length > 0 ? (
                  <div className="space-y-1">
                    {recentMeetings.slice(0, 3).map((meeting) => (
                      <Link
                        key={meeting.id}
                        to="/people-crm"
                        search={{
                          tab: "meetings",
                          detail: { type: "meeting", id: meeting.id },
                        }}
                        className="block"
                      >
                        <div className="flex items-center justify-between text-sm hover:bg-accent/50 rounded px-2 py-1">
                          <div>
                            <div className="font-medium">
                              {meeting.person_id_data?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(meeting.meeting_date, "MMM d")} •{" "}
                              {meeting.location}
                            </div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                    {recentMeetings.length > 3 && (
                      <Link
                        to="/people-crm"
                        search={{ tab: "meetings" }}
                        className="text-xs text-primary hover:underline"
                      >
                        View all meetings
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No meetings recorded yet
                  </p>
                )}
              </div>
            ),
          },
        ],
      }}
      footer={
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Link to="/people-crm" search={{ tab: "people" }}>
            <Button variant="outline" size="sm">
              <Users className="h-3 w-3 mr-1" />
              People
            </Button>
          </Link>
          <Link to="/people-crm" search={{ tab: "meetings" }}>
            <Button variant="outline" size="sm">
              <Calendar className="h-3 w-3 mr-1" />
              Meetings
            </Button>
          </Link>
          <Link to="/people-crm" search={{ tab: "notes" }}>
            <Button variant="outline" size="sm">
              <NotebookPen className="h-3 w-3 mr-1" />
              Notes
            </Button>
          </Link>
          <Link to="/people-crm" search={{ tab: "attributes" }}>
            <Button variant="outline" size="sm">
              <Tag className="h-3 w-3 mr-1" />
              Attributes
            </Button>
          </Link>
          <Link to="/people-crm" search={{ tab: "birthdays" }}>
            <Button variant="outline" size="sm">
              <Gift className="h-3 w-3 mr-1" />
              Birthdays
            </Button>
          </Link>
        </div>
      }
    />
  );
}

registerDashboardSummary({
  route: "/people-crm",
  component: PeopleCRMDashboardSummary,
  defaultConfig: {
    id: "/people-crm",
    size: "medium",
    order: 6,
    visible: true,
  },
  datasets: [
    "people",
    "meetings",
    "person_attributes",
    "person_notes",
    "person_chats",
    "birthday_reminders",
    "person_relationships",
  ],
  name: "People CRM",
  description: "Manage your contacts and relationships",
  icon: Users,
});
