// frontend/src/routes/people-crm/attributes/$attributeId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import {
  PersonAttribute,
  PersonAttributeInput,
} from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import PersonAttributeForm from "@/features/people-crm/attribute-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AttributeParams {
  attributeId: string;
}

export const Route = createFileRoute(
  "/people-crm/attributes/$attributeId/edit"
)({
  component: EditAttribute,
});

function EditAttribute() {
  const { attributeId } = Route.useParams() as AttributeParams;
  const navigate = useNavigate();
  const attributes = useStore(dataStore, (state) => state.person_attributes);

  const [attribute, setAttribute] = useState<PersonAttribute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundAttribute = attributes.find((a) => a.id === attributeId);
    if (foundAttribute) {
      setAttribute(foundAttribute);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(attributeId).then((data) => {
        if (data) {
          setAttribute(data as PersonAttribute);
        }
      });
    }
  }, [attributeId, attributes]);

  const handleSubmit = async (data: PersonAttributeInput) => {
    setLoading(true);
    try {
      const updatedAttribute = await ApiService.updateRecord(attributeId, data);
      if (updatedAttribute) {
        updateEntry(attributeId, updatedAttribute, "person_attributes");
        toast.success("Attribute updated successfully");
        navigate({ to: `/people-crm/attributes/${attributeId}` });
      }
    } catch (error) {
      console.error("Error updating attribute:", error);
      toast.error("Failed to update attribute");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/attributes/${attributeId}` });
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
        <Link
          to={`/people-crm/attributes/$attributeId`}
          params={{ attributeId: attributeId }}
        >
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
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
        loading={loading}
      />
    </div>
  );
}
