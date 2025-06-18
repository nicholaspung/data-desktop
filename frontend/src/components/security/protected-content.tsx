import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePin } from "@/hooks/usePin";

export function ProtectedContent({
  children,
  placeholder,
  className,
  blur = true,
}: {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  blur?: boolean;
}) {
  const { isConfigured, isUnlocked, openPinEntryDialog } = usePin();
  const [wasEverUnlocked, setWasEverUnlocked] = useState(false);
  const [childrenContent, setChildrenContent] = useState<ReactNode>(children);

  useEffect(() => {
    if (isUnlocked) {
      setWasEverUnlocked(true);
    }

    setChildrenContent(children);
  }, [isUnlocked, children]);

  if (!isConfigured) {
    return <div className={className}>{children}</div>;
  }

  if (isUnlocked) {
    return <div className={className}>{childrenContent}</div>;
  }

  const handleUnlock = () => {
    openPinEntryDialog();
  };

  const defaultPlaceholder = blur ? (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleUnlock}
        >
          <Lock className="h-4 w-4" />
          Unlock to View
        </Button>
      </div>

      <div
        className={cn(
          "select-none pointer-events-none",
          wasEverUnlocked ? "blur-sm opacity-25" : "opacity-0"
        )}
        aria-hidden="true"
      >
        {childrenContent}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">
        This content is protected
      </p>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleUnlock}
      >
        <Lock className="h-4 w-4" />
        Unlock to View
      </Button>
    </div>
  );

  return <div className={className}>{placeholder || defaultPlaceholder}</div>;
}

/**
 * A simpler component for protecting individual form fields or data points.
 * Shows a toggle button to reveal/hide the value after unlocking.
 */
export function ProtectedField({
  children,
  label = "Protected",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const { isConfigured, isUnlocked, openPinEntryDialog } = usePin();
  const [locallyVisible, setLocallyVisible] = useState(false);
  const [fieldContent, setFieldContent] = useState<ReactNode>(children);

  useEffect(() => {
    if (!isUnlocked) {
      setLocallyVisible(false);
    }

    setFieldContent(children);
  }, [isUnlocked, children]);

  if (!isConfigured) {
    return <div className={className}>{children}</div>;
  }

  const toggleVisibility = () => {
    if (isUnlocked) {
      setLocallyVisible(!locallyVisible);
    } else {
      openPinEntryDialog();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {locallyVisible && isUnlocked ? (
        <div className="flex items-center gap-2">
          <div className="transition-opacity duration-200">{fieldContent}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVisibility}
            className="h-6 w-6 flex-shrink-0"
            title="Hide value"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="bg-muted px-2 py-1 rounded text-muted-foreground text-sm">
            {label}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVisibility}
            className="h-6 w-6 flex-shrink-0"
            title={isUnlocked ? "Show value" : "Unlock to view"}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
