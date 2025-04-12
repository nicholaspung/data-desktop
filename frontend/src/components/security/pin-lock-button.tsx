// src/components/security/pin-lock-button.tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, Unlock, Shield, Settings, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePin } from "@/hooks/usePin";

/**
 * A button that shows the current lock state and allows interactions
 * with the PIN security system
 */
export function PinLockButton({
  variant = "outline",
  size = "icon",
  showLabel = false,
  className,
}: {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}) {
  const {
    isConfigured,
    isUnlocked,
    unlockTimeRemaining,
    lock,
    openPinEntryDialog,
    openPinSetupDialog,
    openPinResetDialog,
  } = usePin();

  // Handle unlock/lock button click
  const handleLockToggle = () => {
    if (isUnlocked) {
      lock();
    } else {
      openPinEntryDialog();
    }
  };

  // If security is not configured, show setup button
  if (!isConfigured) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={openPinSetupDialog}
        title="Set up security"
      >
        <Shield className="h-4 w-4" />
        {showLabel && <span className="ml-2">Set Up PIN</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2">
          {/* Countdown timer (only shown when unlocked) */}
          {isUnlocked && unlockTimeRemaining > 0 && (
            <div className="text-xs font-medium bg-primary/10 rounded px-2 py-1">
              {unlockTimeRemaining}s
            </div>
          )}

          <Button
            variant={variant}
            size={size}
            className={cn(className, "relative")}
            title={isUnlocked ? "Lock private data" : "Unlock private data"}
          >
            {/* Status dot indicator */}
            {isUnlocked && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
            )}

            {isUnlocked ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}

            {showLabel && (
              <span className="ml-2">{isUnlocked ? "Unlocked" : "Locked"}</span>
            )}
          </Button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Data Protection</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleLockToggle}>
          {isUnlocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Lock Private Data
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Private Data
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isUnlocked && (
          <DropdownMenuItem onClick={openPinSetupDialog}>
            <Settings className="h-4 w-4 mr-2" />
            Security Settings
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={openPinResetDialog}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reset PIN
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
