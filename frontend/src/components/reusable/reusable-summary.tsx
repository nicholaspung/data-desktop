import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import ReusableCard from "./reusable-card";

interface StatusBadgeProps {
  variant?:
    | "success"
    | "warning"
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
  className?: string;
  children: ReactNode;
}

interface SummaryItem {
  label: ReactNode;
  value: ReactNode;
  subText?: string;
}

interface SectionProps {
  title?: ReactNode;
  items: SummaryItem[];
  columns?: 1 | 2;
  className?: string;
  badge?: StatusBadgeProps;
}

interface GridItem {
  content: ReactNode;
  action?: ReactNode;
}

interface ReusableSummaryProps {
  title: string;
  titleIcon?: ReactNode;
  linkText?: string;
  linkTo?: string;
  loading?: boolean;
  emptyState?: {
    message: string;
    actionText?: string;
    actionTo?: string;
  };
  mainSection?: {
    title: string;
    value: ReactNode;
    subText?: string;
    subComponent?: ReactNode;
    badge?: StatusBadgeProps;
  };
  sections?: SectionProps[];
  gridSection?: {
    columns: 1 | 2 | 3;
    items: GridItem[];
    className?: string;
  };
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  customContent?: ReactNode;
  isDashboardConstrained?: boolean;
}

function StatusBadge({
  variant = "default",
  className,
  children,
}: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      {children}
    </Badge>
  );
}

export default function ReusableSummary({
  title,
  titleIcon,
  linkText = "View All",
  linkTo,
  loading = false,
  emptyState,
  mainSection,
  sections = [],
  gridSection,
  footer,
  className,
  contentClassName,
  customContent,
  isDashboardConstrained = false,
}: ReusableSummaryProps) {
  const titleContent = (
    <div className="flex items-center gap-2">
      {titleIcon}
      <span>{title}</span>
    </div>
  );

  const headerActions = linkTo ? (
    <Link
      to={linkTo}
      className="text-sm text-primary hover:underline whitespace-nowrap"
    >
      {linkText}
    </Link>
  ) : undefined;

  if (loading) {
    return (
      <ReusableCard
        useSeparator={true}
        title={titleContent}
        headerActions={headerActions}
        cardClassName={className}
        contentClassName={contentClassName}
        isDashboardConstrained={isDashboardConstrained}
        content={
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        }
      />
    );
  }

  if (emptyState) {
    return (
      <ReusableCard
        useSeparator={true}
        title={titleContent}
        headerActions={headerActions}
        cardClassName={className}
        contentClassName={contentClassName}
        isDashboardConstrained={isDashboardConstrained}
        content={
          <div className="text-center py-6 text-muted-foreground">
            <p>{emptyState.message}</p>
            {emptyState.actionText && emptyState.actionTo && (
              <Link to={emptyState.actionTo}>
                <Button variant="outline" className="mt-2">
                  {emptyState.actionText}
                </Button>
              </Link>
            )}
          </div>
        }
      />
    );
  }

  if (customContent) {
    return (
      <ReusableCard
        useSeparator={true}
        title={titleContent}
        headerActions={headerActions}
        cardClassName={`${className} overflow-y-auto`}
        contentClassName={contentClassName}
        isDashboardConstrained={isDashboardConstrained}
        content={customContent}
      />
    );
  }

  return (
    <ReusableCard
      useSeparator={true}
      title={titleContent}
      headerActions={headerActions}
      cardClassName={`${className} overflow-y-auto`}
      contentClassName={contentClassName}
      isDashboardConstrained={isDashboardConstrained}
      content={
        <div className="space-y-4">
          {mainSection && (
            <div>
              <p className="text-sm text-muted-foreground">
                {mainSection.title}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">{mainSection.value}</div>
                {mainSection.badge && (
                  <StatusBadge {...mainSection.badge}>
                    {mainSection.badge.children}
                  </StatusBadge>
                )}
              </div>
              {mainSection.subText && (
                <p className="text-sm text-muted-foreground">
                  {mainSection.subText}
                </p>
              )}
              {mainSection.subComponent && mainSection.subComponent}
            </div>
          )}

          {sections.map((section, index) => (
            <div key={index} className={section.className}>
              {section.title && (
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{section.title}</p>
                  {section.badge && (
                    <StatusBadge {...section.badge}>
                      {section.badge.children}
                    </StatusBadge>
                  )}
                </div>
              )}

              <div
                className={
                  section.columns === 2 ? "grid grid-cols-2 gap-4" : "space-y-1"
                }
              >
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <div className="font-semibold">{item.value}</div>
                    {item.subText && (
                      <p className="text-sm text-muted-foreground">
                        {item.subText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {gridSection && (
            <div
              className={`grid grid-cols-1 ${gridSection.columns === 2 ? "md:grid-cols-2" : gridSection.columns === 3 ? "md:grid-cols-3" : ""} gap-4 ${gridSection.className || ""}`}
            >
              {gridSection.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-card flex flex-col items-center text-center"
                >
                  {item.content}
                  {item.action && <div className="mt-2">{item.action}</div>}
                </div>
              ))}
            </div>
          )}

          {footer}
        </div>
      }
    />
  );
}
