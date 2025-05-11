// frontend/src/features/people-crm/chat-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { PersonChat, PersonChatInput } from "@/store/people-crm-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { MarkdownEditor } from "@/components/reusable/markdown-editor";
import { Input } from "@/components/ui/input";

interface ChatFormProps {
  chat?: PersonChat;
  onSubmit: (data: PersonChatInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultPersonId?: string;
}

const PLATFORM_OPTIONS = [
  { id: "text", label: "Text Message" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack" },
  { id: "discord", label: "Discord" },
  { id: "instagram", label: "Instagram" },
  { id: "other", label: "Other" },
];

const SENDER_OPTIONS = [
  { id: "me", label: "Me" },
  { id: "them", label: "Them" },
];

export default function ChatForm({
  chat,
  onSubmit,
  onCancel,
  loading = false,
  defaultPersonId,
}: ChatFormProps) {
  const people = useStore(dataStore, (state) => state.people);

  // Parse existing attachments
  const existingAttachments: string[] = chat?.attachments
    ? JSON.parse(chat.attachments)
    : [];

  // Initialize form data
  const [formData, setFormData] = useState<Partial<PersonChatInput>>({
    person_id: chat?.person_id || defaultPersonId || "",
    chat_date: chat?.chat_date || new Date(),
    platform: chat?.platform || "text",
    content: chat?.content || "",
    sender: chat?.sender || "me",
    attachments: chat?.attachments || "",
    private: chat?.private || false,
  });

  const [attachmentInputs, setAttachmentInputs] = useState<string[]>(
    existingAttachments.length > 0 ? existingAttachments : [""]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof PersonChatInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.person_id) {
      newErrors.person_id = "Please select a person";
    }

    if (!formData.chat_date) {
      newErrors.chat_date = "Chat date is required";
    }

    if (!formData.content?.trim()) {
      newErrors.content = "Chat content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Process attachments
    const validAttachments = attachmentInputs
      .filter((url) => url.trim() !== "")
      .map((url) => url.trim());

    const submitData = {
      ...formData,
      attachments:
        validAttachments.length > 0 ? JSON.stringify(validAttachments) : "",
    };

    try {
      await onSubmit(submitData as PersonChatInput);
    } catch (error) {
      console.error("Error submitting chat form:", error);
    }
  };

  // Handle attachment inputs
  const addAttachmentInput = () => {
    setAttachmentInputs([...attachmentInputs, ""]);
  };

  const removeAttachmentInput = (index: number) => {
    const newInputs = attachmentInputs.filter((_, i) => i !== index);
    setAttachmentInputs(newInputs.length > 0 ? newInputs : [""]);
  };

  const updateAttachmentInput = (index: number, value: string) => {
    const newInputs = [...attachmentInputs];
    newInputs[index] = value;
    setAttachmentInputs(newInputs);
  };

  // Convert people to select options
  const peopleOptions = people.map((person) => ({
    label: person.name,
    value: person.id,
    ...person,
  }));

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="person_id">
                Person <span className="text-destructive">*</span>
              </Label>
              <ReusableSelect
                title="person"
                options={peopleOptions}
                value={formData.person_id}
                onChange={(value) => handleChange("person_id", value)}
                // className={errors.person_id ? "border-destructive" : ""}
              />
              {errors.person_id && (
                <p className="text-sm text-destructive">{errors.person_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chat_date">
                Chat Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.chat_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.chat_date
                      ? format(formData.chat_date, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.chat_date}
                    onSelect={(date) => handleChange("chat_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.chat_date && (
                <p className="text-sm text-destructive">{errors.chat_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <ReusableSelect
                title="platform"
                options={PLATFORM_OPTIONS}
                value={formData.platform}
                onChange={(value) => handleChange("platform", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender</Label>
              <ReusableSelect
                title="sender"
                options={SENDER_OPTIONS}
                value={formData.sender}
                onChange={(value) => handleChange("sender", value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Chat Content <span className="text-destructive">*</span>
            </Label>
            <MarkdownEditor
              value={formData.content || ""}
              onChange={(value) => handleChange("content", value)}
              placeholder="Enter chat content..."
              minHeight="150px"
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="space-y-2">
              {attachmentInputs.map((attachment, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter attachment URL"
                    value={attachment}
                    onChange={(e) =>
                      updateAttachmentInput(index, e.target.value)
                    }
                    className="flex-1"
                  />
                  {attachmentInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAttachmentInput(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttachmentInput}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Attachment
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={formData.private}
              onCheckedChange={(checked) => handleChange("private", checked)}
            />
            <Label htmlFor="private">Make this chat private</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : chat ? "Update Chat" : "Add Chat"}
        </Button>
      </div>
    </form>
  );
}
