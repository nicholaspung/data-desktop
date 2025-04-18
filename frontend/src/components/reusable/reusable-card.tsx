import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function ReusableCard({
  title,
  content,
  showHeader = true,
  contentClassName,
  cardClassName,
  description,
}: {
  title?: ReactNode;
  content: ReactNode;
  showHeader?: boolean;
  contentClassName?: string;
  cardClassName?: string;
  description?: ReactNode;
}) {
  return (
    <Card className={cardClassName}>
      {showHeader ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && description}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName}>{content}</CardContent>
    </Card>
  );
}
