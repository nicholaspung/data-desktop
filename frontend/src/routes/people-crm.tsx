import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import {
  Users,
  Calendar,
  NotebookPen,
  Tag,
  Gift,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditPerson from "@/features/people-crm/edit-person";
import { EditMeeting } from "@/features/people-crm/edit-meeting";
import { EditNote } from "@/features/people-crm/edit-note";
import { EditAttribute } from "@/features/people-crm/edit-attribute";
import PersonDetail from "@/features/people-crm/people-detail";
import { MeetingDetail } from "@/features/people-crm/meeting-detail";
import NoteDetail from "@/features/people-crm/note-detail";
import AttributeDetail from "@/features/people-crm/attribute-detail";
import BirthdayDetail from "@/features/people-crm/birthday-detail";
import PeopleList from "@/features/people-crm/people-list";
import MeetingsList from "@/features/people-crm/meeting-list";
import PersonNotesList from "@/features/people-crm/notes-list";
import PersonAttributesList from "@/features/people-crm/attributes-list";
import BirthdaysList from "@/features/people-crm/birthdays-list";

interface PeopleCRMSearch {
  tab?: string;
  detail?: {
    type: "person" | "meeting" | "note" | "attribute" | "birthday";
    id: string;
    action?: "edit";
  };
}

export const Route = createFileRoute("/people-crm")({
  validateSearch: (search): PeopleCRMSearch => ({
    tab: search.tab as string,
    detail: search.detail as PeopleCRMSearch["detail"],
  }),
  component: PeopleCRM,
});

function PeopleCRM() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState(search.tab || "people");

  useEffect(() => {
    if (search.tab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  const handleShowDetail = (type: string, id: string) => {
    navigate({
      search: {
        tab: activeTab,
        detail: {
          type: type as NonNullable<PeopleCRMSearch["detail"]>["type"],
          id,
        },
      },
    });
  };

  const handleEditDetail = (type: string, id: string) => {
    navigate({
      search: {
        tab: activeTab,
        detail: {
          type: type as NonNullable<PeopleCRMSearch["detail"]>["type"],
          id,
          action: "edit",
        },
      },
    });
  };

  const handleBack = () => {
    navigate({
      search: {
        tab: activeTab,
      },
    });
  };

  const renderDetailContent = () => {
    if (!search.detail) return null;

    const { type, id, action } = search.detail;

    if (action === "edit") {
      switch (type) {
        case "person":
          return <EditPerson personId={id} onBack={handleBack} />;
        case "meeting":
          return <EditMeeting meetingId={id} onBack={handleBack} />;
        case "note":
          return <EditNote noteId={id} onBack={handleBack} />;
        case "attribute":
          return <EditAttribute attributeId={id} onBack={handleBack} />;
        default:
          return null;
      }
    }

    switch (type) {
      case "person":
        return (
          <PersonDetail
            personId={id}
            onBack={handleBack}
            onEdit={() => handleEditDetail("person", id)}
          />
        );
      case "meeting":
        return (
          <MeetingDetail
            meetingId={id}
            onBack={handleBack}
            onEdit={() => handleEditDetail("meeting", id)}
          />
        );
      case "note":
        return (
          <NoteDetail
            noteId={id}
            onBack={handleBack}
            onEdit={() => handleEditDetail("note", id)}
          />
        );
      case "attribute":
        return (
          <AttributeDetail
            attributeId={id}
            onBack={handleBack}
            onEdit={() => handleEditDetail("attribute", id)}
          />
        );
      case "birthday":
        return <BirthdayDetail personId={id} onBack={handleBack} />;
      default:
        return null;
    }
  };

  const tabs = useMemo(
    () => [
      {
        id: "people",
        label: "People",
        icon: <Users className="h-4 w-4" />,
        content: <PeopleList onShowDetail={handleShowDetail} />,
      },
      {
        id: "meetings",
        label: "Meetings",
        icon: <Calendar className="h-4 w-4" />,
        content: <MeetingsList onShowDetail={handleShowDetail} />,
      },
      {
        id: "notes",
        label: "Notes",
        icon: <NotebookPen className="h-4 w-4" />,
        content: <PersonNotesList onShowDetail={handleShowDetail} />,
      },
      {
        id: "attributes",
        label: "Attributes",
        icon: <Tag className="h-4 w-4" />,
        content: <PersonAttributesList onShowDetail={handleShowDetail} />,
      },
      {
        id: "birthdays",
        label: "Birthdays",
        icon: <Gift className="h-4 w-4" />,
        content: <BirthdaysList onShowDetail={handleShowDetail} />,
      },
    ],
    []
  );

  const showingDetail = !!search.detail;

  return (
    <div className="w-full h-full">
      {showingDetail ? (
        renderDetailContent()
      ) : (
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

          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Alpha Feature:</strong> People CRM is currently in alpha.
              You may experience bugs or unexpected behavior. Data integrity is
              maintained, but the user experience may not be polished.
            </AlertDescription>
          </Alert>

          <ReusableTabs
            tabs={tabs}
            defaultTabId={activeTab}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
