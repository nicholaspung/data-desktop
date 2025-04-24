// src/features/time-tracker/edit-time-entry-dialog.tsx
import { useState, useEffect } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes } from "@/lib/time-utils";
import { updateEntry } from "@/store/data-store";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Save } from "lucide-react";

interface EditTimeEntryDialogProps {
  entry: TimeEntry;
  categories: TimeCategory[];
  onSave: () => void;
  onCancel: () => void;
}

export default function EditTimeEntryDialog({
  entry,
  categories,
  onSave,
  onCancel,
}: EditTimeEntryDialogProps) {
  const [description, setDescription] = useState(entry.description);
  const [categoryId, setCategoryId] = useState<string | undefined>(
    entry.category_id
  );
  const [tags, setTags] = useState(entry.tags || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Format dates for datetime-local inputs
    const formatDateForInput = (date: Date) => {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };

    setStartTime(formatDateForInput(new Date(entry.start_time)));
    setEndTime(formatDateForInput(new Date(entry.end_time)));
  }, [entry]);

  const handleSave = async () => {
    if (!description || !startTime || !endTime) return;

    try {
      setIsSaving(true);

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (startDate >= endDate) {
        alert("End time must be after start time");
        setIsSaving(false);
        return;
      }

      const durationMinutes = calculateDurationMinutes(startDate, endDate);

      const updatedEntry = await ApiService.updateRecord(entry.id, {
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
      });

      if (updatedEntry) {
        updateEntry(entry.id, updatedEntry, "time_entries");
      }

      onSave();
    } catch (error) {
      console.error("Error updating time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));

  return (
    <ReusableDialog
      title="Edit Time Entry"
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      onConfirm={handleSave}
      confirmText="Save Changes"
      confirmIcon={<Save className="h-4 w-4" />}
      loading={isSaving}
      footerActionDisabled={!description || !startTime || !endTime || isSaving}
      customContent={
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input
                id="edit-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input
                id="edit-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <ReusableSelect
              options={categoryOptions}
              value={categoryId || ""}
              onChange={setCategoryId}
              placeholder="Select category"
              title="category"
              noDefault={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="project, meeting, etc."
            />
          </div>
        </div>
      }
    />
  );
}
