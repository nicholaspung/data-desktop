// src/components/reusable/reusable-multi-select.tsx
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

export interface MultiSelectOption {
  id: string;
  label: string;
  [key: string]: any; // Allow for additional properties
}

interface ReusableMultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  renderItem?: (option: MultiSelectOption) => React.ReactNode;
  disabled?: boolean;
  maxDisplay?: number;
  groupByKey?: string;
  useGroups?: boolean;
  searchPlaceholder?: string;
  title?: string;
}

export default function ReusableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  isLoading = false,
  renderItem,
  disabled = false,
  maxDisplay = 3,
  groupByKey = "group",
  useGroups = false,
  searchPlaceholder = "Search...",
  title,
}: ReusableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Group options if needed
  const getGroupedOptions = () => {
    if (!useGroups) return { "": options };

    return options.reduce<Record<string, MultiSelectOption[]>>(
      (groups, option) => {
        const group = (option[groupByKey] as string) || "Other";
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
        return groups;
      },
      {}
    );
  };

  const groupedOptions = getGroupedOptions();

  // Filter function for search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Helper to find option by ID
  const getOptionById = (id: string) => {
    return options.find((option) => option.id === id);
  };

  // Handle removing a selected item
  const handleRemove = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(selected.filter((item) => item !== id));
  };

  // Clear all selected items
  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  // Toggle an option
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  // Adjust the width of the popover content to match the trigger
  useEffect(() => {
    if (open && triggerRef.current) {
      const popover = document.querySelector(
        "[data-radix-popper-content-wrapper]"
      );
      if (popover instanceof HTMLElement) {
        const width = triggerRef.current.offsetWidth;
        popover.style.width = `${width}px`;
      }
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || isLoading}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-2 overflow-hidden items-center">
            {selected.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 overflow-hidden">
                  {selected.slice(0, maxDisplay).map((id) => {
                    const option = getOptionById(id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        onClick={(e) => handleRemove(id, e)}
                      >
                        {option?.label || id}
                        <X className="ml-1 h-3 w-3 cursor-pointer" />
                      </Badge>
                    );
                  })}
                  {selected.length > maxDisplay && (
                    <Badge variant="secondary">
                      +{selected.length - maxDisplay} more
                    </Badge>
                  )}
                </div>
                <X
                  className="h-4 w-4 cursor-pointer opacity-50 hover:opacity-100"
                  onClick={handleClearAll}
                />
              </>
            ) : (
              <span className="text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : title
                    ? `Select ${title}`
                    : placeholder}
              </span>
            )}
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={setInputValue}
          />
          {filteredOptions.length === 0 && (
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          )}
          <CommandList>
            <ScrollArea className="h-[200px]">
              {useGroups ? (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <CommandGroup key={group} heading={group}>
                    {groupOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      )
                      .map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.id}
                          onSelect={() => toggleOption(option.id)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selected.includes(option.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}
                            >
                              {selected.includes(option.id) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <span className="flex-1">
                              {renderItem ? renderItem(option) : option.label}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                ))
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => toggleOption(option.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selected.includes(option.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50"
                          )}
                        >
                          {selected.includes(option.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className="flex-1">
                          {renderItem ? renderItem(option) : option.label}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
