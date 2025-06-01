import useLoadData from "@/hooks/useLoadData";
import loadingStore from "@/store/loading-store";
import { useStore } from "@tanstack/react-store";
import { RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { FieldDefinition } from "@/types/types";
import { DataStoreName } from "@/store/data-store";

export default function RefreshDatasetButton({
  fields,
  datasetId,
  title,
}: {
  fields: FieldDefinition[];
  datasetId: DataStoreName;
  title: string;
}) {
  const { loadData } = useLoadData({
    fields,
    datasetId,
    title,
  });
  const isLoading = useStore(loadingStore, (state) => state[datasetId]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => await loadData()}
      disabled={isLoading}
    >
      <RefreshCcw className="h-4 w-4" />
    </Button>
  );
}
