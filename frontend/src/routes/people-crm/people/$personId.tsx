// frontend/src/routes/people-crm/people/$personId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Person } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  Calendar,
  MessageCircle,
  NotebookPen,
  Plus,
  Gift,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

interface PersonParams {
  personId: string;
}

export const Route = createFileRoute("/people-crm/people/$personId")({
  component: PersonDetail,
});

function PersonDetail() {
  const { personId } = Route.useParams() as PersonParams;
  const navigate = useNavigate();
  const people = useStore(dataStore, (state) => state.people);
  const meetings = useStore(dataStore, (state) => state.meetings);
  const personNotes = useStore(dataStore, (state) => state.person_notes);
  const personChats = useStore(dataStore, (state) => state.person_chats);

  const [person, setPerson] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundPerson = people.find((p) => p.id === personId);
    if (foundPerson) {
      setPerson(foundPerson);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(personId).then((data) => {
        if (data) {
          setPerson(data as Person);
        }
      });
    }
  }, [personId, people]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(personId);
      deleteEntry(personId, "people");
      toast.success("Person deleted successfully");
      navigate({ to: "/people-crm/people" });
    } catch (error) {
      console.error("Error deleting person:", error);
      toast.error("Failed to delete person");
    } finally {
      setDeleting(false);
    }
  };

  if (!person) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading person details...</p>
      </div>
    );
  }

  // Get person's meetings
  const personMeetings = meetings
    .filter((meeting) => meeting.person_id === personId)
    .sort(
      (a, b) =>
        new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
    );

  // Get person's notes
  const personNotesList = personNotes
    .filter((note) => note.person_id === personId)
    .sort(
      (a, b) =>
        new Date(b.note_date).getTime() - new Date(a.note_date).getTime()
    );

  // Get person's chat history
  const personChatHistory = personChats
    .filter((chat) => chat.person_id === personId)
    .sort(
      (a, b) =>
        new Date(b.chat_date).getTime() - new Date(a.chat_date).getTime()
    );

  const socialLinks = person.social_links
    ? JSON.parse(person.social_links)
    : {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/people-crm/people">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{person.name}</h1>
            {(person.occupation || person.company) && (
              <p className="text-muted-foreground mt-1">
                {person.occupation}
                {person.occupation && person.company && " at "}
                {person.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/people-crm/people/$personId/edit`}
            params={{ personId: personId }}
          >
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDeleteDialog
            title="Delete Person"
            description="Are you sure you want to delete this person? This will also delete all associated meetings, notes, and chat history."
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </div>

      {/* Person Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <ReusableCard
            title="Basic Information"
            content={
              <div className="space-y-4">
                {person.email && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <a
                      href={`mailto:${person.email}`}
                      className="text-primary hover:underline"
                    >
                      {person.email}
                    </a>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Phone:</span>
                    <a
                      href={`tel:${person.phone}`}
                      className="text-primary hover:underline"
                    >
                      {person.phone}
                    </a>
                  </div>
                )}
                {person.address && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Address:</span>
                    <span>{person.address}</span>
                  </div>
                )}
                {person.birthday && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Birthday:</span>
                    <Link
                      to={`/people-crm/birthdays/$personId`}
                      params={{ personId: personId }}
                      className="text-primary hover:underline"
                    >
                      {format(person.birthday, "MMMM d, yyyy")}
                    </Link>
                  </div>
                )}
                {person.first_met_date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">First Met:</span>
                    <span>{format(person.first_met_date, "MMMM d, yyyy")}</span>
                  </div>
                )}
                {person.bio && (
                  <div>
                    <span className="font-medium block mb-1">Bio:</span>
                    <p className="text-muted-foreground">{person.bio}</p>
                  </div>
                )}
                {person.tags && (
                  <div>
                    <span className="font-medium block mb-2">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {person.tags.split(",").map((tag) => (
                        <Badge key={tag.trim()} variant="secondary">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(socialLinks).length > 0 && (
                  <div>
                    <span className="font-medium block mb-2">
                      Social Links:
                    </span>
                    <div className="space-y-1">
                      {Object.entries(socialLinks).map(([platform, link]) => (
                        <div key={platform} className="flex items-center gap-2">
                          <span className="capitalize text-muted-foreground">
                            {platform}:
                          </span>
                          <a
                            href={link as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {link as string}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
          />

          {/* Recent Activity */}
          <ReusableCard
            title="Recent Activity"
            content={
              <div className="space-y-4">
                {personMeetings.slice(0, 3).map((meeting) => (
                  <Link
                    key={meeting.id}
                    to={`/people-crm/meetings/$meetingId`}
                    params={{ meetingId: meeting.id }}
                    className="block hover:bg-accent/50 rounded p-3 -m-3"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          Meeting at {meeting.location}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(meeting.meeting_date, "MMMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {personChatHistory.slice(0, 3).map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/people-crm/chats/$chatId`}
                    params={{ chatId: chat.id }}
                    className="block hover:bg-accent/50 rounded p-3 -m-3"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{chat.platform} Chat</div>
                        <div className="text-sm text-muted-foreground">
                          {format(chat.chat_date, "MMMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {personNotesList.slice(0, 3).map((note) => (
                  <Link
                    key={note.id}
                    to={`/people-crm/notes/$noteId`}
                    params={{ noteId: note.id }}
                    className="block hover:bg-accent/50 rounded p-3 -m-3"
                  >
                    <div className="flex items-center gap-3">
                      <NotebookPen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          Note - {note.category || "General"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(note.note_date, "MMMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {personMeetings.length === 0 &&
                  personChatHistory.length === 0 &&
                  personNotesList.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No recent activity
                    </div>
                  )}
              </div>
            }
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <ReusableCard
            title="Quick Actions"
            content={
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/people-crm/meetings/add`}
                  params={{ personId: personId }}
                >
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add Meeting
                  </Button>
                </Link>
                <Link
                  to={`/people-crm/chats/add`}
                  params={{ personId: personId }}
                >
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Add Chat
                  </Button>
                </Link>
                <Link
                  to={`/people-crm/notes/add`}
                  params={{ personId: personId }}
                >
                  <Button variant="outline" className="w-full">
                    <NotebookPen className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </Link>
                <Link
                  to={`/people-crm/attributes/add`}
                  params={{ personId: personId }}
                >
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Attribute
                  </Button>
                </Link>
                {person.birthday && (
                  <Link
                    to={`/people-crm/birthdays/$personId`}
                    params={{ personId: personId }}
                  >
                    <Button variant="outline" className="w-full">
                      <Gift className="h-4 w-4 mr-2" />
                      Birthday Info
                    </Button>
                  </Link>
                )}
              </div>
            }
          />

          {/* Statistics */}
          <ReusableCard
            title="Statistics"
            content={
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meetings</span>
                  <span className="font-medium">{personMeetings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chat History</span>
                  <span className="font-medium">
                    {personChatHistory.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-medium">{personNotesList.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Contact</span>
                  <span className="font-medium">
                    {personMeetings.length > 0 || personChatHistory.length > 0
                      ? format(
                          Math.max(
                            ...personMeetings.map((m) =>
                              new Date(m.meeting_date).getTime()
                            ),
                            ...personChatHistory.map((c) =>
                              new Date(c.chat_date).getTime()
                            )
                          ),
                          "MMM d"
                        )
                      : "Never"}
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
