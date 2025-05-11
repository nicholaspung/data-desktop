// frontend/src/routes/people-crm/edit-person.tsx
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

interface EditPersonProps {
  personId: string;
  onBack: () => void;
}

export default function EditPerson({ personId, onBack }: EditPersonProps) {
  const people = useStore(dataStore, (state) => state.people);

  const [person, setPerson] = useState<Person | null>(null);

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
    try {
      const updatedPerson = await ApiService.updateRecord(personId, data);
      if (updatedPerson) {
        updateEntry(personId, updatedPerson, "people");
        toast.success("Person updated successfully");
        onBack();
      }
    } catch (error) {
      console.error("Error updating person:", error);
      toast.error("Failed to update person");
    }
  };

  const handleCancel = () => {
    onBack();
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
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
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
      />
    </div>
  );
}
