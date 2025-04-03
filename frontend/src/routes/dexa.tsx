import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Table, LineChart, Upload } from "lucide-react";
import GenericDataTable from "@/components/data-table/generic-data-table";
import DataForm from "@/components/data-form/data-form";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import DexaImport from "@/features/dexa/dexa-import";
import { useState, useEffect } from "react";

// Route definition for the DEXA page
export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

function DexaPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");
  const [key, setKey] = useState(0); // Used to force refresh components when data changes
  const [activeTab, setActiveTab] = useState("visualize");
  const [newRecordId, setNewRecordId] = useState<string | null>(null);

  // Check for tab and recordId in URL on initial load
  useEffect(() => {
    // Read URL parameters using the browser's native API
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    const recordIdParam = urlParams.get("recordId");

    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (recordIdParam) {
      setNewRecordId(recordIdParam);
    }
  }, []);

  // Function to refresh the components when data changes
  const handleDataChange = () => {
    setKey((prev) => prev + 1);
  };

  // Function to handle successful form submission
  const handleFormSuccess = (recordId: string) => {
    // Update the data
    handleDataChange();

    // Store the new record ID
    setNewRecordId(recordId);

    // Switch to the table tab
    setActiveTab("table");

    // Update the URL to reflect the change
    const urlParams = new URLSearchParams();
    urlParams.set("tab", "table");
    urlParams.set("recordId", recordId);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
  };

  // Function to handle form cancellation
  const handleFormCancel = () => {
    // Return to the table tab
    setActiveTab("table");

    // Update the URL
    const urlParams = new URLSearchParams();
    urlParams.set("tab", "table");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
  };

  // Function to update URL when tab changes
  const handleTabChange = (value: string) => {
    // If switching away from the add tab, clear the form data
    if (activeTab === "add" && value !== "add") {
      // Clear the form data from localStorage
      localStorage.removeItem("dexa_scan_form_data");

      // Force re-render of the add form by updating key
      setKey((prev) => prev + 1);
    }

    setActiveTab(value);

    // Clear the record ID when switching tabs (except table tab)
    if (value !== "table") {
      setNewRecordId(null);
    }

    // Update URL
    const urlParams = new URLSearchParams();
    urlParams.set("tab", value);
    if (value === "table" && newRecordId) {
      urlParams.set("recordId", newRecordId);
    }
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
            highlightedRecordId={newRecordId}
            disableImport={true} // Disable the import button in the table view
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add DEXA Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <DataForm
                key={`add-form-${key}`} // Add key to force re-render when changed
                datasetId="dexa"
                fields={dexaFields}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                submitLabel="Add DEXA Scan"
                successMessage="DEXA scan added successfully"
                persistKey="dexa_scan_form_data"
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
