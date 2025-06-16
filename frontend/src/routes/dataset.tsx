import { DatasetConfig } from "@/components/data-page/data-page";
import { DatasetSelector } from "@/components/data-page/dataset-selector";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { createFileRoute, useSearch } from "@tanstack/react-router";

interface DatasetSearchParams {
  datasetId?: string;
  mode?: string;
  page?: string;
  pageSize?: string;
  sortColumn?: string;
  sortDirection?: string;
  filterColumn?: string;
  filterValue?: string;
  showTimestamps?: string;
}

export const Route = createFileRoute("/dataset")({
  validateSearch: (search: Record<string, unknown>): DatasetSearchParams => ({
    datasetId: search.datasetId as string | undefined,
    mode: search.mode as "view" | "edit" | "delete" | undefined,
    page: search.page ? (search.page as string) : undefined,
    pageSize: search.pageSize ? (search.pageSize as string) : undefined,
    sortColumn: search.sortColumn as string | undefined,
    sortDirection: search.sortDirection as "asc" | "desc" | undefined,
    filterColumn: search.filterColumn as string | undefined,
    filterValue: search.filterValue as string | undefined,
    showTimestamps: search.showTimestamps as string | undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { getAllDatasets } = useFieldDefinitions();

  const search = useSearch({ from: "/dataset" });
  const datasetIdFromUrl = search.datasetId;

  const allDefinitions = getAllDatasets();
  const datasets: DatasetConfig[] = allDefinitions.map((def) => ({
    id: def.id,
    title: def.name,
    description: def.description || `${def.name} list`,
    fields: def.fields,
    addLabel: `Add ${def.name}`,
  }));

  return (
    <DatasetSelector
      datasets={datasets}
      defaultDatasetId={datasetIdFromUrl || "ethnicity"}
      title="Select Dataset"
    />
  );
}
