// src/components/reusable/confirm-changes-dialog.tsx
import { Button } from "@/components/ui/button";
import { CircleX } from "lucide-react";
import ReusableDialog from "./reusable-dialog";

export function ConfirmChangesDialog({
  title = "Unsaved changes",
  description = "You have unsaved changes that will be lost. Do you want to continue?",
  onConfirm,
  onCancel,
  trigger,
  variant = "outline",
  size = "icon",
  loading = false,
  showTrigger = true,
  open = false,
  onOpenChange = () => {},
}: {
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  trigger?: React.ReactNode;
  variant?: "destructive" | "outline" | "ghost" | "link" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <ReusableDialog
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      showTrigger={showTrigger}
      trigger={
        trigger || (
          <Button variant={variant} size={size} disabled={loading}>
            <CircleX className="h-4 w-4" />
          </Button>
        )
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmText="Discard Changes"
    />
  );
}
