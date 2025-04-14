// src/components/security/pin-reset-dialog.tsx
import { useState } from "react";
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
import { Loader2, KeyRound, RefreshCcw } from "lucide-react";
import { usePin } from "@/hooks/usePin";

export function PinResetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { resetPin } = usePin();
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!password) {
      setError("Please enter your recovery password");
      return;
    }

    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    if (newPin !== confirmNewPin) {
      setError("PINs do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await resetPin(password, newPin);

      if (success) {
        // Reset form and close dialog
        setPassword("");
        setNewPin("");
        setConfirmNewPin("");

        // Use setTimeout to avoid race conditions with state updates
        setTimeout(() => onOpenChange(false), 50);
      } else {
        // Error is handled in the resetPin function with toast message
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during submission
    if (isSubmitting && !newOpen) return;

    // Reset form when dialog closes
    if (!newOpen) {
      setPassword("");
      setNewPin("");
      setConfirmNewPin("");
      setError(null);
    }

    // Propagate the change
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside while submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Your PIN
          </DialogTitle>
          <DialogDescription>
            Enter your recovery password to reset your PIN.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          {/* Recovery Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Recovery Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your recovery password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              This is the password you set up when you created your PIN
            </p>
          </div>

          {/* New PIN Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter new PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPin">Confirm PIN</Label>
              <Input
                id="confirmNewPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Confirm new PIN"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Reset PIN
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
