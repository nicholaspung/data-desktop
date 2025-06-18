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
  triggerClassName,
  disableDefaultConfirm = false,
  fixedFooter = false,
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
  triggerClassName?: string;
  disableDefaultConfirm?: boolean;
  fixedFooter?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          {trigger || (
            <Button
              variant={variant}
              size={size}
              disabled={loading}
              className={triggerClassName}
            >
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
          "max-h-[90vh] flex flex-col p-0",
          contentClassName ? contentClassName : "sm:max-w-[600px]"
        )}
      >
        <AlertDialogHeader className="px-6 pt-6">
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onCancel) {
                    onCancel();
                  }
                  onOpenChange?.(false);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>

          <AlertDialogDescription className={!description ? "sr-only" : ""}>
            {description || title}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div
          className={cn(
            "flex-1 overflow-y-auto",
            fixedFooter ? "px-6 pb-4" : "px-6"
          )}
        >
          {customContent}
        </div>

        {fixedFooter ? (
          <>
            {(customFooter !== undefined || onConfirm !== undefined) && (
              <div className="border-t px-6 py-4 bg-background">
                {customFooter !== undefined ? (
                  <div className="flex justify-end">{customFooter}</div>
                ) : onConfirm ? (
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                      {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        if (disableDefaultConfirm) {
                          e.preventDefault();
                        }
                        if (onConfirm) {
                          onConfirm(e);
                        }
                      }}
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
                ) : null}
              </div>
            )}
          </>
        ) : (
          <>
            {customFooter !== undefined ? (
              <div className="flex justify-end px-6 pb-6 pt-4">
                {customFooter}
              </div>
            ) : onConfirm ? (
              <AlertDialogFooter className="px-6 pb-6 pt-4">
                <AlertDialogCancel onClick={onCancel}>
                  {cancelText}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    if (disableDefaultConfirm) {
                      e.preventDefault();
                    }
                    if (onConfirm) {
                      onConfirm(e);
                    }
                  }}
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
            ) : null}
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
