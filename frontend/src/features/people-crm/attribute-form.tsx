import DataForm from "@/components/data-form/data-form";
import { PERSON_ATTRIBUTES_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";

export default function PersonAttributeForm({
  attribute,
  onSubmit,
  onCancel,
  defaultPersonId,
}: {
  attribute?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  defaultPersonId?: string;
}) {
  const initialValues = attribute
    ? {
        person_id: attribute.person_id,
        attribute_name: attribute.attribute_name || "",
        attribute_value: attribute.attribute_value || "",
        category: attribute.category || "other",
        learned_date: attribute.learned_date
          ? new Date(attribute.learned_date)
          : undefined,
        notes: attribute.notes || "",
        source: attribute.source || "",
        private: attribute.private || false,
      }
    : {
        person_id: defaultPersonId || "",
      };

  return (
    <DataForm
      datasetId="person_attributes"
      fields={PERSON_ATTRIBUTES_FIELD_DEFINITIONS.fields}
      onSuccess={() => onSubmit({})}
      onCancel={onCancel}
      initialValues={initialValues}
      submitLabel={attribute ? "Update Attribute" : "Add Attribute"}
      successMessage={
        attribute
          ? "Attribute updated successfully"
          : "Attribute added successfully"
      }
      mode={attribute ? "edit" : "add"}
      recordId={attribute?.id}
    />
  );
}
