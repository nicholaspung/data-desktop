import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Banknote, Receipt, Scale, FileText, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dataStore from "@/store/data-store";
import {
  FeatureLayout,
  FeatureHeader,
} from "@/components/layout/feature-layout";
import FinancialLogsManager from "@/features/financial/financial-logs-manager";
import FinancialBalancesManager from "@/features/financial/financial-balances-manager";
import PaycheckLogsManager from "@/features/financial/paycheck-logs-manager";
import FinancialFilesManager from "@/features/financial/financial-files-manager";
import { MultiModeAddDialog } from "@/features/financial/multi-mode-add-dialog";
import { FinancialOverviewCard } from "@/features/financial/financial-overview-card";
import {
  FinancialBalance,
  FinancialLog,
  PaycheckInfo,
} from "@/features/financial/types";

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
          <>
            <div className="flex justify-between items-center my-4">
              <h3 className="text-lg font-semibold">Transaction List</h3>
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
            <FinancialOverviewCard
              title="Financial Logs"
              logs={financialLogs}
              type="logs"
            >
              {(filteredData) => {
                const filteredLogs = filteredData.filter(
                  (item): item is FinancialLog =>
                    (item as FinancialLog).description !== undefined &&
                    (item as FinancialLog).category !== undefined
                );
                return <FinancialLogsManager logs={filteredLogs} />;
              }}
            </FinancialOverviewCard>
          </>
        ),
      },
      {
        id: "balances",
        label: "Balances",
        icon: <Scale className="h-4 w-4" />,
        content: (
          <>
            <div className="flex justify-between items-center my-4">
              <h3 className="text-lg font-semibold">Current Balances</h3>
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
            <FinancialOverviewCard
              title="Account Balances"
              balances={financialBalances}
              type="balances"
            >
              {(filteredData) => {
                const filteredBalances = filteredData.filter(
                  (item): item is FinancialBalance =>
                    (item as FinancialBalance).account_name !== undefined &&
                    (item as FinancialBalance).account_type !== undefined &&
                    (item as FinancialBalance).account_owner !== undefined
                );
                return <FinancialBalancesManager balances={filteredBalances} />;
              }}
            </FinancialOverviewCard>
          </>
        ),
      },
      {
        id: "paycheck",
        label: "Paycheck",
        icon: <Banknote className="h-4 w-4" />,
        content: (
          <>
            <div className="flex justify-between items-center my-4">
              <h3 className="text-lg font-semibold">Paycheck Details</h3>
              <Button
                onClick={() => handleAddNew("paycheck_info", "Paycheck Item")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Paycheck Item
              </Button>
            </div>
            <FinancialOverviewCard
              title="Paycheck Information"
              paychecks={paycheckInfo}
              type="paycheck"
            >
              {(filteredData) => {
                const filteredPaychecks = filteredData.filter(
                  (item): item is PaycheckInfo =>
                    (item as PaycheckInfo).deduction_type !== undefined &&
                    (item as PaycheckInfo).category !== undefined
                );
                return <PaycheckLogsManager paychecks={filteredPaychecks} />;
              }}
            </FinancialOverviewCard>
          </>
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
            <FinancialFilesManager files={financialFiles} />
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
        <MultiModeAddDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          title={currentDatasetTitle}
          datasetId={currentDataset}
          fieldDefinitions={getDatasetFields(currentDataset)}
          availableModes={
            currentDataset === "financial_files"
              ? ["single"]
              : ["single", "multiple", "bulk"]
          }
          onSuccess={() => handleAddSuccess()}
          recentEntries={
            currentDataset === "financial_logs"
              ? financialLogs.slice(-10)
              : currentDataset === "financial_balances"
                ? financialBalances.slice(-10)
                : currentDataset === "paycheck_info"
                  ? paycheckInfo.slice(-10)
                  : currentDataset === "financial_files"
                    ? financialFiles.slice(-10)
                    : []
          }
          existingEntries={
            currentDataset === "financial_logs"
              ? financialLogs
              : currentDataset === "financial_balances"
                ? financialBalances
                : currentDataset === "paycheck_info"
                  ? paycheckInfo
                  : currentDataset === "financial_files"
                    ? financialFiles
                    : []
          }
        />
      )}
    </FeatureLayout>
  );
}
