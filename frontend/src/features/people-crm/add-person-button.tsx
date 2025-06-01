import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import PersonForm from "./person-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Person } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

interface AddPersonButtonProps {
  existingPerson?: Person;
  onSuccess?: () => void;
}

export default function AddPersonButton({
  existingPerson,
  onSuccess,
}: AddPersonButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingPerson;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Person" : "Add New Person"}
      description={
        isEditMode
          ? "Update person details."
          : "Add a new person to your network."
      }
      open={open}
      onOpenChange={setOpen}
      trigger={
        isEditMode ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Person
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <PersonForm
              person={existingPerson}
              onSubmit={async () => {
                setOpen(false);
                onSuccess?.();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      }
      customFooter={<></>}
    />
  );
}
