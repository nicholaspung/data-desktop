import DataForm from "@/components/data-form/data-form";
import { PEOPLE_FIELD_DEFINITIONS } from "@/features/field-definitions/people-crm-definitions";

interface PersonFormProps {
  person?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function PersonForm({
  person,
  onSubmit,
  onCancel,
}: PersonFormProps) {
  const initialValues = person
    ? {
        name: person.name,
        birthday: person.birthday ? new Date(person.birthday) : undefined,
        address: person.address || "",
        employment_history: person.employment_history || "",
        tags: person.tags || "",
        first_met_date: person.first_met_date
          ? new Date(person.first_met_date)
          : undefined,
        private: person.private || false,
      }
    : {};

  return (
    <DataForm
      datasetId="people"
      fields={PEOPLE_FIELD_DEFINITIONS.fields}
      onSuccess={() => onSubmit({})}
      onCancel={onCancel}
      initialValues={initialValues}
      submitLabel={person ? "Update Person" : "Add Person"}
      successMessage={
        person ? "Person updated successfully" : "Person added successfully"
      }
      mode={person ? "edit" : "add"}
      recordId={person?.id}
    />
  );
}
