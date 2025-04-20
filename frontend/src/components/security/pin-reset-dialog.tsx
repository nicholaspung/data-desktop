// src/components/security/pin-reset-dialog.tsx
import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCcw } from "lucide-react";
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

  const handleSubmit = async () => {
    setError(null);

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
        setPassword("");
        setNewPin("");
        setConfirmNewPin("");
        setTimeout(() => onOpenChange(false), 50);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return;

    if (!newOpen) {
      setPassword("");
      setNewPin("");
      setConfirmNewPin("");
      setError(null);
    }

    onOpenChange(newOpen);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      showTrigger={false}
      title="Reset Your PIN"
      description="Enter your recovery password to reset your PIN."
      confirmText="Reset PIN"
      confirmIcon={<RefreshCcw className="h-4 w-4" />}
      onConfirm={handleSubmit}
      footerActionDisabled={isSubmitting}
      footerActionLoadingText="Resetting..."
      loading={isSubmitting}
      contentClassName="sm:max-w-[425px]"
      customContent={
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

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
        </form>
      }
    />
  );
}
