import { Badge } from "../ui/badge";

export default function SavedDataBadge() {
  return (
    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 px-2 py-1">
      <span className="text-xs">Saved data</span>
    </Badge>
  );
}
