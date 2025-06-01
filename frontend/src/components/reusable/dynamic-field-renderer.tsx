import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DynamicField } from "@/types/types";
import ReusableSelect from "./reusable-select";
import ReusableMultiSelect from "./reusable-multiselect";

interface DynamicFieldRendererProps {
  field: DynamicField;
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  required = false,
  className,
  disabled = false,
}: DynamicFieldRendererProps) {
  switch (field.type) {
    case "text":
      return (
        <Input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || `Enter ${field.name}...`}
          required={required || field.required}
          className={className}
          disabled={disabled}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder || `Enter a number...`}
          required={required || field.required}
          className={className}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal ${className}`}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value
                ? format(new Date(value as string), "PPP")
                : field.placeholder || "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value as string) : undefined}
              onSelect={(date) => onChange(date?.toISOString())}
              required={required || field.required}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      );
    case "select-single":
      return (
        <ReusableSelect
          options={
            field.options
              ? field.options.map((opt) => ({
                  id: opt.value,
                  label: opt.label,
                }))
              : []
          }
          value={(value as string) || ""}
          onChange={(value) => onChange(value)}
          placeholder={field.placeholder || "Select an option"}
          title={field.name}
          disabled={disabled || !field.options?.length}
        />
      );
    case "select-multiple":
      return (
        <ReusableMultiSelect
          options={
            field.options
              ? field.options.map((opt) => ({
                  id: opt.value,
                  label: opt.label,
                }))
              : []
          }
          selected={(value as string[]) || []}
          onChange={(values) => onChange(values)}
          placeholder={field.placeholder || "Select options"}
          title={field.name}
          disabled={disabled || !field.options?.length}
          className={className}
        />
      );
    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
            id={`field-${field.id}`}
            disabled={disabled}
          />
          <Label
            htmlFor={`field-${field.id}`}
            className="text-sm font-normal cursor-pointer"
          >
            {value ? "Yes" : "No"}
          </Label>
        </div>
      );
    default:
      return null;
  }
}
