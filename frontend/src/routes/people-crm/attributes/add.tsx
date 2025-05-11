// frontend/src/routes/people-crm/attributes/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import PersonAttributeForm from "@/features/people-crm/attribute-form";
import { PersonAttributeInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AddAttributeSearch {
  personId?: string;
}

export const Route = createFileRoute("/people-crm/attributes/add")({
  validateSearch: (search): AddAttributeSearch => ({
    personId: search.personId as string | undefined,
  }),
  component: AddAttribute,
});

function AddAttribute() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PersonAttributeInput) => {
    setLoading(true);
    try {
      const newAttribute = await ApiService.addRecord(
        "person_attributes",
        data
      );
      if (newAttribute) {
        addEntry(newAttribute, "person_attributes");
        toast.success("Attribute added successfully");
        navigate({ to: `/people-crm/attributes/${newAttribute.id}` });
      }
    } catch (error) {
      console.error("Error adding attribute:", error);
      toast.error("Failed to add attribute");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/attributes" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/attributes">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Add Attribute
          </h1>
          <p className="text-muted-foreground mt-1">
            Record an attribute or fact about someone
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonAttributeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        defaultPersonId={search.personId}
      />
    </div>
  );
}
