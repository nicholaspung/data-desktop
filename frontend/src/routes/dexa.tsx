// src/pages/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Table, LineChart, Upload } from "lucide-react";
import GenericDataTable from "@/components/data-table/generic-data-table";
import DataForm from "@/components/data-form/data-form";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import DexaImport from "@/features/dexa/dexa-import";
import { useState } from "react";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

function DexaPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");
  const [key, setKey] = useState(0); // Used to force refresh components when data changes

  // Function to refresh the components when data changes
  const handleDataChange = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DEXA Scan Tracking</h1>
      </div>

      <p className="text-muted-foreground">
        Track and visualize your DEXA scan results over time. Import your scan
        data using CSV files or add individual records manually.
      </p>

      <Tabs defaultValue="visualize">
        <TabsList className="grid w-full md:w-[500px] grid-cols-4">
          <TabsTrigger value="visualize" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Visualize
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            View Data
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Scan
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualize" className="mt-6">
          <DexaVisualization key={`viz-${key}`} />
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <GenericDataTable
            key={`table-${key}`}
            datasetId="dexa"
            fields={dexaFields}
            title="DEXA Scan Results"
            onDataChange={handleDataChange}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add DEXA Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <DataForm
                datasetId="dexa"
                fields={dexaFields}
                onSuccess={handleDataChange}
                submitLabel="Add DEXA Scan"
                successMessage="DEXA scan added successfully"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <DexaImport onImportSuccess={handleDataChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
