import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { DynamicField } from "@/types/types";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { cn } from "@/lib/utils";

interface AttributeAutocompleteProps {
  field: DynamicField;
  value: string | number;
  onChange: (value: string | number) => void;
  datasetKey: string;
  fieldId: string;
  className?: string;
}

export default function AttributeAutocomplete({
  field,
  value,
  onChange,
  datasetKey,
  fieldId,
  className,
}: AttributeAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<(string | number)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  const datasetData = useStore(dataStore, (state) => state[datasetKey as keyof typeof state] || []);

  useEffect(() => {
    const getUniqueValues = () => {
      const uniqueValues = new Set<string | number>();

      datasetData.forEach((item: any) => {
        if (!item.attributes) return;

        const attribute = item.attributes.find(
          (attr: any) => attr.fieldId === fieldId
        );
        if (
          attribute &&
          (typeof attribute.value === "string" ||
            typeof attribute.value === "number") &&
          attribute.value !== value
        ) {
          uniqueValues.add(attribute.value);
        }
      });

      return Array.from(uniqueValues);
    };

    setSuggestions(getUniqueValues());
  }, [fieldId, datasetData, value]);

  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.toString().toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    if (selectedIndex >= filteredSuggestions.length) {
      setSelectedIndex(-1);
    }
  }, [filteredSuggestions.length, selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(e.target as Node) &&
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

  const handleSelectSuggestion = (suggestion: string | number) => {
    setInputValue(suggestion.toString());
    onChange(
      field.type === "number" ? Number(suggestion) : suggestion.toString()
    );
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (field.type === "number") {
      const numberValue = newValue === "" ? 0 : Number(newValue);
      if (!isNaN(numberValue)) {
        onChange(numberValue);
      }
    } else {
      onChange(newValue);
    }

    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type={field.type === "number" ? "number" : "text"}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder={field.placeholder || `Enter ${field.name}...`}
        className={className}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={commandRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md"
        >
          <Command>
            <CommandGroup heading="Suggestions">
              {filteredSuggestions.map((suggestion, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => handleSelectSuggestion(suggestion)}
                  className={cn(
                    "cursor-pointer",
                    index === selectedIndex &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  {suggestion.toString()}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
}
