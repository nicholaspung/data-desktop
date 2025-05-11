// src/components/reusable/tag-input.tsx
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
}

export default function TagInput({
  value,
  onChange,
  label = "Tags (comma-separated)",
  className,
  generalData,
  generalDataTagField,
}: TagInputProps) {
  const getAvailableTags = useMemo(() => {
    if (!generalData || generalData.length === 0) return [];
    const tagsSet = new Set<string>();

    if (generalDataTagField) {
      generalData.forEach((entry) => {
        if (!entry[generalDataTagField]) return;

        console.log(entry[generalDataTagField]);

        const entryTags = entry[generalDataTagField]
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);

        entryTags.forEach((tag: any) => tagsSet.add(tag));
      });
    }

    // Get currently selected tags
    const selectedTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Filter out already selected tags
    const availableTags = Array.from(tagsSet)
      .filter((tag) => !selectedTags.includes(tag))
      .sort()
      .map((tag) => ({
        id: tag,
        label: tag,
      }));

    return availableTags;
  }, [generalData, value]);

  const handleTagsChange = (tagInput: string) => {
    onChange(tagInput);
  };

  const handleTagSelect = (option: SelectOption) => {
    // Extract current tags as an array
    const currentTags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    // Check if we're in the middle of typing a new tag
    // This happens when the last character is not a comma
    const isTypingNewTag = !value.trim().endsWith(",") && value.trim() !== "";

    if (isTypingNewTag) {
      // Replace the currently typed tag with the selected one
      // First remove the partial tag being typed
      const withoutCurrentTag = currentTags.slice(0, -1);
      // Then add the selected tag
      const newTags = [...withoutCurrentTag, option.label];
      onChange(newTags.join(", "));
    } else {
      // We're starting a new tag after a comma or at the beginning
      // Check if the tag is already in the list
      if (!currentTags.includes(option.label)) {
        const newTags = [...currentTags, option.label];
        onChange(newTags.join(", "));
      }
    }
  };

  return (
    <div className={cn("space-y-2 flex-2", className)}>
      <Label htmlFor="tags" className="text-sm font-medium">
        {label}
      </Label>
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
