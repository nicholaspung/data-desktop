import React, { useState } from "react";
import { ChevronDown, Info, AlertTriangle, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ReusableCard from "@/components/reusable/reusable-card";
import ReactMarkdown from "react-markdown";

type InfoPanelVariant = "info" | "tip" | "warning";

interface InfoPanelProps {
  title?: string;
  children: React.ReactNode;
  variant?: InfoPanelVariant;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  storageKey?: string;
}

export function InfoPanel({
  title,
  children,
  variant = "info",
  collapsible = true,
  defaultExpanded = true,
  className,
  contentClassName,
  iconClassName,
  storageKey,
}: InfoPanelProps) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const [storageExpanded, setStorageExpanded] = useInfoPanelState(
    storageKey || "temp",
    defaultExpanded
  );

  const expanded = storageKey ? storageExpanded : localExpanded;
  const setExpanded = storageKey ? setStorageExpanded : setLocalExpanded;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const variantStyles: Record<InfoPanelVariant, string> = {
    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    tip: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning:
      "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  };

  const variantIcons: Record<InfoPanelVariant, React.ReactNode> = {
    info: <Info className={cn("h-5 w-5 text-blue-500", iconClassName)} />,
    tip: (
      <LightbulbIcon className={cn("h-5 w-5 text-green-500", iconClassName)} />
    ),
    warning: (
      <AlertTriangle className={cn("h-5 w-5 text-amber-500", iconClassName)} />
    ),
  };

  return (
    <ReusableCard
      cardClassName={cn("border-l-4", variantStyles[variant], className)}
      contentClassName={cn(contentClassName, "pt-4")}
      showHeader={false}
      content={
        <>
          <div
            className={cn(
              "flex flex-row items-center justify-between mb-2",
              collapsible && "cursor-pointer"
            )}
            onClick={collapsible ? toggleExpanded : undefined}
          >
            <div className="flex items-center space-x-2">
              {variantIcons[variant]}
              <h3 className="text-base font-medium">
                {title || variant.charAt(0).toUpperCase() + variant.slice(1)}
              </h3>
            </div>
            {collapsible && (
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform",
                  expanded ? "transform rotate-180" : ""
                )}
              />
            )}
          </div>

          {/* Content area */}
          {expanded && (
            <div className="text-sm">
              {typeof children === "string" ? (
                <ReactMarkdown>{children}</ReactMarkdown>
              ) : (
                children
              )}
            </div>
          )}
        </>
      }
    />
  );
}

export function CompactInfoPanel({
  children,
  variant = "info",
  collapsible = true,
  defaultExpanded = false,
  title,
  className,
  contentClassName,
  storageKey,
}: InfoPanelProps) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const [storageExpanded, setStorageExpanded] = useInfoPanelState(
    storageKey ? `compact-${storageKey}` : "temp",
    defaultExpanded
  );

  const expanded = storageKey ? storageExpanded : localExpanded;
  const setExpanded = storageKey ? setStorageExpanded : setLocalExpanded;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const variantStyles: Record<
    InfoPanelVariant,
    { bg: string; icon: React.ReactNode }
  > = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      icon: <Info className="h-4 w-4 text-blue-500" />,
    },
    tip: {
      bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
      icon: <LightbulbIcon className="h-4 w-4 text-green-500" />,
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    },
  };

  return (
    <div
      className={cn(
        "rounded-md border text-sm",
        variantStyles[variant].bg,
        className
      )}
    >
      <div className="px-3 py-2">
        <div
          className={cn(
            "flex items-center justify-between",
            collapsible && "cursor-pointer"
          )}
          onClick={collapsible ? toggleExpanded : undefined}
        >
          <div className="flex items-center flex-1 gap-2">
            {variantStyles[variant].icon}
            <span className="font-medium">
              {title || variant.charAt(0).toUpperCase() + variant.slice(1)}
            </span>
          </div>
          {collapsible && (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded ? "transform rotate-180" : ""
              )}
            />
          )}
        </div>

        {expanded && (
          <div className={cn("mt-2", contentClassName)}>
            {typeof children === "string" ? (
              <ReactMarkdown>{children}</ReactMarkdown>
            ) : (
              children
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function useInfoPanelState(
  key: string,
  defaultExpanded = true
): [boolean, (value: boolean) => void] {
  const storageKey = `infopanel-${key}`;

  const [expanded, setExpandedState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : defaultExpanded;
    } catch (e) {
      console.error(e);
      return defaultExpanded;
    }
  });

  const setExpanded = (value: boolean) => {
    setExpandedState(value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save panel state to localStorage", e);
    }
  };

  return [expanded, setExpanded];
}
