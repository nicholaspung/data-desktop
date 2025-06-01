import { useState } from "react";
import { PlusCircle, Table, ListPlus, Trash2 } from "lucide-react";
import GenericDataTable from "@/components/data-table/generic-data-table";
import DataForm from "@/components/data-form/data-form";
import { BatchEntryTable } from "@/components/data-table/batch-entry-table";
import { FieldDefinition } from "@/types/types";
import { cn } from "@/lib/utils";
import { DataStoreName } from "@/store/data-store";
import { CustomTab } from "./data-page";
import ReusableTabs, { TabItem } from "@/components/reusable/reusable-tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GenericDataPage({
  datasetId,
  fields,
  title,
  description,
  addLabel = "Add New",
  disableBatchEntry = false,
  disableTableView = false,
  disableAddForm = false,
  defaultTab = "table",
  customTabs = [],
  onDataChange,
  tablePageSize = 10,
  highlightedRecordId = null,
}: {
  datasetId: DataStoreName;
  fields: FieldDefinition[];
  title: string;
  description?: string;
  addLabel?: string;
  disableBatchEntry?: boolean;
  disableTableView?: boolean;
  disableAddForm?: boolean;
  defaultTab?: string;
  customTabs?: CustomTab[];
  onDataChange?: () => void;
  tablePageSize?: number;
  highlightedRecordId?: string | null;
}) {
  const [key, setKey] = useState(0);

  const handleDataChange = () => {
    setKey((prev) => prev + 1);
    if (onDataChange) {
      onDataChange();
    }
  };

  const clearLocalStorageData = () => {
    const batchEntryKey = `batch_entry_${datasetId}`;
    const addFormKey = `${datasetId}_add_form_data`;

    const hadBatchData = localStorage.getItem(batchEntryKey) !== null;
    localStorage.removeItem(batchEntryKey);

    const hadFormData = localStorage.getItem(addFormKey) !== null;
    localStorage.removeItem(addFormKey);

    setKey((prev) => prev + 1);

    if (hadBatchData || hadFormData) {
      toast.success("Local saved data cleared successfully");
    } else {
      toast.info("No saved data found to clear");
    }
  };

  const beforeTabs = customTabs.filter(
    (tab) => tab.position === "before" || !tab.position
  );
  const afterTabs = customTabs.filter((tab) => tab.position === "after");

  const standardTabsList = [
    !disableTableView
      ? {
          id: "table",
          label: "View Data",
          icon: <Table className="h-4 w-4" />,
          content: (
            <GenericDataTable
              key={`${datasetId}-table-${key}`}
              datasetId={datasetId}
              fields={fields}
              title={`${title} Data`}
              onDataChange={handleDataChange}
              pageSize={tablePageSize}
              highlightedRecordId={highlightedRecordId}
            />
          ),
        }
      : null,
    !disableAddForm
      ? {
          id: "add",
          label: addLabel,
          icon: <PlusCircle className="h-4 w-4" />,
          content: (
            <DataForm
              title={addLabel}
              datasetId={datasetId}
              fields={fields}
              onSuccess={handleDataChange}
              submitLabel={addLabel}
              successMessage={`${title} data added successfully`}
              persistKey={`${datasetId}_add_form_data`}
            />
          ),
        }
      : null,
    !disableBatchEntry
      ? {
          id: "batch",
          label: "Batch Entry",
          icon: <ListPlus className="h-4 w-4" />,
          content: (
            <BatchEntryTable
              datasetId={datasetId}
              fields={fields}
              title={title}
              onSuccess={handleDataChange}
            />
          ),
        }
      : null,
  ].filter((tab): tab is NonNullable<typeof tab> => tab !== null);

  const allTabs = [...beforeTabs, ...standardTabsList, ...afterTabs].map(
    (tab): TabItem => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      content: tab.content,
    })
  );

  const validDefaultTab = allTabs.some((tab) => tab.id === defaultTab)
    ? defaultTab
    : allTabs.length > 0
      ? allTabs[0].id
      : "";

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearLocalStorageData}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Saved Data
        </Button>
      </div>

      {allTabs.length > 0 ? (
        <ReusableTabs
          tabs={allTabs}
          defaultTabId={validDefaultTab}
          className="w-full space-y-6"
          tabsListClassName={cn({
            "overflow-x-auto": allTabs.length > 4,
          })}
          tabsContentClassName="mt-6 w-full"
        />
      ) : (
        <div className="text-center p-12 border rounded-md bg-muted/10 w-full">
          <p className="text-muted-foreground">
            No content configured for this page.
          </p>
        </div>
      )}
    </div>
  );
}
