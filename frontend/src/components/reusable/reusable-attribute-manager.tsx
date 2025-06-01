import { useState } from "react";
import { Store, useStore } from "@tanstack/react-store";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import FieldsManager from "@/components/reusable/fields-manager";
import ReusableCard from "@/components/reusable/reusable-card";
import { AttributeState } from "@/store/attribute-store-factory";
import { DynamicField } from "@/types/types";

interface AttributeManagerProps {
  title: string;
  store: Store<AttributeState>;
  successMessage?: string;
  errorMessage?: string;
  requiredLabel?: string;
}

export default function ReusableAttributeManager({
  title,
  store,
  successMessage = "Attributes saved successfully",
  errorMessage = "Failed to save attributes",
  requiredLabel,
}: AttributeManagerProps) {
  const attributes = useStore(store, (state) => state.attributes);
  const addAttribute = useStore(store, (state) => state.addAttribute);
  const updateAttribute = useStore(store, (state) => state.updateAttribute);
  const deleteAttribute = useStore(store, (state) => state.deleteAttribute);

  const [fields, setFields] = useState<DynamicField[]>(attributes || []);

  const handleSaveAttributes = () => {
    try {
      const existingIds = new Set(attributes.map((attr) => attr.id));

      const newIds = new Set(fields.map((field) => field.id));

      fields.forEach((field) => {
        if (!existingIds.has(field.id)) {
          addAttribute(field);
        } else {
          updateAttribute(field.id, field);
        }
      });

      attributes.forEach((attr) => {
        if (!newIds.has(attr.id)) {
          deleteAttribute(attr.id);
        }
      });

      toast.success(successMessage);
    } catch (error) {
      console.error(errorMessage + ":", error);
      toast.error(errorMessage);
    }
  };

  return (
    <ReusableCard
      title={title}
      content={
        <div className="space-y-6">
          <FieldsManager onUpdate={setFields} initialFields={attributes} requiredLabel={requiredLabel} />

          <Button onClick={handleSaveAttributes} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Attributes
          </Button>
        </div>
      }
    />
  );
}
