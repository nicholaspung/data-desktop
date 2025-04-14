// src/components/security/pin-setup-dialog.tsx
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
import { Loader2, Shield } from "lucide-react";
import { usePin } from "@/hooks/usePin";

export function PinSetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setupPin, isConfigured } = usePin();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await setupPin(pin, password);

      if (success) {
        // Reset form and close dialog
        resetForm();

        // Use setTimeout to avoid race conditions with state updates
        setTimeout(() => onOpenChange(false), 50);
      } else {
        // Error is handled in the setupPin function with toast message
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error setting up PIN:", error);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Reset form values
  const resetForm = () => {
    setPin("");
    setConfirmPin("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during submission
    if (isSubmitting && !newOpen) return;

    // Prevent closing the dialog if PIN is not configured and we're trying to close
    if (!isConfigured && !newOpen && open) {
      return;
    }

    // Reset form when dialog closes
    if (!newOpen) {
      resetForm();
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

          // Also prevent closing if PIN is not configured yet
          if (!isConfigured) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isConfigured ? "Update Security Settings" : "Set Up Security"}
          </DialogTitle>
          <DialogDescription>
            Create a PIN to protect your private data. You'll also need a
            recovery password in case you forget your PIN.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          {/* PIN Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Recovery Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            The recovery password will be used to reset your PIN if you forget
            it. Make sure to remember this password.
          </p>

          <DialogFooter>
            {isConfigured && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isConfigured ? "Update Security" : "Set Up Security"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
