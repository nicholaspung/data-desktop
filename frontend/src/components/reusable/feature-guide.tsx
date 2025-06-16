import React, { useState } from "react";
import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInfoPanelState } from "./info-panel";
import ReactMarkdown from "react-markdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FeatureGuideSection {
  title: string;
  content: string;
}

interface FeatureGuideProps {
  title: string;
  description?: string;
  sections: FeatureGuideSection[];
  storageKey: string;
  floatingButton?: boolean;
  buttonClassName?: string;
  contentClassName?: string;
}

export function FeatureGuide({
  title,
  description,
  sections,
  storageKey,
  floatingButton = false,
  buttonClassName,
  contentClassName,
}: FeatureGuideProps) {
  const [open, setOpen] = useInfoPanelState(storageKey, false);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1",
            floatingButton && "fixed bottom-6 right-6 z-50 shadow-md",
            buttonClassName
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Guide</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[400px] sm:w-[540px] overflow-y-auto"
        side="right"
      >
        <SheetHeader className="border-b pb-4 mb-4">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </SheetHeader>
        <div className="space-y-6">
          {sections.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {sections.map((section, index) => (
                <Button
                  key={index}
                  variant={activeSection === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(index)}
                >
                  {section.title}
                </Button>
              ))}
            </div>
          )}
          <div
            className={cn(
              "prose prose-sm dark:prose-invert max-w-none",
              contentClassName
            )}
          >
            <h2 className="text-lg font-bold">
              {sections[activeSection].title}
            </h2>
            <ReactMarkdown>{sections[activeSection].content}</ReactMarkdown>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function InlineHelp({
  children,
  storageKey,
  defaultExpanded = false,
  buttonLabel = "Show Help",
  closeButtonLabel = "Hide Help",
  className,
}: {
  children: React.ReactNode;
  storageKey: string;
  defaultExpanded?: boolean;
  buttonLabel?: string;
  closeButtonLabel?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useInfoPanelState(
    storageKey,
    defaultExpanded
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="text-muted-foreground hover:text-foreground text-sm h-8 px-2"
      >
        {expanded ? (
          <>
            <X className="h-3.5 w-3.5 mr-1" />
            {closeButtonLabel}
          </>
        ) : (
          <>
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            {buttonLabel}
          </>
        )}
      </Button>
      {expanded && (
        <div className="rounded-md border p-3 text-sm bg-muted/40 prose prose-sm dark:prose-invert max-w-none">
          {typeof children === "string" ? (
            <ReactMarkdown>{children}</ReactMarkdown>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
