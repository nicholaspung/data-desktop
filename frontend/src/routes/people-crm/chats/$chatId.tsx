// frontend/src/routes/people-crm/chats/$chatId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { PersonChat } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit,
  MessageCircle,
  Calendar,
  User,
  Send,
  Paperclip,
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

interface ChatParams {
  chatId: string;
}

export const Route = createFileRoute("/people-crm/chats/$chatId")({
  component: ChatDetail,
});

function ChatDetail() {
  const { chatId } = Route.useParams() as ChatParams;
  const navigate = useNavigate();
  const chats = useStore(dataStore, (state) => state.person_chats);

  const [chat, setChat] = useState<PersonChat | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundChat = chats.find((c) => c.id === chatId);
    if (foundChat) {
      setChat(foundChat);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(chatId).then((data) => {
        if (data) {
          setChat(data as PersonChat);
        }
      });
    }
  }, [chatId, chats]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiService.deleteRecord(chatId);
      deleteEntry(chatId, "person_chats");
      toast.success("Chat deleted successfully");
      navigate({ to: "/people-crm/chats" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setDeleting(false);
    }
  };

  if (!chat) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading chat details...</p>
      </div>
    );
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "whatsapp":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "email":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "slack":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "discord":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "instagram":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Parse attachments if they exist
  let attachments: string[] = [];
  try {
    if (chat.attachments) {
      attachments = JSON.parse(chat.attachments);
    }
  } catch (error) {
    console.error("Error parsing attachments:", error);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/people-crm/chats">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Chat Detail
            </h1>
            <p className="text-muted-foreground mt-1">
              {chat.person_id_data?.name || "Unknown"} via {chat.platform}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/people-crm/chats/$chatId/edit`}
            params={{ chatId: chatId }}
          >
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDeleteDialog
            title="Delete Chat"
            description="Are you sure you want to delete this chat entry? This action cannot be undone."
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </div>

      {/* Chat Details */}
      <ReusableCard
        content={
          <div className="space-y-6">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {chat.person_id_data?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(chat.chat_date, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {chat.sender === "me" ? "You" : "Them"}
                </span>
              </div>
              <Badge className={getPlatformColor(chat.platform)}>
                {chat.platform}
              </Badge>
            </div>

            {/* Chat Content */}
            <div>
              <h3 className="font-medium mb-3">Message Content</h3>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4">
                <ReactMarkdown>{chat.content}</ReactMarkdown>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      {attachment}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Created: {format(chat.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <span>
                  Last modified:{" "}
                  {format(chat.lastModified, "MMMM d, yyyy 'at' h:mm a")}
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
              params={{ personId: chat.person_id }}
            >
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Contact
              </Button>
            </Link>
            <Link
              to={`/people-crm/chats/add`}
              params={{ personId: chat.person_id }}
            >
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Another Chat
              </Button>
            </Link>
            <Link
              to={`/people-crm/meetings/add`}
              params={{ personId: chat.person_id }}
            >
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
