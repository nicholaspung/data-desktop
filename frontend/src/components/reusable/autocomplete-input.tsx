import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { SelectOption } from "@/types/types";

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
  renderItem,
  continueProvidingSuggestions = false,
  onKeyDown,
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
  renderItem?: (
    option: SelectOption & { [key: string]: any },
    isActive: boolean
  ) => React.ReactNode;
  continueProvidingSuggestions?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [finalOptions, setFinalOptions] = useState<
    (SelectOption & { [key: string]: any })[]
  >([]);

  useEffect(() => {
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

    let filteredOptions = recentOptions;
    if (value.length > 0 && continueProvidingSuggestions) {
      filteredOptions = options;
    } else if (value.length > 0) {
      filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
    }

    setFinalOptions(filteredOptions);

    optionRefs.current = finalOptions.map(() => null);
  }, [
    options,
    value,
    continueProvidingSuggestions,
    maxRecentOptions,
    showRecentOptions,
  ]);

  useEffect(() => {
    optionRefs.current = finalOptions.map(() => null);
  }, [finalOptions]);

  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autofocus]);

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

  useEffect(() => {
    if (activeIndex >= 0 && optionRefs.current[activeIndex]) {
      optionRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  const handleSelect = (option: SelectOption & { [key: string]: any }) => {
    if (onSelect) {
      onSelect(option);
    } else {
      onChange(option.label);
    }
    setShowSuggestions(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);

    if (!showSuggestions || finalOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < finalOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : finalOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(finalOptions[activeIndex]);
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
        {showSuggestions && finalOptions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto"
          >
            <div className="p-1 text-xs text-muted-foreground border-b">
              {value.length > 0 ? "Search results" : "Recent entries"}
            </div>
            <ul className="py-1">
              {finalOptions.map((option, index) => (
                <li
                  key={option.id}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer",
                    activeIndex === index ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {renderItem ? (
                    renderItem(option, activeIndex === index)
                  ) : (
                    <>
                      <span>{option.label}</span>
                      {option.label.toLowerCase() === value.toLowerCase() && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showSuggestions && finalOptions.length === 0 && value.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
