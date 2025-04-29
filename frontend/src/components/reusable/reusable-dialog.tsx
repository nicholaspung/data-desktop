import { ReactNode } from "react";
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
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  confirmIcon,
  footerActionDisabled,
  footerActionLoadingText,
  contentClassName,
  showXIcon = true,
  titleIcon,
}: {
  title?: string | ReactNode;
  description?: string | ReactNode;
  customContent?: ReactNode;
  onConfirm?:
    | (() => void)
    | ((e: React.MouseEvent<HTMLButtonElement>) => Promise<void>);
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
  confirmIcon?: ReactNode;
  footerActionDisabled?: boolean;
  footerActionLoadingText?: string;
  contentClassName?: string;
  showXIcon?: boolean;
  titleIcon?: ReactNode;
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
      <AlertDialogContent
        className={cn(
          "max-h-[90vh] flex flex-col", // Added max-height and flex column
          contentClassName ? contentClassName : "sm:max-w-[600px]"
        )}
      >
        <AlertDialogHeader>
          <div className="flex flex-row justify-between items-start">
            <AlertDialogTitle className="flex items-center gap-2">
              {titleIcon}
              {title}
            </AlertDialogTitle>
            {showXIcon && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onOpenChange && onOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
          {/* Always render AlertDialogDescription for accessibility */}
          <AlertDialogDescription className={!description ? "sr-only" : ""}>
            {description || title}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {customContent}

        {/* Standard or custom footer */}
        {customFooter ? (
          <div className="flex justify-end mt-4">{customFooter}</div>
        ) : (
          <AlertDialogFooter className="mt-4">
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
              disabled={footerActionDisabled}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {footerActionLoadingText
                    ? footerActionLoadingText
                    : "Saving..."}
                </>
              ) : (
                <>
                  {confirmIcon && <Save className="h-4 w-4 mr-2" />}
                  {confirmText}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
