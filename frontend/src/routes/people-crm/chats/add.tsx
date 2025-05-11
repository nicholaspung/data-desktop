// frontend/src/routes/people-crm/chats/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import ChatForm from "@/features/people-crm/chat-form";
import { PersonChatInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AddChatSearch {
  personId?: string;
}

export const Route = createFileRoute("/people-crm/chats/add")({
  validateSearch: (search): AddChatSearch => ({
    personId: search.personId as string | undefined,
  }),
  component: AddChat,
});

function AddChat() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PersonChatInput) => {
    setLoading(true);
    try {
      const newChat = await ApiService.addRecord("person_chats", data);
      if (newChat) {
        addEntry(newChat, "person_chats");
        toast.success("Chat added successfully");
        navigate({ to: `/people-crm/chats/${newChat.id}` });
      }
    } catch (error) {
      console.error("Error adding chat:", error);
      toast.error("Failed to add chat");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/chats" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/chats">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquarePlus className="h-8 w-8" />
            Add Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Record a chat or conversation
          </p>
        </div>
      </div>

      {/* Form */}
      <ChatForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        defaultPersonId={search.personId}
      />
    </div>
  );
}
