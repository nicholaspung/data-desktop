import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { FEATURE_ICONS } from "@/lib/icons";
import { FileText } from "lucide-react";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { registerDashboardSummary } from "@/lib/dashboard-registry";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FinancialFile } from "@/features/financial/types";
import { HealthFile } from "@/features/health/types";

export default function FilesDashboardSummary() {
  const rawFinancialFiles = useStore(
    dataStore,
    (state) => state.financial_files as FinancialFile[]
  );
  const financialFiles = useMemo(
    () => rawFinancialFiles || [],
    [rawFinancialFiles]
  );

  const rawHealthFiles = useStore(
    dataStore,
    (state) => state.health_files as HealthFile[]
  );
  const healthFiles = useMemo(() => rawHealthFiles || [], [rawHealthFiles]);

  const fileSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const financialFileCount = financialFiles.reduce((sum, record) => {
      return sum + (record.files?.length || 0);
    }, 0);

    const healthFileCount = healthFiles.reduce((sum, record) => {
      return sum + (record.files?.length || 0);
    }, 0);

    const yearlyFinancialFiles = financialFiles.filter((file) => {
      const fileDate = new Date(file.date);
      return fileDate >= yearStart && fileDate <= yearEnd;
    });

    const yearlyHealthFiles = healthFiles.filter((file) => {
      const fileDate = new Date(file.date);
      return fileDate >= yearStart && fileDate <= yearEnd;
    });

    const yearlyFinancialFileCount = yearlyFinancialFiles.reduce(
      (sum, record) => {
        return sum + (record.files?.length || 0);
      },
      0
    );

    const yearlyHealthFileCount = yearlyHealthFiles.reduce((sum, record) => {
      return sum + (record.files?.length || 0);
    }, 0);

    const latestFinancialDate = financialFiles.length
      ? new Date(
          Math.max(
            ...financialFiles.map((f) =>
              f.lastModified
                ? new Date(f.lastModified).getTime()
                : new Date(f.date).getTime()
            )
          )
        )
      : null;

    const latestHealthDate = healthFiles.length
      ? new Date(
          Math.max(
            ...healthFiles.map((f) =>
              f.lastModified
                ? new Date(f.lastModified).getTime()
                : new Date(f.date).getTime()
            )
          )
        )
      : null;

    return {
      financialFileCount,
      healthFileCount,
      totalFileCount: financialFileCount + healthFileCount,
      yearlyFinancialFileCount,
      yearlyHealthFileCount,
      yearlyTotalFileCount: yearlyFinancialFileCount + yearlyHealthFileCount,
      latestFinancialDate,
      latestHealthDate,
      currentYear,
    };
  }, [financialFiles, healthFiles]);

  const hasData = financialFiles.length > 0 || healthFiles.length > 0;

  if (!hasData) {
    return (
      <ReusableSummary
        title="Files"
        titleIcon={<FileText className="h-5 w-5 text-primary" />}
        linkText="View Files"
        linkTo="/files"
        emptyState={{
          message: "No files uploaded yet",
          actionText: "Upload Files",
          actionTo: "/files",
        }}
      />
    );
  }

  interface SectionItem {
    label: string;
    value: React.ReactNode;
    subText?: string;
  }

  interface Section {
    title?: string;
    items: SectionItem[];
    columns: 1 | 2;
    className?: string;
  }

  const renderSection = (section: Section, index: number, isLast: boolean) => (
    <div key={index}>
      <div className={section.className}>
        {section.title && (
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium">{section.title}</p>
          </div>
        )}
        <div
          className={`grid gap-3 ${
            section.columns === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {section.items.map((item: SectionItem, itemIndex: number) => (
            <div key={itemIndex} className="space-y-1">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="text-lg font-semibold">{item.value}</div>
              {item.subText && (
                <div className="text-xs text-muted-foreground">
                  {item.subText}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {!isLast && <Separator className="my-4" />}
    </div>
  );

  const sections = [
    {
      title: "Total Files",
      items: [
        {
          label: "All Files",
          value: (
            <div className="flex items-center gap-2">
              <span className="text-primary">{fileSummary.totalFileCount}</span>
              <Badge variant="outline" className="text-xs">
                Total
              </Badge>
            </div>
          ),
          subText: `${fileSummary.financialFileCount} financial, ${fileSummary.healthFileCount} health`,
        },
      ],
      columns: 1 as const,
    },
    {
      title: `${fileSummary.currentYear} Uploads`,
      items: [
        {
          label: "Financial Files",
          value: (
            <div className="flex items-center gap-1">
              <FEATURE_ICONS.RECEIPT className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600">
                {fileSummary.yearlyFinancialFileCount}
              </span>
            </div>
          ),
          subText: fileSummary.latestFinancialDate
            ? `Last: ${fileSummary.latestFinancialDate.toLocaleDateString()}`
            : "No uploads yet",
        },
        {
          label: "Health Files",
          value: (
            <div className="flex items-center gap-1">
              <FEATURE_ICONS.HEART_PULSE className="h-4 w-4 text-green-600" />
              <span className="text-green-600">
                {fileSummary.yearlyHealthFileCount}
              </span>
            </div>
          ),
          subText: fileSummary.latestHealthDate
            ? `Last: ${fileSummary.latestHealthDate.toLocaleDateString()}`
            : "No uploads yet",
        },
      ],
      columns: 2 as const,
    },
  ];

  return (
    <ReusableSummary
      title="Files"
      titleIcon={<FileText className="h-5 w-5 text-primary" />}
      linkText="View All Files"
      linkTo="/files"
      customContent={
        <div className="space-y-4">
          {sections.map((section, index) =>
            renderSection(section, index, index === sections.length - 1)
          )}
        </div>
      }
    />
  );
}

registerDashboardSummary({
  route: "/files",
  component: FilesDashboardSummary,
  defaultConfig: {
    id: "/files",
    size: "small",
    height: "large",
    order: 12,
    visible: true,
  },
  datasets: ["financial_files", "health_files"],
  name: "Files",
  description: "Manage and view your document storage",
  icon: FEATURE_ICONS.FILE_TEXT,
});
