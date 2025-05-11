// frontend/src/routes/people-crm/chats/$chatId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { PersonChat, PersonChatInput } from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import ChatForm from "@/features/people-crm/chat-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface ChatParams {
  chatId: string;
}

export const Route = createFileRoute("/people-crm/chats/$chatId/edit")({
  component: EditChat,
});

function EditChat() {
  const { chatId } = Route.useParams() as ChatParams;
  const navigate = useNavigate();
  const chats = useStore(dataStore, (state) => state.person_chats);

  const [chat, setChat] = useState<PersonChat | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (data: PersonChatInput) => {
    setLoading(true);
    try {
      const updatedChat = await ApiService.updateRecord(chatId, data);
      if (updatedChat) {
        updateEntry(chatId, updatedChat, "person_chats");
        toast.success("Chat updated successfully");
        navigate({ to: `/people-crm/chats/${chatId}` });
      }
    } catch (error) {
      console.error("Error updating chat:", error);
      toast.error("Failed to update chat");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/chats/${chatId}` });
  };

  if (!chat) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/people-crm/chats/$chatId`} params={{ chatId: chatId }}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Chat
          </h1>
          <p className="text-muted-foreground mt-1">Update chat information</p>
        </div>
      </div>

      {/* Form */}
      <ChatForm
        chat={chat}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
