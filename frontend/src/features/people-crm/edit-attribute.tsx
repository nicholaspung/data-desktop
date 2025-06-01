import { Button } from "@/components/ui/button";
import { ApiService } from "@/services/api";
import dataStore, { updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { ChevronLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PersonAttributeForm from "./attribute-form";
import { PersonAttribute } from "@/store/people-crm-definitions";

export function EditAttribute({
  attributeId,
  onBack,
}: {
  attributeId: string;
  onBack: () => void;
}) {
  const attributes = useStore(dataStore, (state) => state.person_attributes);

  const [attribute, setAttribute] = useState<PersonAttribute | null>(null);

  useEffect(() => {
    const foundAttribute = attributes.find((a) => a.id === attributeId);
    if (foundAttribute) {
      setAttribute(foundAttribute);
    }
  }, [attributeId, attributes]);

  interface HandleSubmitData {
    [key: string]: any;
  }

  const handleSubmit = async (data: HandleSubmitData): Promise<void> => {
    try {
      const updatedAttribute: PersonAttribute | null =
        await ApiService.updateRecord(attributeId, data);
      if (updatedAttribute) {
        updateEntry(attributeId, updatedAttribute, "person_attributes");
        toast.success("Attribute updated successfully");
        onBack();
      }
    } catch (error: unknown) {
      console.error("Error updating attribute:", error);
      toast.error("Failed to update attribute");
    }
  };

  const handleCancel = () => {
    onBack();
  };

  if (!attribute) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading attribute...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit Attribute
          </h1>
          <p className="text-muted-foreground mt-1">
            Update attribute for{" "}
            {attribute.person_id_data?.name || "this person"}
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonAttributeForm
        attribute={attribute}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
