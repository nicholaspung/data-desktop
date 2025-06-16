import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import DataForm from "@/components/data-form/data-form";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Banknote, Receipt, Scale, FileText, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dataStore from "@/store/data-store";
import {
  FeatureLayout,
  FeatureHeader,
} from "@/components/layout/feature-layout";

interface WealthSearch {
  tab?: string;
}

export const Route = createFileRoute("/wealth")({
  validateSearch: (search): WealthSearch => ({
    tab: search.tab as string,
  }),
  component: WealthPage,
});

function WealthPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState(search.tab || "logs");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentDataset, setCurrentDataset] = useState<string>("");
  const [currentDatasetTitle, setCurrentDatasetTitle] = useState<string>("");

  const { getDatasetFields } = useFieldDefinitions();

  const financialLogs = useStore(
    dataStore,
    (state) => state.financial_logs || []
  );
  const financialBalances = useStore(
    dataStore,
    (state) => state.financial_balances || []
  );
  const paycheckInfo = useStore(
    dataStore,
    (state) => state.paycheck_info || []
  );
  const financialFiles = useStore(
    dataStore,
    (state) => state.financial_files || []
  );

  useEffect(() => {
    if (search.tab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate({
      search: { tab: tabId },
    });
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
    toast.success("Record added successfully!");
  };

  const tabs = useMemo(
    () => [
      {
        id: "logs",
        label: "Logs",
        icon: <Receipt className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Financial Logs</h3>
              <Button
                onClick={() =>
                  handleAddNew("financial_logs", "Financial Transaction")
                }
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "balances",
        label: "Balances",
        icon: <Scale className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Account Balances</h3>
              <Button
                onClick={() =>
                  handleAddNew("financial_balances", "Account Balance")
                }
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Balance
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "paycheck",
        label: "Paycheck",
        icon: <Banknote className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Paycheck Information</h3>
              <Button
                onClick={() => handleAddNew("paycheck_info", "Paycheck Item")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Paycheck Item
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "files",
        label: "Files",
        icon: <FileText className="h-4 w-4" />,
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
                <Plus className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [financialLogs, financialBalances, paycheckInfo, financialFiles]
  );

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Wealth"
          description="Track your finances, income, expenses, and financial documents"
          developmentStage="alpha"
          helpText="This section helps you manage all aspects of your financial data. Use the tabs to navigate between different financial tracking categories."
          helpVariant="info"
          storageKey="wealth-feature"
        >
          <Wallet className="h-8 w-8" />
        </FeatureHeader>
      }
    >
      <ReusableTabs
        tabs={tabs}
        defaultTabId={activeTab}
        onChange={handleTabChange}
        className="w-full"
      />

      {showAddDialog && (
        <ReusableDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          title={`Add ${currentDatasetTitle}`}
          customContent={
            <div className="p-4">
              <DataForm
                fields={getDatasetFields(currentDataset)}
                datasetId={currentDataset as any}
                onSuccess={handleAddSuccess}
              />
            </div>
          }
        />
      )}
    </FeatureLayout>
  );
}
