// frontend/src/features/people-crm/add-attribute-button.tsx
import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import PersonAttributeForm from "./attribute-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonAttribute } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

interface AddAttributeButtonProps {
  existingAttribute?: PersonAttribute;
  defaultPersonId?: string;
  onSuccess?: () => void;
}

export default function AddAttributeButton({
  existingAttribute,
  defaultPersonId,
  onSuccess,
}: AddAttributeButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingAttribute;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Attribute" : "Add New Attribute"}
      description={
        isEditMode
          ? "Update attribute details."
          : "Record an attribute or fact about someone."
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
            Add Attribute
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <PersonAttributeForm
              attribute={existingAttribute}
              defaultPersonId={defaultPersonId}
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
