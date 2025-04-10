// src/components/reusable/confirm-delete-dialog.tsx
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import ReusableDialog from "./reusable-dialog";

interface ConfirmDeleteDialogProps {
  title?: string;
  description?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
  triggerText?: string;
  variant?: "destructive" | "outline" | "ghost" | "link" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  showTrigger?: boolean;
}

/**
 * A reusable delete confirmation dialog
 *
 * @example
 * <ConfirmDeleteDialog
 *   title="Delete Record"
 *   description="Are you sure you want to delete this record? This action cannot be undone."
 *   onConfirm={() => handleDelete(record.id)}
 * />
 */
export function ConfirmDeleteDialog({
  title = "Confirm Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  trigger,
  triggerText,
  variant = "destructive",
  size = triggerText ? "default" : "icon",
  loading = false,
  showTrigger = true,
}: ConfirmDeleteDialogProps) {
  return (
    <ReusableDialog
      title={title}
      description={description}
      showTrigger={showTrigger}
      trigger={
        trigger || (
          <Button variant={variant} size={size} disabled={loading}>
            {triggerText ? triggerText : ""}
            <Trash className={triggerText ? "ml-2 h-4 w-4" : "h-4 w-4"} />
          </Button>
        )
      }
      onConfirm={onConfirm}
      confirmText="Delete"
    />
  );
}
