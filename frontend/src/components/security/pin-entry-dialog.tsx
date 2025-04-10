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

interface PinEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PinEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: PinEntryDialogProps) {
  const { unlock, openPinResetDialog } = usePin();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is fully rendered
      const timeout = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeout);
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
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setAttempt(attempt + 1);
        setPin("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PIN reset
  const handleResetPin = () => {
    onOpenChange(false);
    openPinResetDialog();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
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
              autoFocus
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

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={handleResetPin}
              disabled={isSubmitting}
            >
              Forgot PIN?
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
