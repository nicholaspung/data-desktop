// frontend/src/routes/people-crm/people/$personId/edit.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Person, PersonInput } from "@/store/people-crm-definitions";
import { ApiService } from "@/services/api";
import { updateEntry } from "@/store/data-store";
import PersonForm from "@/features/people-crm/person-form";
import { toast } from "sonner";
import { ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface PersonParams {
  personId: string;
}

export const Route = createFileRoute("/people-crm/people/$personId/edit")({
  component: EditPerson,
});

function EditPerson() {
  const { personId } = Route.useParams() as PersonParams;
  const navigate = useNavigate();
  const people = useStore(dataStore, (state) => state.people);

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundPerson = people.find((p) => p.id === personId);
    if (foundPerson) {
      setPerson(foundPerson);
    } else {
      // Try to load from API if not in store
      ApiService.getRecord(personId).then((data) => {
        if (data) {
          setPerson(data as Person);
        }
      });
    }
  }, [personId, people]);

  const handleSubmit = async (data: PersonInput) => {
    setLoading(true);
    try {
      const updatedPerson = await ApiService.updateRecord(personId, data);
      if (updatedPerson) {
        updateEntry(personId, updatedPerson, "people");
        toast.success("Person updated successfully");
        navigate({ to: `/people-crm/people/${personId}` });
      }
    } catch (error) {
      console.error("Error updating person:", error);
      toast.error("Failed to update person");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/people-crm/people/${personId}` });
  };

  if (!person) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading person...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/people-crm/people/$personId`}
          params={{ personId: personId }}
        >
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Edit {person.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Update person information
          </p>
        </div>
      </div>

      {/* Form */}
      <PersonForm
        person={person}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
