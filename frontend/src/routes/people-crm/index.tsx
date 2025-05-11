// frontend/src/routes/people-crm/index.tsx
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { Users, Calendar, NotebookPen, Tag, Gift, Bell } from "lucide-react";
import PeopleList from "./people/index";
import MeetingsList from "./meetings/index";
import PersonNotesList from "./notes/index";
import PersonAttributesList from "./attributes/index";
import BirthdaysList from "./birthdays/index";
import BirthdayRemindersList from "./birthday-reminders/index";

interface PeopleCRMSearch {
  tab?: string;
}

export const Route = createFileRoute("/people-crm/")({
  validateSearch: (search): PeopleCRMSearch => ({
    tab: search.tab as string,
  }),
  component: PeopleCRM,
});

function PeopleCRM() {
  const search = useSearch({ from: "/people-crm/" });
  const [activeTab, setActiveTab] = useState(search.tab || "people");

  useEffect(() => {
    if (search.tab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  const tabs = [
    {
      id: "people",
      label: "People",
      icon: <Users className="h-4 w-4" />,
      content: <PeopleList />,
    },
    {
      id: "meetings",
      label: "Meetings",
      icon: <Calendar className="h-4 w-4" />,
      content: <MeetingsList />,
    },
    {
      id: "notes",
      label: "Notes",
      icon: <NotebookPen className="h-4 w-4" />,
      content: <PersonNotesList />,
    },
    {
      id: "attributes",
      label: "Attributes",
      icon: <Tag className="h-4 w-4" />,
      content: <PersonAttributesList />,
    },
    {
      id: "birthdays",
      label: "Birthdays",
      icon: <Gift className="h-4 w-4" />,
      content: <BirthdaysList />,
    },
    {
      id: "reminders",
      label: "Reminders",
      icon: <Bell className="h-4 w-4" />,
      content: <BirthdayRemindersList />,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          People CRM
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your contacts and relationships
        </p>
      </div>

      <ReusableTabs tabs={tabs} defaultTabId={activeTab} className="w-full" />
    </div>
  );
}
