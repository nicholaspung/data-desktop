import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Settings } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import AddBodyMeasurementForm, { AddBodyMeasurementFormRef } from "./add-body-measurement-form";
import BodyMeasurementSearch from "./body-measurement-search";

export default function BodyMeasurementManager() {
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const formRef = useRef<AddBodyMeasurementFormRef>(null);

  const handleAddSuccess = () => {
    setManagerDialogOpen(false);
  };

  const handleCancel = () => {
    setManagerDialogOpen(false);
  };

  const handleSubmit = () => {
    if (activeTab === "add") {
      formRef.current?.submit();
    }
  };

  const tabs = [
    {
      id: "add",
      label: "Add Measurement",
      icon: <Plus className="h-4 w-4" />,
      content: (
        <AddBodyMeasurementForm
          ref={formRef}
          onSuccess={handleAddSuccess}
          showButtons={false}
        />
      ),
    },
    {
      id: "search",
      label: "Search & Edit",
      icon: <Search className="h-4 w-4" />,
      content: <BodyMeasurementSearch />,
    },
  ];

  const getFooterButtons = () => {
    if (activeTab === "add") {
      return (
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={formRef.current?.isSubmitting()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formRef.current?.isValid() || formRef.current?.isSubmitting()}
            className="flex-1"
          >
            {formRef.current?.isSubmitting() ? "Adding..." : "Add Measurement"}
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        size="sm"
        onClick={() => setManagerDialogOpen(true)}
      >
        <Settings className="h-4 w-4" />
        Body Measurement Manager
      </Button>

      <ReusableDialog
        title="Body Measurement Manager"
        description="Add new measurements or search and edit existing ones"
        open={managerDialogOpen}
        onOpenChange={setManagerDialogOpen}
        contentClassName="sm:max-w-[700px]"
        fixedFooter={true}
        showTrigger={false}
        customContent={
          <ReusableTabs
            tabs={tabs}
            defaultTabId="add"
            className="w-full"
            onChange={setActiveTab}
          />
        }
        customFooter={getFooterButtons()}
      />
    </>
  );
}
