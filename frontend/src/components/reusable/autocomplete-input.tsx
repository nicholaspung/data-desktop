// src/components/reusable/autocomplete-input.tsx
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Clock, Tag, FolderIcon } from "lucide-react";
import { SelectOption } from "@/types/types";
import { Badge } from "@/components/ui/badge";

export default function AutocompleteInput({
  label,
  value,
  onChange,
  onSelect,
  options,
  placeholder = "Type to search...",
  id,
  className,
  inputClassName,
  disabled = false,
  autofocus = false,
  description,
  required = false,
  emptyMessage = "No options found.",
  showRecentOptions = true,
  maxRecentOptions = 7,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: SelectOption & { [key: string]: any }) => void;
  options: (SelectOption & { [key: string]: any })[];
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autofocus?: boolean;
  description?: string;
  required?: boolean;
  emptyMessage?: string;
  showRecentOptions?: boolean;
  maxRecentOptions?: number;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get recent options (limited by maxRecentOptions)
  const recentOptions = showRecentOptions
    ? [...options]
        .sort((a, b) => {
          if (a.entry?.lastModified && b.entry?.lastModified) {
            return (
              new Date(b.entry.lastModified).getTime() -
              new Date(a.entry.lastModified).getTime()
            );
          }
          return 0;
        })
        .slice(0, maxRecentOptions)
    : [];

  // Filter options based on input value if user has typed something
  const filteredOptions =
    value.length > 0
      ? options.filter((option) =>
          option.label.toLowerCase().includes(value.toLowerCase())
        )
      : recentOptions;

  // Focus input on mount if autofocus is true
  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autofocus]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle selection from suggestions
  const handleSelect = (option: SelectOption & { [key: string]: any }) => {
    if (onSelect) {
      onSelect(option);
    } else {
      onChange(option.label);
    }
    setShowSuggestions(false);

    // Focus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Skip if no suggestions are shown
    if (!showSuggestions || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        setShowSuggestions(false);
        break;
    }
  };

  // Render option with additional information (category, tags)
  const renderOption = (
    option: SelectOption & { [key: string]: any },
    isActive: boolean
  ) => {
    const entry = option.entry;

    return (
      <div
        className={cn(
          "w-full",
          isActive ? "bg-accent text-accent-foreground" : ""
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{option.label}</span>
          {option.label.toLowerCase() === value.toLowerCase() && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>

        {entry && (
          <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
            {entry.category_id_data && (
              <div className="flex items-center gap-1">
                <FolderIcon className="h-3 w-3" />
                <span>{entry.category_id_data.name}</span>
              </div>
            )}

            {entry.tags && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <div className="flex flex-wrap gap-1">
                  {entry.tags.split(",").map((tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[0.65rem] py-0 px-1"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.lastModified && (
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                <span>{new Date(entry.lastModified).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2 relative", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          value={value}
          onBlur={() => {
            // Delay hiding suggestions to allow for click events
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(inputClassName)}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredOptions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto"
          >
            <div className="p-1 text-xs text-muted-foreground border-b">
              {value.length > 0 ? "Search results" : "Recent entries"}
            </div>
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.id}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer",
                    activeIndex === index ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {renderOption(option, activeIndex === index)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showSuggestions &&
          filteredOptions.length === 0 &&
          value.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
      </div>
    </div>
  );
}
