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
}: {
  title?: ReactNode;
  content: ReactNode;
  showHeader?: boolean;
  contentClassName?: string;
  cardClassName?: string;
  description?: ReactNode;
  useSeparator?: boolean;
  headerActions?: ReactNode;
}) {
  return (
    <Card className={cardClassName}>
      {showHeader ? (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && description}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      ) : null}
      {useSeparator && showHeader ? <Separator className="mb-4" /> : null}
      <CardContent className={contentClassName}>{content}</CardContent>
    </Card>
  );
}
