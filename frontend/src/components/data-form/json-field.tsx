import { FieldDefinition } from "@/types/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Control } from "react-hook-form";
import { JsonEditCell } from "../data-table/json-edit-cell";

interface FormJsonFieldProps {
  field: FieldDefinition;
  control: Control<any>;
}

export function FormJsonField({ field, control }: FormJsonFieldProps) {
  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formHookField }) => (
        <JsonFieldContent
          formHookField={formHookField}
          fieldDefinition={field}
        />
      )}
    />
  );
}

function JsonFieldContent({
  formHookField,
  fieldDefinition,
}: {
  formHookField: {
    name: string;
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    ref: React.Ref<any>;
    disabled?: boolean;
  };
  fieldDefinition: FieldDefinition;
}) {
  return (
    <FormItem className="col-span-2">
      <FormLabel>
        {fieldDefinition.displayName}
        {fieldDefinition.isOptional ? null : (
          <span className="text-destructive ml-1">*</span>
        )}
      </FormLabel>
      {fieldDefinition.description && (
        <FormDescription>{fieldDefinition.description}</FormDescription>
      )}
      <FormControl>
        <JsonEditCell
          value={formHookField.value}
          onChange={formHookField.onChange}
          placeholder={`Enter valid JSON for ${fieldDefinition.displayName}...`}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
