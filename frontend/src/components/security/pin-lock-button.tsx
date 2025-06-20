import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Lock,
  Unlock,
  Shield,
  Settings,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePin } from "@/hooks/usePin";
import { useState } from "react";

interface PinLockButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function PinLockButton({
  variant = "outline",
  size = "icon",
  showLabel = false,
  className,
}: PinLockButtonProps) {
  const {
    isConfigured,
    isUnlocked,
    unlockTimeRemaining,
    lock,
    extendTime,
    openPinEntryDialog,
    openPinSetupDialog,
    openPinResetDialog,
  } = usePin();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLockToggle = () => {
    if (isUnlocked) {
      lock();
    } else {
      openPinEntryDialog();
    }

    setIsMenuOpen(false);
  };

  const handlePinSetup = () => {
    openPinSetupDialog();
    setIsMenuOpen(false);
  };

  const handlePinReset = () => {
    openPinResetDialog();
    setIsMenuOpen(false);
  };

  const handleExtendTime = () => {
    extendTime();
    setIsMenuOpen(false);
  };

  if (!isConfigured) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("animate-sparkle", className)}
        onClick={openPinSetupDialog}
        title="Set up security"
      >
        <Shield className="h-4 w-4" />
        {showLabel && <span className="ml-2">Set Up PIN</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2">
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
        {isUnlocked && (
          <DropdownMenuItem onClick={handleExtendTime}>
            <Clock className="h-4 w-4 mr-2" />
            Extend Time (+1 min)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isUnlocked && (
          <DropdownMenuItem onClick={handlePinSetup}>
            <Settings className="h-4 w-4 mr-2" />
            Security Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handlePinReset}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reset PIN
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
