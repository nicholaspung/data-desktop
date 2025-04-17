// src/features/dexa/edit-dexa-scan-button.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import ReusableSelect from "@/components/reusable/reusable-select";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { format } from "date-fns";
import { DEXAScan } from "@/store/dexa-definitions";

export default function EditDexaScanButton() {
  const [open, setOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState<string>("");
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  const scans = useStore(dataStore, (state) => state.dexa as DEXAScan[]);

  // Create options for the selection dropdown
  const scanOptions = scans
    .map((scan) => ({
      id: scan.id,
      label: format(new Date(scan.date), "MMM d, yyyy"),
    }))
    .sort((a, b) => b.label.localeCompare(a.label)); // Sort newest to oldest

  // Get the selected scan data
  const selectedScanData = scans.find((scan) => scan.id === selectedScan);

  const handleSuccess = () => {
    setOpen(false);
    setSelectedScan("");
    toast.success("DEXA scan updated successfully!");
  };

  return (
    <ReusableDialog
      title="Edit DEXA Scan"
      description="Update your existing DEXA scan details."
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setSelectedScan("");
      }}
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit DEXA Scan
        </Button>
      }
      customContent={
        <div className="py-4 overflow-y-auto max-h-[70vh]">
          {scans.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No DEXA scans available to edit. Please add a scan first.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">
                  Select DEXA Scan to Edit:
                </h3>
                <ReusableSelect
                  options={scanOptions}
                  value={selectedScan}
                  onChange={setSelectedScan}
                  title="DEXA Scan"
                  placeholder="Select a scan date..."
                />
              </div>

              {selectedScan && selectedScanData ? (
                <DataForm
                  datasetId="dexa"
                  fields={dexaFields}
                  initialValues={selectedScanData}
                  onSuccess={handleSuccess}
                  onCancel={() => setSelectedScan("")}
                  submitLabel="Update DEXA Scan"
                  mode="edit"
                  recordId={selectedScan}
                />
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Select a scan to edit its details
                </div>
              )}
            </>
          )}
        </div>
      }
      customFooter={<div />} // Empty div to remove default footer
    />
  );
}
