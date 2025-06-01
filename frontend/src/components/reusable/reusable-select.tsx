import { Loader2 } from "lucide-react";
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
}) {
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
