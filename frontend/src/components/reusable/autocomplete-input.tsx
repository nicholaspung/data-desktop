import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  wider = true,
  maxDropdownHeight = 300,
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
  wider?: boolean;
  maxDropdownHeight?: number;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [finalOptions, setFinalOptions] = useState<
    (SelectOption & { [key: string]: unknown })[]
  >([]);

  const virtualizer = useVirtualizer({
    count: finalOptions.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 40,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 40,
  });

  useEffect(() => {
    const recentOptions = showRecentOptions
      ? [...options]
          .sort((a, b) => {
            if (
              a.entry &&
              b.entry &&
              (a.entry as any)?.lastModified &&
              (b.entry as any)?.lastModified
            ) {
              return (
                new Date((b.entry as any).lastModified).getTime() -
                new Date((a.entry as any).lastModified).getTime()
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
      ).sort((a, b) => a.label.localeCompare(b.label));
    } else if (showSuggestions && !showRecentOptions) {
      // Show all options when dropdown is opened and showRecentOptions is false
      filteredOptions = [...options].sort((a, b) => a.label.localeCompare(b.label));
    }

    setFinalOptions(filteredOptions);
  }, [
    options,
    value,
    continueProvidingSuggestions,
    maxRecentOptions,
    showRecentOptions,
    showSuggestions,
  ]);

  useEffect(() => {
    optionRefs.current = finalOptions.map(() => null);
  }, [finalOptions]);


  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current && usePortal) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect(rect);
    }
  }, [usePortal]);

  useEffect(() => {
    if (!showSuggestions || !usePortal || !inputRef.current) return;

    const input = inputRef.current;
    let animationFrameId: number;

    const throttledUpdate = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(updateDropdownPosition);
    };

    const resizeObserver = new ResizeObserver(throttledUpdate);
    resizeObserver.observe(input);

    const mutationObserver = new MutationObserver(throttledUpdate);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const handleScroll = throttledUpdate;
    const handleResize = throttledUpdate;

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [showSuggestions, usePortal, updateDropdownPosition]);

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
    if (activeIndex >= 0 && activeIndex < finalOptions.length && finalOptions.length > 0) {
      virtualizer.scrollToIndex(activeIndex, {
        align: "auto",
      });
    }
  }, [activeIndex, virtualizer, finalOptions.length]);

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

  const getDropdownStyle = (): React.CSSProperties => {
    if (!dropdownRect) return {};

    const top =
      dropdownPosition === "top"
        ? dropdownRect.top - 8
        : dropdownRect.bottom + 4;

    return {
      position: "fixed",
      top: dropdownPosition === "top" ? "auto" : top,
      bottom:
        dropdownPosition === "top"
          ? window.innerHeight - dropdownRect.top + 4
          : "auto",
      left: dropdownRect.left,
      width: wider ? dropdownRect.width : undefined,
      minWidth: dropdownRect.width,
      zIndex: 9999,
    };
  };

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
            className={cn(
              "bg-popover border rounded-md shadow-md overflow-hidden pointer-events-auto",
              wider
                ? "w-full min-w-[300px]"
                : "min-w-[200px] w-max max-w-[500px]"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-1 text-xs text-muted-foreground border-b">
              {value.length > 0 ? "Search results" : "Recent entries"}
            </div>
            <div
              ref={listRef}
              className="overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
              style={{ 
                height: Math.min(finalOptions.length * 40, maxDropdownHeight) + "px",
                maxHeight: maxDropdownHeight + "px"
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const option = finalOptions[virtualItem.index];
                  return (
                    <div
                      key={option.id}
                      data-index={virtualItem.index}
                      ref={(el) => virtualizer.measureElement(el)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer flex items-center min-h-[40px]",
                        activeIndex === virtualItem.index
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => handleSelect(option), 0);
                      }}
                      onMouseEnter={() => setActiveIndex(virtualItem.index)}
                    >
                      {renderItem ? (
                        renderItem(option, activeIndex === virtualItem.index)
                      ) : (
                        <div className="flex flex-row items-center gap-2 w-full">
                          <span className="flex-1 truncate">
                            {option.label}
                          </span>
                          {option.label.toLowerCase() ===
                            value.toLowerCase() && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {finalOptions.length === 0 && value.length > 0 && (
          <div
            style={getDropdownStyle()}
            className={cn(
              "bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground pointer-events-auto",
              wider
                ? "w-full min-w-[300px]"
                : "w-max max-w-[500px]"
            )}
          >
            {emptyMessage}
          </div>
        )}
      </>
    );

    return createPortal(dropdownContent, document.body);
  };

  const renderInlineDropdown = () => {
    if (!showSuggestions || usePortal) return null;

    return (
      <>
        {finalOptions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute left-0 z-50 bg-popover border rounded-md shadow-md overflow-hidden",
              wider
                ? "w-full min-w-[300px]"
                : "min-w-full w-max max-w-[500px]",
              dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-1 text-xs text-muted-foreground border-b">
              {value.length > 0 ? "Search results" : "Recent entries"}
            </div>
            <div
              ref={listRef}
              className="overflow-y-auto overflow-x-hidden py-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
              style={{ 
                height: Math.min(finalOptions.length * 40, maxDropdownHeight) + "px",
                maxHeight: maxDropdownHeight + "px"
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const option = finalOptions[virtualItem.index];
                  return (
                    <div
                      key={option.id}
                      data-index={virtualItem.index}
                      ref={(el) => virtualizer.measureElement(el)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer flex items-center min-h-[40px]",
                        activeIndex === virtualItem.index
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => handleSelect(option), 0);
                      }}
                      onMouseEnter={() => setActiveIndex(virtualItem.index)}
                    >
                      {renderItem ? (
                        renderItem(option, activeIndex === virtualItem.index)
                      ) : (
                        <div className="flex flex-row items-center gap-2 w-full">
                          <span className="flex-1 truncate">
                            {option.label}
                          </span>
                          {option.label.toLowerCase() ===
                            value.toLowerCase() && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {finalOptions.length === 0 && value.length > 0 && (
          <div
            className={cn(
              "absolute left-0 z-50 bg-popover border rounded-md shadow-md p-3 text-center text-sm text-muted-foreground",
              wider
                ? "w-full min-w-[300px]"
                : "min-w-full w-max max-w-[500px]",
              dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {emptyMessage}
          </div>
        )}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Shift" && e.ctrlKey) {
      if (showSuggestions) {
        e.preventDefault();
        e.stopPropagation();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Escape") {
      if (showSuggestions) {
        e.preventDefault();
        e.stopPropagation();
        setShowSuggestions(false);
        setActiveIndex(-1);
        return;
      }
      onKeyDown?.(e);
      return;
    }

    if (!showSuggestions || finalOptions.length === 0) {
      onKeyDown?.(e);
      return;
    }

    if (e.key === "Enter" && e.altKey) {
      onKeyDown?.(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((prev) => {
          const nextIndex = prev < finalOptions.length - 1 ? prev + 1 : 0;
          return nextIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : finalOptions.length - 1;
          return nextIndex;
        });
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < finalOptions.length) {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(finalOptions[activeIndex]);
        }
        break;
      case "Tab":
        setShowSuggestions(false);
        setActiveIndex(-1);
        onKeyDown?.(e);
        break;
      default:
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
