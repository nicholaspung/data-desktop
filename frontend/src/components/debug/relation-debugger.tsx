import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import {
  GetDatasets,
  GetRecordsWithRelations,
  GetDataset,
  GetRecord,
} from "../../../wailsjs/go/backend/App";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { database } from "../../../wailsjs/go/models";
import ReusableSelect from "../reusable/reusable-select";
import { Record, RelatedData, RelationStats } from "./debug";
import ReusableTabs from "@/components/reusable/reusable-tabs";

const RelationDebugger: React.FC = () => {
  const [datasets, setDatasets] = useState<database.Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [datasetDetails, setDatasetDetails] = useState<database.Dataset | null>(
    null
  );
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [relationStats, setRelationStats] = useState<RelationStats>({});
  const [error, setError] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData>({});

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await GetDatasets();
      setDatasets(data || []);
    } catch (err: any) {
      setError(`Error loading datasets: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatasetDetails = async (datasetId: string) => {
    if (!datasetId) return;

    try {
      setIsLoading(true);
      setError("");
      const data = await GetDataset(datasetId);
      setDatasetDetails(data);

      setRecords([]);
      setRelationStats({});
      setSelectedRecord(null);
      setRelatedData({});
    } catch (err: any) {
      setError(`Error loading dataset details: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordsWithRelations = async () => {
    if (!selectedDataset) return;

    try {
      setIsLoading(true);
      setError("");
      setRecords([]);

      const data = await GetRecordsWithRelations(selectedDataset);
      setRecords((data as Record[]) || []);

      if (data && data.length > 0 && datasetDetails) {
        const stats = {} as any;

        const relationFields = datasetDetails.fields.filter(
          (f) => f.isRelation
        );

        relationFields.forEach((field: any) => {
          const fieldStats = {
            total: data.length,
            resolved: 0,
            failed: 0,
            relatedDataset: field.relatedDataset,
            values: new Set(),
          };

          data.forEach((record: any) => {
            const relDataKey = `${field.key}_data`;
            const relID = record[field.key];

            if (relID) {
              fieldStats.values.add(relID);
            }

            if (record[relDataKey]) {
              fieldStats.resolved++;
            } else {
              fieldStats.failed++;
            }
          });

          stats[field.key] = fieldStats;
        });

        setRelationStats(stats);
      }
    } catch (err: any) {
      setError(`Error loading records: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedRecord = async (datasetId: string, recordId: string) => {
    if (!datasetId || !recordId) return null;

    try {
      return await GetRecord(recordId);
    } catch (err) {
      console.error(
        `Error loading related record ${recordId} from ${datasetId}:`,
        err
      );
      return null;
    }
  };

  const handleDatasetChange = (value: any) => {
    setSelectedDataset(value);
    loadDatasetDetails(value);
  };

  const handleRecordSelect = async (record: any) => {
    setSelectedRecord(record);

    if (datasetDetails) {
      const newRelatedData = {} as any;
      const relationFields = datasetDetails.fields.filter((f) => f.isRelation);

      for (const field of relationFields) {
        const relId = record[field.key];
        if (relId) {
          const relatedRecord = await loadRelatedRecord(
            field.relatedDataset as string,
            relId
          );
          newRelatedData[field.key] = relatedRecord;
        }
      }

      setRelatedData(newRelatedData);
    }
  };

  const formatJSON = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (err: any) {
      return `Error formatting JSON: ${JSON.stringify(err)}`;
    }
  };

  const looksLikeDate = (str: any) => {
    if (!str || typeof str !== "string") return false;

    return (
      // MM/DD/YYYY or M/D/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str) ||
      // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}$/.test(str) ||
      // Month names
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s.\-/]?\d{1,2}[\s.\-/]?,?\s?\d{4}$/i.test(
        str
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relation Debugger</CardTitle>
          <CardDescription>
            Debug database relation issues by analyzing how records are linked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  Select Dataset:
                </label>
                <ReusableSelect
                  options={datasets.map((dataset) => ({
                    id: dataset.id,
                    label: dataset.name,
                  }))}
                  value={selectedDataset}
                  onChange={handleDatasetChange}
                  title={" a dataset"}
                />
              </div>
              <Button
                variant="outline"
                onClick={loadDatasets}
                disabled={isLoading}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            {datasetDetails && (
              <div className="border rounded-md p-4 space-y-2">
                <h3 className="font-medium">Dataset Fields</h3>
                <div className="grid grid-cols-2 gap-2">
                  {datasetDetails.fields
                    .filter((field) => field.isRelation)
                    .map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center p-2 border rounded-md bg-muted"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{field.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {field.key} → {field.relatedDataset}
                          </p>
                        </div>
                        <Badge variant="outline">{field.type}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <Button
              onClick={loadRecordsWithRelations}
              disabled={!selectedDataset || isLoading}
              className="w-full"
            >
              {isLoading ? "Loading..." : "Load Records with Relations"}
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      {Object.keys(relationStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Relation Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(relationStats).map(([fieldKey, stats]) => (
                <div key={fieldKey} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{fieldKey}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        Related to: {stats.relatedDataset}
                      </span>
                      <Badge
                        variant={stats.failed > 0 ? "destructive" : "default"}
                      >
                        {stats.resolved}/{stats.total} resolved
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{
                        width: `${(stats.resolved / stats.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Value Analysis</h4>
                    <div className="max-h-[150px] overflow-y-auto text-xs p-2 bg-muted rounded-md">
                      <ul className="space-y-1">
                        {Array.from(stats.values).map((value) => (
                          <li key={value} className="flex items-center">
                            <span className="font-mono">"{value}"</span>
                            {looksLikeDate(value) && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Looks like a date
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableTabs
              tabs={[
                {
                  id: "list",
                  label: "Record List",
                  content: (
                    <div className="space-y-4 pt-4">
                      <div className="border rounded-md overflow-hidden">
                        <div className="max-h-[400px] overflow-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="p-2 text-left">ID</th>
                                {datasetDetails &&
                                  datasetDetails.fields
                                    .filter((f) => f.isRelation)
                                    .map((field) => (
                                      <th
                                        key={field.key}
                                        className="p-2 text-left"
                                      >
                                        {field.displayName}
                                      </th>
                                    ))}
                                <th className="p-2 text-left">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {records.slice(0, 20).map((record) => (
                                <tr
                                  key={record.id}
                                  className="border-t hover:bg-muted/50"
                                >
                                  <td className="p-2">
                                    <code className="text-xs">
                                      {record.id.substring(0, 8)}...
                                    </code>
                                  </td>
                                  {datasetDetails &&
                                    datasetDetails.fields
                                      .filter((f) => f.isRelation)
                                      .map((field) => {
                                        const relDataKey = `${field.key}_data`;
                                        const hasRelation =
                                          !!record[relDataKey];

                                        return (
                                          <td key={field.key} className="p-2">
                                            <div className="flex items-center space-x-2">
                                              <Badge
                                                variant={
                                                  hasRelation
                                                    ? "outline"
                                                    : "destructive"
                                                }
                                              >
                                                {hasRelation ? "✓" : "✗"}
                                              </Badge>
                                              <span className="text-xs font-mono truncate max-w-[150px]">
                                                {record[field.key]}
                                              </span>
                                            </div>
                                          </td>
                                        );
                                      })}
                                  <td className="p-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRecordSelect(record)}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: "detail",
                  label: "Record Detail",
                  content: (
                    <div className="pt-4">
                      {selectedRecord ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <h3 className="font-medium">Record Details</h3>
                            <div className="border rounded-md p-2">
                              <pre className="text-xs overflow-auto max-h-[500px]">
                                {formatJSON(selectedRecord)}
                              </pre>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="font-medium">Related Records</h3>
                            {datasetDetails &&
                              datasetDetails.fields
                                .filter((f) => f.isRelation)
                                .map((field) => {
                                  const relId = selectedRecord[field.key];
                                  const relData = relatedData[field.key];
                                  const relatedDataExists =
                                    !!selectedRecord[`${field.key}_data`];

                                  return (
                                    <div
                                      key={field.key}
                                      className="border rounded-md overflow-hidden"
                                    >
                                      <div className="bg-muted p-2 flex justify-between items-center">
                                        <span className="font-medium">
                                          {field.displayName}
                                        </span>
                                        <Badge
                                          variant={
                                            relatedDataExists
                                              ? "default"
                                              : "destructive"
                                          }
                                        >
                                          {relatedDataExists
                                            ? "Resolved"
                                            : "Failed"}
                                        </Badge>
                                      </div>
                                      <div className="p-2 text-sm">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <span>ID:</span>
                                          <code className="text-xs bg-muted p-1 rounded">
                                            {relId || "N/A"}
                                          </code>
                                          {looksLikeDate(relId) && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Looks like a date
                                            </Badge>
                                          )}
                                        </div>
                                        {relData ? (
                                          <div className="border rounded-md p-2">
                                            <pre className="text-xs overflow-auto max-h-[200px]">
                                              {formatJSON(relData)}
                                            </pre>
                                          </div>
                                        ) : (
                                          <div className="bg-muted p-2 rounded-md text-xs">
                                            {relId ? (
                                              <span>
                                                Failed to load related record
                                                with ID: {relId}
                                              </span>
                                            ) : (
                                              <span>
                                                No relation ID provided
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          Select a record from the list to view details
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
              defaultTabId="list"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RelationDebugger;
