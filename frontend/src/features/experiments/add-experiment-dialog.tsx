import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddExperimentForm from "./add-experiment-form";

export default function AddExperimentDialog({
  buttonLabel = "Create New Experiment",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  onSuccess,
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
          </DialogHeader>

          <AddExperimentForm
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
