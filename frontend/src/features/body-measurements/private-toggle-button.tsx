import { Button } from "@/components/ui/button";
import { Lock, LockOpen } from "lucide-react";
import { usePin } from "@/hooks/usePin";

interface PrivateToggleButtonProps {
  showPrivate: boolean;
  onToggle: (showPrivate: boolean) => void;
}

export default function PrivateToggleButton({
  showPrivate,
  onToggle,
}: PrivateToggleButtonProps) {
  const { isConfigured, isUnlocked, openPinEntryDialog } = usePin();

  const handleToggle = () => {
    if (!isConfigured) {
      // If PIN is not configured, just toggle (no privacy protection)
      onToggle(!showPrivate);
      return;
    }

    if (!showPrivate) {
      // User wants to view private data
      if (isUnlocked) {
        onToggle(true);
      } else {
        openPinEntryDialog();
      }
    } else {
      // User wants to hide private data
      onToggle(false);
    }
  };

  // Don't show the button if PIN is configured but user hasn't unlocked yet and trying to show private
  if (isConfigured && !isUnlocked && showPrivate) {
    onToggle(false); // Auto-hide private data if PIN gets locked
  }

  return (
    <Button
      variant={showPrivate ? "default" : "outline"}
      className="gap-2"
      onClick={handleToggle}
      title={
        showPrivate
          ? "Hide private measurements"
          : isConfigured
          ? "Show private measurements (requires PIN)"
          : "Show private measurements"
      }
    >
      {showPrivate ? (
        <>
          <LockOpen className="h-4 w-4" />
          Hide Private
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Show Private
        </>
      )}
    </Button>
  );
}