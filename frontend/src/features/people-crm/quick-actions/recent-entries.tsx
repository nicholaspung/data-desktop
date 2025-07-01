import React, { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import ReusableSelect from "@/components/reusable/reusable-select";
import { formatDistanceToNow, isValid } from "date-fns";
import { Users, Calendar, NotebookPen, Tag, Gift, Filter } from "lucide-react";

interface RecentEntry {
  id: string;
  type: "person" | "meeting" | "note" | "attribute" | "birthday";
  title: string;
  subtitle?: string;
  timestamp: Date;
  data: any;
}

interface RecentEntriesProps {
  onShowDetail: (type: string, id: string) => void;
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ onShowDetail }) => {
  const [filterType, setFilterType] = useState<string>("all");
  
  const people = useStore(dataStore, (state) => state.people) || [];
  const meetings = useStore(dataStore, (state) => state.meetings) || [];
  const personNotes = useStore(dataStore, (state) => state.person_notes) || [];
  const personAttributes = useStore(dataStore, (state) => state.person_attributes) || [];
  const birthdayReminders = useStore(dataStore, (state) => state.birthday_reminders) || [];

  const recentEntries = useMemo(() => {
    const entries: RecentEntry[] = [];

    // Add people
    people.forEach((person) => {
      entries.push({
        id: person.id,
        type: "person",
        title: person.name,
        subtitle: "Person",
        timestamp: person.createdAt,
        data: person,
      });
    });

    // Add meetings
    meetings.forEach((meeting) => {
      entries.push({
        id: meeting.id,
        type: "meeting",
        title: "Meeting",
        subtitle: `${meeting.location || "No location"} • ${meeting.duration_minutes || 60} min`,
        timestamp: meeting.createdAt,
        data: meeting,
      });
    });

    // Add notes
    personNotes.forEach((note) => {
      const person = people.find(p => p.id === note.person_id);
      entries.push({
        id: note.id,
        type: "note",
        title: note.title || "Untitled Note",
        subtitle: `Note for ${person?.name || "Unknown person"}`,
        timestamp: note.createdAt,
        data: note,
      });
    });

    // Add attributes
    personAttributes.forEach((attr) => {
      const person = people.find(p => p.id === attr.person_id);
      entries.push({
        id: attr.id,
        type: "attribute",
        title: attr.attribute_name,
        subtitle: `${attr.attribute_value} • ${person?.name || "Unknown person"}`,
        timestamp: attr.createdAt,
        data: attr,
      });
    });

    // Add birthday reminders
    birthdayReminders.forEach((reminder) => {
      const person = people.find(p => p.id === reminder.person_id);
      entries.push({
        id: reminder.id,
        type: "birthday",
        title: `Birthday: ${person?.name || "Unknown person"}`,
        subtitle: reminder.reminder_note || "Birthday reminder",
        timestamp: reminder.createdAt,
        data: reminder,
      });
    });

    // Filter by type
    const filtered = filterType === "all" ? entries : entries.filter(entry => entry.type === filterType);

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => {
      try {
        if (!isValid(a.timestamp) || !isValid(b.timestamp)) return 0;
        return b.timestamp.getTime() - a.timestamp.getTime();
      } catch {
        return 0;
      }
    }).slice(0, 20); // Show last 20 entries
  }, [people, meetings, personNotes, personAttributes, birthdayReminders, filterType]);

  const getEntryIcon = (type: string) => {
    switch (type) {
      case "person": return <Users className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      case "note": return <NotebookPen className="h-4 w-4" />;
      case "attribute": return <Tag className="h-4 w-4" />;
      case "birthday": return <Gift className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getEntryBadgeColor = (type: string) => {
    switch (type) {
      case "person": return "bg-blue-100 text-blue-800";
      case "meeting": return "bg-green-100 text-green-800";
      case "note": return "bg-purple-100 text-purple-800";
      case "attribute": return "bg-orange-100 text-orange-800";
      case "birthday": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filterOptions = [
    { id: "all", value: "all", label: "All Types" },
    { id: "person", value: "person", label: "People" },
    { id: "meeting", value: "meeting", label: "Meetings" },
    { id: "note", value: "note", label: "Notes" },
    { id: "attribute", value: "attribute", label: "Attributes" },
    { id: "birthday", value: "birthday", label: "Birthday Reminders" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <ReusableSelect
          options={filterOptions}
          value={filterType}
          onChange={setFilterType}
          placeholder="Filter entries"
          triggerClassName="w-40"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recentEntries.length > 0 ? (
          recentEntries.map((entry) => (
            <div
              key={`${entry.type}-${entry.id}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => onShowDetail(entry.type, entry.id)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-0.5">
                  {getEntryIcon(entry.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{entry.title}</h4>
                    <Badge className={`text-xs ${getEntryBadgeColor(entry.type)}`}>
                      {entry.type}
                    </Badge>
                  </div>
                  {entry.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No entries yet</p>
            <p className="text-xs">Start by adding a person or meeting</p>
          </div>
        )}
      </div>

      {recentEntries.length >= 20 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Showing 20 most recent entries
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentEntries;