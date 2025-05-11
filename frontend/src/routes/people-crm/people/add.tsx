// frontend/src/routes/people-crm/people/add.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import PersonForm from "@/features/people-crm/person-form";
import { PersonInput } from "@/store/people-crm-definitions";
import { toast } from "sonner";
import { ChevronLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/people-crm/people/add")({
  component: AddPerson,
});

function AddPerson() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PersonInput) => {
    setLoading(true);
    try {
      const newPerson = await ApiService.addRecord("people", data);
      if (newPerson) {
        addEntry(newPerson, "people");
        toast.success("Person added successfully");
        navigate({ to: `/people-crm/people/${newPerson.id}` });
      }
    } catch (error) {
      console.error("Error adding person:", error);
      toast.error("Failed to add person");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/people-crm/people" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/people-crm/people">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Add Person
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new person to your network
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
