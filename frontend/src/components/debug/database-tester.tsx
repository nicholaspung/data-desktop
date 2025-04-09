import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GetDatasets,
  GetRecords,
  GetRecord,
  GetRecordsWithRelations,
} from "../../../wailsjs/go/backend/App";
import { Search, RefreshCw } from "lucide-react";
import ReusableSelect from "../reusable/reusable-select";

const DatabaseTester = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [records, setRecords] = useState([]);
  const [recordId, setRecordId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useRelations, setUseRelations] = useState(true);
  const [error, setError] = useState("");

  // Load datasets on component mount
  useEffect(() => {
    loadDatasets();
  }, []);

  // Load datasets from backend
  const loadDatasets = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await GetDatasets();
      setDatasets((data as any) || []);
    } catch (err: any) {
      setError(`Error loading datasets: ${err.message || err}`);
      console.error("Error loading datasets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load records for selected dataset
  const loadRecords = async () => {
    if (!selectedDataset) return;

    try {
      setIsLoading(true);
      setError("");
      setRecords([]);

      // Choose whether to fetch with relations or not
      const data = useRelations
        ? await GetRecordsWithRelations(selectedDataset)
        : await GetRecords(selectedDataset);

      setRecords((data as any) || []);
    } catch (err: any) {
      setError(`Error loading records: ${err.message || err}`);
      console.error("Error loading records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific record by ID
  const loadRecordById = async () => {
    if (!recordId) {
      setError("Please enter a record ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSelectedRecord(null);

      const data = await GetRecord(recordId);
      setSelectedRecord(data as any);
    } catch (err: any) {
      setError(`Error loading record: ${err.message || err}`);
      console.error("Error loading record:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format JSON for display
  const formatJSON = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  // Handle dataset selection
  const handleDatasetChange = (value: any) => {
    setSelectedDataset(value);
    setRecords([]);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Tester</CardTitle>
          <CardDescription>
            Test database functions to debug relation issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dataset Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Dataset:</label>
              <div className="flex space-x-2">
                <ReusableSelect
                  options={datasets.map((dataset: any) => ({
                    id: dataset.id,
                    label: dataset.name,
                  }))}
                  value={selectedDataset}
                  onChange={handleDatasetChange}
                  title={"a dataset"}
                  triggerClassName={"w-full"}
                />
                <Button
                  variant="outline"
                  onClick={loadDatasets}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Relations Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={useRelations ? "default" : "outline"}
                size="sm"
                onClick={() => setUseRelations(true)}
              >
                Use Relations
              </Button>
              <Button
                variant={!useRelations ? "default" : "outline"}
                size="sm"
                onClick={() => setUseRelations(false)}
              >
                No Relations
              </Button>
            </div>

            {/* Load Records Button */}
            <Button
              onClick={loadRecords}
              disabled={!selectedDataset || isLoading}
              className="w-full"
            >
              {isLoading ? "Loading..." : "Load Records"}
            </Button>

            {/* Record ID Search */}
            <div className="flex space-x-2">
              <Input
                placeholder="Enter record ID"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
              />
              <Button onClick={loadRecordById} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-2 text-sm text-white bg-red-500 rounded">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Records ({records.length})</TabsTrigger>
          <TabsTrigger value="record">Single Record</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {records.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="overflow-auto max-h-[500px]">
                  {records.slice(0, 5).map((record: any, index) => (
                    <div key={record.id} className="mb-4">
                      <h3 className="font-bold">
                        Record {index + 1} (ID: {record.id})
                      </h3>

                      {/* Display relation fields separately */}
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          Relation Fields:
                        </h4>
                        <ul className="text-sm">
                          {Object.keys(record)
                            .filter((key) => key.endsWith("_data"))
                            .map((key) => (
                              <li key={key}>
                                <span className="font-medium">
                                  {key.replace("_data", "")}:{" "}
                                </span>
                                {record[key] ? "✅ Resolved" : "❌ Failed"}
                              </li>
                            ))}
                        </ul>
                      </div>

                      <pre className="p-2 text-xs bg-muted rounded overflow-auto max-h-[300px]">
                        {formatJSON(record)}
                      </pre>
                    </div>
                  ))}

                  {records.length > 5 && (
                    <div className="text-center text-muted-foreground">
                      Showing 5 of {records.length} records
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No records to display. Select a dataset and click "Load Records".
            </div>
          )}
        </TabsContent>

        <TabsContent value="record">
          {selectedRecord ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">
                  Record ID: {selectedRecord.id}
                </h3>
                <pre className="p-2 text-xs bg-muted rounded overflow-auto max-h-[500px]">
                  {formatJSON(selectedRecord)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No record to display. Enter a record ID and click the search
              button.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseTester;
