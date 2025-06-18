import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import AutocompleteInput from "./autocomplete-input";
import { SelectOption } from "@/types/types";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  generalData?: any[];
  generalDataTagField?: string;
  usePortal?: boolean;
  dropdownPosition?: "top" | "bottom";
  showLabel?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
}

export default function TagInput({
  value,
  onChange,
  label = "Tags (comma-separated)",
  className,
  generalData,
  generalDataTagField,
  usePortal = false,
  dropdownPosition = "bottom",
  showLabel = true,
  onKeyDown,
  onFocus,
}: TagInputProps) {
  const getAvailableTags = useMemo(() => {
    if (!generalData || generalData.length === 0) return [];
    const tagsSet = new Set<string>();

    if (generalDataTagField) {
      generalData.forEach((entry) => {
        if (!entry[generalDataTagField]) return;

        const entryTags = entry[generalDataTagField]
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);

        entryTags.forEach((tag: any) => tagsSet.add(tag));
      });
    }

    const allTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const isTypingNewTag = !value.trim().endsWith(",") && value.trim() !== "";
    const selectedTags = isTypingNewTag ? allTags.slice(0, -1) : allTags;

    const currentTypingTag = isTypingNewTag ? allTags[allTags.length - 1] : "";

    let availableTags = Array.from(tagsSet)
      .filter((tag) => !selectedTags.includes(tag))
      .sort();

    if (currentTypingTag) {
      availableTags = availableTags.filter((tag) =>
        tag.toLowerCase().includes(currentTypingTag.toLowerCase())
      );
    }

    return availableTags.map((tag) => ({
      id: tag,
      label: tag,
    }));
  }, [generalData, value, generalDataTagField]);

  const handleTagsChange = (tagInput: string) => {
    onChange(tagInput);
  };

  const handleTagSelect = (option: SelectOption) => {
    const currentTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    const isTypingNewTag = !value.trim().endsWith(",") && value.trim() !== "";

    if (isTypingNewTag) {
      const withoutCurrentTag = currentTags.slice(0, -1);

      const newTags = [...withoutCurrentTag, option.label];
      onChange(newTags.join(", ") + ", ");
    } else {
      if (!currentTags.includes(option.label)) {
        const newTags = [...currentTags, option.label];
        onChange(newTags.join(", ") + ", ");
      }
    }
  };

  return (
    <div className={cn("space-y-2 flex-2", className)}>
      {showLabel && (
        <Label htmlFor="tags" className="text-sm font-medium">
          {label}
        </Label>
      )}
      <AutocompleteInput
        id="tags"
        value={value}
        onChange={handleTagsChange}
        onSelect={handleTagSelect}
        options={getAvailableTags}
        placeholder="project, meeting, etc."
        inputClassName="h-10 focus:ring-2 focus:ring-primary/50"
        emptyMessage="Type to add tags or select from previous tags"
        showRecentOptions={true}
        maxRecentOptions={10}
        continueProvidingSuggestions={true}
        usePortal={usePortal}
        dropdownPosition={dropdownPosition}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        renderItem={(option, isActive) => (
          <div
            className={cn(
              "w-full",
              isActive ? "bg-accent text-accent-foreground" : ""
            )}
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="px-2 py-1">
                <Tag className="h-3 w-3 mr-1" />
                <span>{option.label}</span>
              </Badge>
            </div>
          </div>
        )}
      />
    </div>
  );
}
