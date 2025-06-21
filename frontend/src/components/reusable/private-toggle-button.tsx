import { Button } from "@/components/ui/button";
import { Lock, LockOpen } from "lucide-react";
import { usePin } from "@/hooks/usePin";
import { useEffect, useRef } from "react";

interface PrivateToggleButtonProps {
  showPrivate: boolean;
  onToggle: (showPrivate: boolean) => void;
}

export default function PrivateToggleButton({
  showPrivate,
  onToggle,
}: PrivateToggleButtonProps) {
  const { isConfigured, isUnlocked, openPinEntryDialog } = usePin();
  const wasUnlockedRef = useRef(isUnlocked);

  useEffect(() => {
    if (isConfigured && !wasUnlockedRef.current && isUnlocked && !showPrivate) {
      onToggle(true);
    }
    wasUnlockedRef.current = isUnlocked;
  }, [isUnlocked, isConfigured, showPrivate, onToggle]);

  useEffect(() => {
    if (isConfigured && !isUnlocked && showPrivate) {
      onToggle(false);
    }
  }, [isConfigured, isUnlocked, showPrivate, onToggle]);

  const handleToggle = () => {
    if (!isConfigured) {
      onToggle(!showPrivate);
      return;
    }

    if (!showPrivate) {
      if (isUnlocked) {
        onToggle(true);
      } else {
        openPinEntryDialog();
      }
    } else {
      onToggle(false);
    }
  };

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
