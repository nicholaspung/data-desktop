import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  onFocus,
  dropdownPosition = "bottom",
  usePortal = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: SelectOption & { [key: string]: unknown }) => void;
  options: (SelectOption & { [key: string]: unknown })[];
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
    option: SelectOption & { [key: string]: unknown },
    isActive: boolean
  ) => React.ReactNode;
  continueProvidingSuggestions?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  dropdownPosition?: "top" | "bottom";
  usePortal?: boolean;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [finalOptions, setFinalOptions] = useState<
    (SelectOption & { [key: string]: unknown })[]
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

  // Update dropdown position when input focus changes or suggestions show
  const updateDropdownPosition = () => {
    if (inputRef.current && usePortal) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect(rect);
    }
  };

  useEffect(() => {
    if (showSuggestions && usePortal) {
      updateDropdownPosition();
      
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showSuggestions, usePortal]);

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

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (activeIndex >= 0 && optionRefs.current[activeIndex]) {
      optionRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  const handleSelect = (option: SelectOption & { [key: string]: unknown }) => {
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

  // Calculate dropdown style based on position
  const getDropdownStyle = (): React.CSSProperties => {
    if (!dropdownRect) return {};
    
    const top = dropdownPosition === "top" 
      ? dropdownRect.top - 8 // 8px margin above input
      : dropdownRect.bottom + 4; // 4px margin below input
    
    return {
      position: 'fixed',
      top: dropdownPosition === "top" ? 'auto' : top,
      bottom: dropdownPosition === "top" ? window.innerHeight - dropdownRect.top + 4 : 'auto',
      left: dropdownRect.left,
      minWidth: dropdownRect.width,
      zIndex: 9999,
    };
  };

  // Render dropdown content for portal
  const renderPortalDropdown = () => {
    if (!showSuggestions || !usePortal || !dropdownRect) {
      return null;
    }

    const dropdownContent = (
      <>
        {finalOptions.length > 0 && (
          <div
            ref={suggestionsRef}
            style={getDropdownStyle()}
            className="bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto w-max max-w-[500px] pointer-events-auto"
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => handleSelect(option), 0);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {renderItem ? (
                    renderItem(option, activeIndex === index)
                  ) : (
                    <div className="flex flex-row items-center gap-2">
                      <span>{option.label}</span>
                      {option.label.toLowerCase() === value.toLowerCase() && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {finalOptions.length === 0 && value.length > 0 && (
          <div
            style={getDropdownStyle()}
            className="bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground w-max max-w-[500px] pointer-events-auto"
          >
            {emptyMessage}
          </div>
        )}
      </>
    );

    return createPortal(dropdownContent, document.body);
  };

  // Render dropdown content for non-portal (normal position)
  const renderInlineDropdown = () => {
    if (!showSuggestions || usePortal) return null;

    return (
      <>
        {finalOptions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute left-0 z-50 bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto min-w-full w-max max-w-[500px]",
              dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
            )}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => handleSelect(option), 0);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {renderItem ? (
                    renderItem(option, activeIndex === index)
                  ) : (
                    <div className="flex flex-row items-center gap-2">
                      <span>{option.label}</span>
                      {option.label.toLowerCase() === value.toLowerCase() && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {finalOptions.length === 0 && value.length > 0 && (
          <div className={cn(
            "absolute left-0 z-50 bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground min-w-full w-max max-w-[500px]",
            dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
          )}>
            {emptyMessage}
          </div>
        )}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Alt+Shift to hide suggestions
    if (e.key === "Shift" && e.altKey) {
      if (showSuggestions) {
        e.preventDefault();
        e.stopPropagation();
        setShowSuggestions(false);
        return;
      }
    }

    // Let regular Escape always propagate for dialog closing
    if (e.key === "Escape") {
      onKeyDown?.(e);
      return;
    }

    if (!showSuggestions || finalOptions.length === 0) {
      // Call parent handler when suggestions aren't showing
      onKeyDown?.(e);
      return;
    }

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
      case "Tab":
        setShowSuggestions(false);
        // Call parent handler for Tab to allow normal tab navigation
        onKeyDown?.(e);
        break;
      default:
        // Call parent handler for other keys when suggestions are showing
        onKeyDown?.(e);
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
            // Delay hiding suggestions to allow clicks to register
            setTimeout(() => {
              setShowSuggestions(false);
            }, 300);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setShowSuggestions(true);
            onFocus?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(inputClassName)}
          disabled={disabled}
          autoComplete="off"
        />
        {renderInlineDropdown()}
      </div>
      {renderPortalDropdown()}
    </div>
  );
}
