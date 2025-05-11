// frontend/src/routes/people-crm/chats/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { PERSON_CHATS_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MessageCircle,
  Calendar,
  User,
  Send,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import ReusableCard from "@/components/reusable/reusable-card";
import RefreshDatasetButton from "@/components/reusable/refresh-dataset-button";
import { PersonChat } from "@/store/people-crm-definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/people-crm/chats/")({
  component: PersonChatsList,
});

function PersonChatsList() {
  const chats = useStore(dataStore, (state) => state.person_chats);
  const isLoading = useStore(loadingStore, (state) => state.person_chats);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats based on search
  const filteredChats = chats.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      chat.content.toLowerCase().includes(searchLower) ||
      chat.person_id_data?.name.toLowerCase().includes(searchLower) ||
      chat.platform.toLowerCase().includes(searchLower)
    );
  });

  // Sort chats by date (newest first)
  const sortedChats = filteredChats.sort(
    (a, b) => new Date(b.chat_date).getTime() - new Date(a.chat_date).getTime()
  );

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

  const PersonChatCard = ({ chat }: { chat: PersonChat }) => (
    <Link to={`/people-crm/chats/$chatId`} params={{ chatId: chat.id }}>
      <ReusableCard
        cardClassName="hover:border-primary/50 transition-colors cursor-pointer"
        content={
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {chat.person_id_data?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(chat.chat_date, "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Send className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {chat.sender === "me" ? "You" : "Them"}
                    </span>
                  </div>
                </div>

                <Badge className={`${getPlatformColor(chat.platform)} mb-2`}>
                  {chat.platform}
                </Badge>

                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none line-clamp-3">
                  <ReactMarkdown>{chat.content}</ReactMarkdown>
                </div>

                {chat.attachments && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    📎 Has attachments
                  </div>
                )}
              </div>
            </div>
          </div>
        }
      />
    </Link>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Chat History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track conversations with people in your network
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshDatasetButton
            fields={PERSON_CHATS_FIELD_DEFINITIONS.fields}
            datasetId="person_chats"
            title="Chats"
          />
          <Link to="/people-crm/chats/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Chats List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading chats...</p>
        </div>
      ) : sortedChats.length > 0 ? (
        <div className="space-y-4">
          {sortedChats.map((chat) => (
            <PersonChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      ) : (
        <ReusableCard
          showHeader={false}
          cardClassName="border-dashed"
          contentClassName="py-12"
          content={
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No chats found matching your search"
                  : "No chat history recorded yet"}
              </p>
              <Link to="/people-crm/chats/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Chat
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
