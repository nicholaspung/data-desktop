// src/components/common/confirm-delete-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

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
  size = "icon",
  loading = false,
  showTrigger = true,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          {trigger || (
            <Button
              variant={variant}
              size={triggerText ? "default" : size}
              disabled={loading}
            >
              {triggerText ? triggerText : ""}
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
