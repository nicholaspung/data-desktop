// src/components/security/pin-setup-dialog.tsx
import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
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

  const handleSubmit = async () => {
    setError(null);

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
        resetForm();
        setTimeout(() => onOpenChange(false), 50);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error setting up PIN:", error);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPin("");
    setConfirmPin("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return;
    if (!isConfigured) {
      onOpenChange(newOpen);
      return;
    }
    if (!isConfigured && !newOpen && open) return;

    if (!newOpen) {
      resetForm();
    }

    onOpenChange(newOpen);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={false}
      title={isConfigured ? "Update Security Settings" : "Set Up Security"}
      description="Create a PIN to protect your private data. You'll also need a recovery password in case you forget your PIN."
      confirmText={isConfigured ? "Update Security" : "Set Up Security"}
      confirmIcon={<Shield className="h-4 w-4" />}
      onConfirm={handleSubmit}
      footerActionDisabled={isSubmitting}
      footerActionLoadingText={isConfigured ? "Updating..." : "Setting up..."}
      loading={isSubmitting}
      contentClassName="sm:max-w-[425px]"
      showXIcon={true}
      customContent={
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

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
        </form>
      }
    />
  );
}
