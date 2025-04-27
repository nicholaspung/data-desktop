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
}: {
  title?: ReactNode;
  content: ReactNode;
  showHeader?: boolean;
  contentClassName?: string;
  cardClassName?: string;
  description?: ReactNode;
  useSeparator?: boolean;
}) {
  return (
    <Card className={cardClassName}>
      {showHeader ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && description}
        </CardHeader>
      ) : null}
      {useSeparator && showHeader ? <Separator className="mb-4" /> : null}
      <CardContent className={contentClassName}>{content}</CardContent>
    </Card>
  );
}
