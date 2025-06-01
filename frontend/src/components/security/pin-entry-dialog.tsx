import { useState, useRef, useEffect } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnlockKeyhole } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
        }
      }, 100);

      return () => clearTimeout(timeout);
    } else {
      setPin("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (pin.length < 4) return;

    setIsSubmitting(true);

    try {
      const success = await unlock(pin);

      if (success) {
        setPin("");
        setIsSubmitting(false);
        setAttempt(0);

        setTimeout(() => {
          onOpenChange(false);

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

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      showTrigger={false}
      title="Enter PIN"
      description="Enter your PIN to unlock protected data"
      confirmText="Unlock"
      confirmIcon={<UnlockKeyhole className="h-4 w-4" />}
      onConfirm={handleSubmit}
      footerActionDisabled={pin.length < 4 || isSubmitting}
      footerActionLoadingText="Unlocking..."
      loading={isSubmitting}
      contentClassName="sm:max-w-[350px]"
      customContent={
        <div className="space-y-4">
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
        </div>
      }
    />
  );
}
