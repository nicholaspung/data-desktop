// src/components/data-page/generic-data-page.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Table, ListPlus } from "lucide-react";
import GenericDataTable from "@/components/data-table/generic-data-table";
import DataForm from "@/components/data-form/data-form";
import { BatchEntryTable } from "@/components/data-table/batch-entry-table";
import { FieldDefinition } from "@/types";
import React from "react";
import { cn } from "@/lib/utils";

interface CustomTab {
  id: string;
  label: string;
  icon?: React.ReactElement;
  content: React.ReactNode;
  position?: "before" | "after"; // Position relative to standard tabs
}

interface GenericDataPageProps {
  datasetId: string;
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
}

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
}: GenericDataPageProps) {
  const [key, setKey] = useState(0); // Used to force refresh components

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setKey((prev) => prev + 1);
    if (onDataChange) {
      onDataChange();
    }
  };

  // Organize custom tabs by position
  const beforeTabs = customTabs.filter(
    (tab) => tab.position === "before" || !tab.position
  );
  const afterTabs = customTabs.filter((tab) => tab.position === "after");

  // Generate the list of standard tabs based on disabled options
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

  // Combine tabs in order: beforeTabs, standard tabs, afterTabs
  const allTabs = [...beforeTabs, ...standardTabsList, ...afterTabs];

  // Ensure default tab exists in the tabs list
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
      </div>

      {allTabs.length > 0 ? (
        <Tabs defaultValue={validDefaultTab} className="w-full space-y-6">
          <TabsList
            className={cn("w-full", {
              "overflow-x-auto": allTabs.length > 4,
            })}
          >
            {allTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {allTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6 w-full">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
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
