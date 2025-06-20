import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

export default function ReusableCard({
  title,
  content,
  showHeader = true,
  contentClassName,
  cardClassName,
  description,
  useSeparator = false,
  headerActions,
  isDashboardConstrained = false,
}: {
  title?: ReactNode;
  content: ReactNode;
  showHeader?: boolean;
  contentClassName?: string;
  cardClassName?: string;
  description?: ReactNode;
  useSeparator?: boolean;
  headerActions?: ReactNode;
  isDashboardConstrained?: boolean;
}) {
  return (
    <Card
      className={`${cardClassName || ""} ${isDashboardConstrained ? "h-full" : ""}`.trim()}
      style={
        isDashboardConstrained
          ? { display: "flex", flexDirection: "column" }
          : undefined
      }
    >
      {showHeader ? (
        <CardHeader className={isDashboardConstrained ? "flex-shrink-0" : ""}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && description}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}
          </div>
        </CardHeader>
      ) : null}
      {useSeparator && showHeader ? (
        <Separator
          className={`mb-4 ${isDashboardConstrained ? "flex-shrink-0" : ""}`}
        />
      ) : null}
      <CardContent
        className={`${contentClassName || ""} ${isDashboardConstrained ? "flex-1 min-h-0 p-0" : ""}`.trim()}
      >
        {isDashboardConstrained ? (
          <div className="overflow-y-auto h-full p-6">{content}</div>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
}
