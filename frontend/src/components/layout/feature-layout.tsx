// src/components/layout/feature-layout.tsx
import { ReactNode } from "react";
import { InfoPanel } from "@/components/reusable/info-panel";
import { FeatureGuide } from "@/components/reusable/feature-guide";
import { cn } from "@/lib/utils";

interface FeatureHeaderProps {
  title: string;
  description?: string;
  helpText?: string;
  helpVariant?: "info" | "tip" | "warning";
  guideContent?: {
    title: string;
    content: string;
  }[];
  storageKey: string;
  children?: ReactNode;
  className?: string;
}

/**
 * A reusable feature header component that includes title, description, and help panel
 */
export function FeatureHeader({
  title,
  description,
  helpText,
  helpVariant = "info",
  guideContent,
  storageKey,
  children,
  className,
}: FeatureHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {children}
          {guideContent && guideContent.length > 0 && (
            <FeatureGuide
              title={`${title} Guide`}
              description={`Learn how to use the ${title} features effectively`}
              sections={guideContent}
              storageKey={storageKey}
            />
          )}
        </div>
      </div>

      {helpText && (
        <InfoPanel variant={helpVariant} defaultExpanded={false}>
          {helpText}
        </InfoPanel>
      )}
    </div>
  );
}

interface FeatureLayoutProps {
  header: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
}

/**
 * A layout component that can include help information in a sidebar
 */
export function FeatureLayout({
  header,
  children,
  sidebar,
  sidebarPosition = "right",
  className,
}: FeatureLayoutProps) {
  return (
    <div className={cn("container mx-auto py-6", className)}>
      {header}

      <div className="flex flex-col lg:flex-row gap-6">
        {sidebarPosition === "left" && sidebar && (
          <div className="lg:w-1/4">{sidebar}</div>
        )}

        <div className={cn("flex-1", sidebar ? "lg:w-3/4" : "w-full")}>
          {children}
        </div>

        {sidebarPosition === "right" && sidebar && (
          <div className="lg:w-1/4">{sidebar}</div>
        )}
      </div>
    </div>
  );
}

/**
 * A sidebar component specifically for help content
 */
export function HelpSidebar({
  title = "Help & Tips",
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
