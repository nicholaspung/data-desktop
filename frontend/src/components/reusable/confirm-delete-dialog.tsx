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
  variant?: "destructive" | "outline" | "ghost" | "link" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
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
  variant = "destructive",
  size = "icon",
  loading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant={variant} size={size} disabled={loading}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
