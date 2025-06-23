import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { FEATURE_ICONS } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dataStore from "@/store/data-store";
import {
  FeatureLayout,
  FeatureHeader,
} from "@/components/layout/feature-layout";
import FinancialFilesManager from "@/features/financial/financial-files-manager";
import HealthFilesManager from "@/features/health/health-files-manager";
import { MultiModeAddDialog } from "@/features/financial/multi-mode-add-dialog";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";

interface FilesSearch {
  tab?: string;
}

export const Route = createFileRoute("/files")({
  validateSearch: (search): FilesSearch => ({
    tab: search.tab as string,
  }),
  component: FilesPage,
});

function FilesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState(search.tab || "financial");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<string>("");
  const [currentDatasetTitle, setCurrentDatasetTitle] = useState<string>("");

  const { getDatasetFields } = useFieldDefinitions();

  const financialFiles = useStore(
    dataStore,
    (state) => state.financial_files || []
  );

  const healthFiles = useStore(
    dataStore,
    (state) => state.health_files || []
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate({ search: { tab } });
  };

  const handleAddNew = (datasetId: string, title: string) => {
    setCurrentDataset(datasetId);
    setCurrentDatasetTitle(title);
    setShowAddDialog(true);
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    setCurrentDataset("");
    setCurrentDatasetTitle("");
    toast.success("Files added successfully!");
  };

  const tabs = useMemo(
    () => [
      {
        id: "financial",
        label: "Financial Files",
        icon: <FEATURE_ICONS.RECEIPT className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Financial Files</h3>
              <Button
                onClick={() =>
                  handleAddNew("financial_files", "Financial Files")
                }
                size="sm"
              >
                <FEATURE_ICONS.PLUS className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>
            <FinancialFilesManager files={financialFiles} />
          </div>
        ),
      },
      {
        id: "health",
        label: "Health Files",
        icon: <FEATURE_ICONS.HEART_PULSE className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Health Files</h3>
              <Button
                onClick={() =>
                  handleAddNew("health_files", "Health Files")
                }
                size="sm"
              >
                <FEATURE_ICONS.PLUS className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>
            <HealthFilesManager files={healthFiles} />
          </div>
        ),
      },
    ],
    [financialFiles, healthFiles]
  );

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Files"
          description="Manage and view your document storage"
          storageKey="files"
          helpText="Store and organize your financial and health documents in one place. Upload multiple files with date tracking for easy retrieval."
          helpVariant="info"
        >
          <FEATURE_ICONS.FILE_TEXT className="h-8 w-8" />
        </FeatureHeader>
      }
    >
      <ReusableTabs
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
        defaultTabId="financial"
      />

      {showAddDialog && (
        <MultiModeAddDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          title={currentDatasetTitle}
          datasetId={currentDataset}
          fieldDefinitions={getDatasetFields(currentDataset)}
          availableModes={["single"]}
          onSuccess={handleAddSuccess}
          recentEntries={
            currentDataset === "financial_files"
              ? financialFiles
              : currentDataset === "health_files"
              ? healthFiles
              : []
          }
          existingEntries={
            currentDataset === "financial_files"
              ? financialFiles
              : currentDataset === "health_files"
              ? healthFiles
              : []
          }
        />
      )}
    </FeatureLayout>
  );
}