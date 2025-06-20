import { Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import AutocompleteInput from "./autocomplete-input";
import { SelectOption } from "@/types/types";
import { useState } from "react";

export default function ReusableSelect({
  options,
  value,
  onChange,
  isLoading,
  renderItem,
  placeholder,
  title,
  triggerClassName,
  disabled,
  noDefault = true,
  groupByKey = "group",
  useGroups = false,
  searchSelect = false,
  onCreateNew,
  createNewLabel = "Create new",
  label,
}: {
  options: any[];
  value: any;
  onChange: (value: string) => void;
  isLoading?: boolean;
  renderItem?: (option: any) => React.ReactNode;
  placeholder?: string;
  title?: string;
  triggerClassName?: string;
  disabled?: boolean;
  noDefault?: boolean;
  groupByKey?: string;
  useGroups?: boolean;
  searchSelect?: boolean;
  onCreateNew?: (value: string) => Promise<void> | void;
  createNewLabel?: string;
  label?: string;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Get the currently selected option for display
  const selectedOption = options.find(opt => opt.id === value);
  
  // Display logic: show search value when actively typing, otherwise show selected option name
  const displayValue = searchValue || (selectedOption ? selectedOption.label : "");
  
  // Create SelectOptions for AutocompleteInput
  const autocompleteOptions: SelectOption[] = options.map(option => ({
    id: option.id,
    label: option.label,
    ...option
  }));

  const handleCreateNew = async (newValue: string) => {
    if (!onCreateNew || !newValue.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateNew(newValue.trim());
      setSearchValue("");
    } catch (error) {
      console.error("Error creating new option:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAutocompleteSelect = (option: SelectOption) => {
    onChange(option.id);
    setSearchValue("");
  };

  const handleClearSelection = () => {
    onChange("");
    setSearchValue("");
  };

  const renderOptions = () => {
    if (!useGroups) {
      return options.map((option) => (
        <SelectItem key={option.id} value={option.id}>
          {renderItem ? renderItem(option) : option.label}
        </SelectItem>
      ));
    }

    const groupedOptions = options.reduce(
      (groups: Record<string, any[]>, option) => {
        const group = (option[groupByKey as keyof any] as string) || "Other";
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(option);
        return groups;
      },
      {}
    );

    return Object.entries(groupedOptions).map(
      ([group, groupOptions], groupIndex) => (
        <div key={group}>
          {groupIndex > 0 && <SelectSeparator />}
          <SelectGroup>
            <SelectLabel>{group}</SelectLabel>
            {groupOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {renderItem ? renderItem(option) : option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </div>
      )
    );
  };

  if (searchSelect) {
    // Enhanced options with create new option when applicable
    const enhancedOptions = [...autocompleteOptions];
    
    // Add "Create new" option if we have a search value and onCreateNew handler
    if (onCreateNew && searchValue.trim() && !enhancedOptions.some(opt => 
      opt.label.toLowerCase() === searchValue.toLowerCase().trim()
    )) {
      enhancedOptions.push({
        id: "__create_new__",
        label: `${createNewLabel}: "${searchValue.trim()}"`,
        isCreateNew: true
      });
    }

    return (
      <AutocompleteInput
        label={label}
        value={displayValue}
        onChange={(newValue) => {
          setSearchValue(newValue);
          // If user is typing and the current input doesn't match the selected option, clear selection
          if (selectedOption && newValue !== selectedOption.label) {
            onChange("");
          }
        }}
        onSelect={(option) => {
          if (option.isCreateNew) {
            handleCreateNew(searchValue);
          } else {
            handleAutocompleteSelect(option);
          }
        }}
        options={enhancedOptions}
        placeholder={placeholder || `Search or create ${title}...`}
        className={triggerClassName}
        disabled={disabled || isLoading || isCreating}
        emptyMessage="No options available."
        renderItem={(option, isActive) => {
          if (option.isCreateNew) {
            return (
              <div className="flex items-center gap-2 w-full text-primary">
                <Plus className="h-4 w-4" />
                <span>{option.label}</span>
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            );
          }
          
          return (
            <div className="flex items-center justify-between w-full">
              <span>{renderItem ? renderItem(option) : option.label}</span>
              {selectedOption?.id === option.id && (
                <span className="text-xs text-muted-foreground">Selected</span>
              )}
            </div>
          );
        }}
      />
    );
  }

  return (
    <Select
      disabled={disabled ? disabled : options.length === 0}
      value={value || ""}
      onValueChange={onChange}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue
          placeholder={
            placeholder
              ? placeholder
              : isLoading
                ? "Loading options..."
                : `Select ${title}`
          }
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <SelectItem value="_no_options_" disabled>
            No options available
          </SelectItem>
        ) : (
          <>
            {noDefault ? null : (
              <SelectItem value="_none_">Select...</SelectItem>
            )}
            {renderOptions()}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
