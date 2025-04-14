// src/components/security/pin-entry-dialog.tsx
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, UnlockKeyhole } from "lucide-react";
import { usePin } from "@/hooks/usePin";

export function PinEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { unlock } = usePin();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is fully rendered
      const timeout = setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timeout);
    } else {
      // Reset state when dialog closes
      setPin("");
      setIsSubmitting(false);
    }
  }, [open]);

  // Handle PIN submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length < 4) return;

    setIsSubmitting(true);

    try {
      const success = await unlock(pin);

      if (success) {
        setPin("");

        // Important: Set state first, then close dialog
        // This prevents race conditions and focus issues
        setIsSubmitting(false);

        // Use setTimeout to ensure state is updated before dialog closes
        setTimeout(() => {
          onOpenChange(false);

          // Another small delay before calling success callback
          if (onSuccess) {
            setTimeout(onSuccess, 50);
          }
        }, 50);
      } else {
        setAttempt(attempt + 1);
        setPin("");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error during PIN unlock:", error);
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during submission
    if (isSubmitting && !newOpen) return;

    // Otherwise, propagate the change
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[350px]"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside while submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Enter PIN
          </DialogTitle>
          <DialogDescription>
            Enter your PIN to unlock protected data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              ref={pinInputRef}
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter your PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-xl tracking-widest"
              autoComplete="off"
              minLength={4}
              disabled={isSubmitting}
            />
          </div>

          {attempt > 0 && (
            <p className="text-sm text-destructive">
              Incorrect PIN. Please try again.
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={pin.length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UnlockKeyhole className="h-4 w-4 mr-2" />
              )}
              Unlock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
