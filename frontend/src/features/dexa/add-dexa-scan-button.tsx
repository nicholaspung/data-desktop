import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";

export default function AddDexaScanButton() {
  const [open, setOpen] = useState(false);
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <ReusableDialog
      title="Add DEXA Scan"
      description="Enter your DEXA scan details to track your body composition progress."
      open={open}
      onOpenChange={setOpen}
      showTrigger={true}
      trigger={
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add DEXA Scan
        </Button>
      }
      customContent={
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <DataForm
            datasetId="dexa"
            fields={dexaFields}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            submitLabel="Add DEXA Scan"
            persistKey="dexa_scan_form"
          />
        </div>
      }
      customFooter={<div />}
    />
  );
}
