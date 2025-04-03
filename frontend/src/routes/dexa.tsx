import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ListPlus, PlusCircle, Table } from "lucide-react";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import { useState } from "react";
import DexaTable from "@/features/dexa/dexa-table";
import DexaForm from "@/features/dexa/dexa-form";
import { BatchEntryTable } from "@/components/data-table/batch-entry-table";

// Route definition for the DEXA page
export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

export default function DexaPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");
  const [key, setKey] = useState(0);

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">DEXA Scans</h1>
        <p className="text-muted-foreground">
          Track and visualize your DEXA scan results over time.
        </p>
      </div>

      <Tabs defaultValue="visualization">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="visualization"
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Data Table
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Scan
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <ListPlus className="h-4 w-4" />
            Batch Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="mt-6">
          <DexaVisualization key={`viz-${key}`} />
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <DexaTable key={`table-${key}`} onDataChange={handleDataChange} />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add DEXA Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <DexaForm onSuccess={handleDataChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <BatchEntryTable
            datasetId="dexa"
            fields={dexaFields}
            title="DEXA Scan"
            onSuccess={handleDataChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
