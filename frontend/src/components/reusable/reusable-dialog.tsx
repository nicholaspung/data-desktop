// src/components/reusable/enhanced-dialog.tsx
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
import { ReactNode } from "react";

/**
 * An enhanced dialog component that supports custom content and footer
 *
 * @example
 * <ReusableDialog
 *   title="Custom Dialog"
 *   description="This dialog has custom content and footer."
 *   customContent={<div>My custom content here</div>}
 *   customFooter={<Button>Custom Action</Button>}
 *   triggerText="Open Dialog"
 * />
 */
export default function ReusableDialog({
  title = "Dialog",
  description,
  customContent,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  customFooter,
  trigger,
  triggerText,
  triggerIcon,
  variant = "outline",
  size = triggerText ? "default" : "icon",
  confirmVariant = "default",
  loading = false,
  showTrigger = true,
  open,
  onOpenChange,
}: {
  title?: string;
  description?: string;
  customContent?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  customFooter?: ReactNode;
  trigger?: ReactNode;
  triggerText?: string;
  triggerIcon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  confirmVariant?: "default" | "destructive" | "outline" | "ghost" | "link";
  loading?: boolean;
  showTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          {trigger || (
            <Button variant={variant} size={size} disabled={loading}>
              {triggerIcon}
              {triggerText && (
                <span className={triggerIcon ? "ml-2" : ""}>{triggerText}</span>
              )}
            </Button>
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* Custom content area */}
        {customContent}

        {/* Standard or custom footer */}
        {customFooter ? (
          <div className="flex justify-end">{customFooter}</div>
        ) : (
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={
                confirmVariant === "destructive"
                  ? "bg-destructive text-destructive-foreground"
                  : ""
              }
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
