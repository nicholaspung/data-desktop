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
import { CircleX } from "lucide-react";

interface ConfirmChangesDialogProps {
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
}

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
}: ConfirmChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          {trigger || (
            <Button variant={variant} size={size} disabled={loading}>
              <CircleX className="h-4 w-4" />
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
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
