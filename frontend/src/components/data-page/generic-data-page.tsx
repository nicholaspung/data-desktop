// src/components/data-page/generic-data-page.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Table } from "lucide-react";
import GenericDataTable from "@/components/data-table/generic-data-table";
import DataForm from "@/components/data-form/data-form";
import { FieldDefinition } from "@/types";

interface GenericDataPageProps {
  datasetId: string;
  fields: FieldDefinition[];
  title: string;
  description?: string;
  addLabel?: string;
}

export default function GenericDataPage({
  datasetId,
  fields,
  title,
  description,
  addLabel = "Add New",
}: GenericDataPageProps) {
  const [key, setKey] = useState(0); // Used to force refresh the table component

  // Function to refresh the table data when a new record is added
  const handleFormSuccess = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {description && <p className="text-muted-foreground">{description}</p>}

      <Tabs defaultValue="table">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            View Data
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {addLabel}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6">
          <GenericDataTable
            key={key}
            datasetId={datasetId}
            fields={fields}
            title={`${title} Data`}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{addLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataForm
                datasetId={datasetId}
                fields={fields}
                onSuccess={handleFormSuccess}
                submitLabel={addLabel}
                successMessage={`${title} data added successfully`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
