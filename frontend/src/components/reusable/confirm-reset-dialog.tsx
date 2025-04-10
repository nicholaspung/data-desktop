// src/components/reusable/confirm-reset-dialog.tsx
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import ReusableDialog from "./reusable-dialog";

interface ConfirmResetDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
  variant?: "destructive" | "outline" | "ghost" | "link" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  showTrigger?: boolean;
}

export function ConfirmResetDialog({
  title = "Clear form data?",
  description = "This will reset all form fields and delete any saved data. This action cannot be undone.",
  onConfirm,
  trigger,
  variant = "outline",
  size = "default",
  loading = false,
  showTrigger = true,
}: ConfirmResetDialogProps) {
  return (
    <ReusableDialog
      title={title}
      description={description}
      showTrigger={showTrigger}
      trigger={
        trigger || (
          <Button variant={variant} size={size} disabled={loading}>
            <Trash className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )
      }
      onConfirm={onConfirm}
      confirmText="Clear"
    />
  );
}
