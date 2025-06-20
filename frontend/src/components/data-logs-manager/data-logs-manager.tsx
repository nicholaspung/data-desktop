import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableSelect from "@/components/reusable/reusable-select";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import TagInput from "@/components/reusable/tag-input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import {
  Edit,
  Save,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Rows3,
  LayoutList,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api";
import { DataLogsManagerProps } from "./types";
import { FieldDefinition } from "@/types/types";
import { updateEntry, deleteEntry, DataStoreName } from "@/store/data-store";

export default function DataLogsManager<T extends Record<string, any>>({
  logs,
  fieldDefinitions,
  datasetId,
  onUpdate,
  title = "Data Logs",
  formatters = {},
  sortableFields,
  filterableFields,
  defaultSortField,
  defaultSortOrder = "desc",
  compactFields,
  primaryField,
  amountField,
  dateField = "date",
  badgeFields = [],
  tagFields = [],
  hideFields = [],
}: DataLogsManagerProps<T>) {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editedLog, setEditedLog] = useState<Partial<T>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPagination, setShowPagination] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showLogs, setShowLogs] = useState(true);
  const [compactMode, setCompactMode] = useState(true);
  const [sortBy, setSortBy] = useState<string>(defaultSortField || dateField);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);
  const [filterText, setFilterText] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    name: string;
  } | null>(null);

  const getFieldDef = (key: string): FieldDefinition | undefined => {
    return fieldDefinitions.find((f) => f.key === key);
  };

  const enhancedAutocompleteFields: Record<
    string,
    {
      displayFields: string[];
      autoFillFields: string[];
      usePortal?: boolean;
      dropdownPosition?: "top" | "bottom";
    }
  > =
    datasetId === "financial_logs"
      ? {
          description: {
            displayFields: ["category", "tags"],
            autoFillFields: ["category", "tags"],
            usePortal: true,
            dropdownPosition: "top" as const,
          },
          tags: {
            displayFields: [],
            autoFillFields: [],
            usePortal: true,
            dropdownPosition: "top" as const,
          },
        }
      : datasetId === "financial_balances"
        ? {
            account_name: {
              displayFields: ["account_type", "account_owner"],
              autoFillFields: ["account_type", "account_owner"],
              usePortal: true,
              dropdownPosition: "top" as const,
            },
          }
        : datasetId === "paycheck_info"
          ? {
              deduction_type: {
                displayFields: ["category"],
                autoFillFields: ["category"],
                usePortal: true,
                dropdownPosition: "top" as const,
              },
            }
          : {};

  const sortableFieldsList = useMemo(() => {
    if (sortableFields) return sortableFields;

    return fieldDefinitions
      .filter(
        (f) =>
          f.isSearchable ||
          f.key === dateField ||
          (amountField && f.key === amountField)
      )
      .map((f) => f.key);
  }, [sortableFields, fieldDefinitions, dateField, amountField]);

  const filterableFieldsList = useMemo(() => {
    if (filterableFields) return filterableFields;

    return fieldDefinitions
      .filter((f) => f.isSearchable && f.type === "autocomplete")
      .map((f) => f.key);
  }, [filterableFields, fieldDefinitions]);

  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    filterableFieldsList.forEach((field) => {
      const values = new Set<string>();
      logs.forEach((log) => {
        const value = log[field];
        if (value) values.add(String(value));
      });
      options[field] = Array.from(values).sort();
    });
    return options;
  }, [logs, filterableFieldsList]);

  const getAutocompleteOptions = (field: FieldDefinition) => {
    const enhancedConfig = enhancedAutocompleteFields[field.key];

    if (enhancedConfig && enhancedConfig.displayFields.length > 0) {
      const uniqueValues = new Map<string, Record<string, unknown>>();
      logs.forEach((entry: Record<string, unknown>) => {
        const value = entry[field.key];
        if (value && typeof value === "string" && value.trim()) {
          const trimmedValue = value.trim();
          if (!uniqueValues.has(trimmedValue)) {
            uniqueValues.set(trimmedValue, entry);
          }
        }
      });

      return Array.from(uniqueValues.entries())
        .map(([value, entry]) => ({
          id: `${field.key}-${value}`,
          label: value,
          entry: entry,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const existingValues = Array.from(
      new Set(
        logs
          .map((record: Record<string, unknown>) => record[field.key])
          .filter(
            (value: unknown) =>
              value && typeof value === "string" && value.trim() !== ""
          )
      )
    ).sort() as string[];

    return existingValues.map((value) => ({
      id: value,
      label: value,
    }));
  };

  const handleEnhancedAutocompleteSelect = (
    fieldKey: string,
    option: { label: string; entry?: Record<string, unknown> }
  ) => {
    const enhancedConfig = enhancedAutocompleteFields[fieldKey];
    if (!enhancedConfig || !option.entry) return;

    setEditedLog((prev) => ({
      ...prev,
      [fieldKey]: option.label,
    }));

    enhancedConfig.autoFillFields.forEach((autoFillField) => {
      if (option.entry && option.entry[autoFillField]) {
        setEditedLog((prev) => ({
          ...prev,
          [autoFillField]: option.entry![autoFillField],
        }));
      }
    });
  };

  const renderEnhancedAutocompleteItem = (
    fieldKey: string,
    option: {
      label: string;
      entry?: Record<string, unknown>;
      secondaryValue?: string | number;
    }
  ) => {
    const enhancedConfig = enhancedAutocompleteFields[fieldKey];
    if (!enhancedConfig || !option.entry) {
      return (
        <div className="flex flex-row items-center gap-2">
          <span>{option.label}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.label}</span>
        </div>
        {enhancedConfig.displayFields.length > 0 && option.entry && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {enhancedConfig.displayFields.map((fieldName, index) => {
              const value = option.entry?.[fieldName];
              if (!value) return null;

              const colors = [
                "bg-blue-100 text-blue-800",
                "bg-green-100 text-green-800",
                "bg-purple-100 text-purple-800",
              ];
              const colorClass = colors[index % colors.length];

              return (
                <span
                  key={fieldName}
                  className={`px-2 py-0.5 rounded ${colorClass}`}
                >
                  {String(value)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const displayFields = useMemo(() => {
    const fieldsToShow = fieldDefinitions
      .filter((f) => !hideFields.includes(f.key))
      .map((f) => f.key);

    if (compactMode && compactFields) {
      return compactFields.filter((f) => fieldsToShow.includes(f));
    }

    return fieldsToShow;
  }, [fieldDefinitions, hideFields, compactMode, compactFields]);

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      const searchableFields = fieldDefinitions
        .filter((f) => f.isSearchable)
        .map((f) => f.key);

      filtered = filtered.filter((log) =>
        searchableFields.some((field) => {
          const value = log[field];
          if (!value) return false;
          return String(value).toLowerCase().includes(searchTerm);
        })
      );
    }

    Object.entries(filterValues).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter((log) => String(log[field]) === value);
      }
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (getFieldDef(sortBy)?.type === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (getFieldDef(sortBy)?.type === "number") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [logs, filterText, filterValues, sortBy, sortOrder, fieldDefinitions]);

  const latestLogDate = useMemo(() => {
    if (logs.length === 0 || !dateField) return null;
    const sortedByDate = [...logs].sort(
      (a, b) =>
        new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime()
    );
    return sortedByDate[0][dateField];
  }, [logs, dateField]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);
  const startIndex = showPagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = showPagination
    ? startIndex + itemsPerPage
    : filteredAndSortedLogs.length;
  const displayedLogs = filteredAndSortedLogs.slice(startIndex, endIndex);

  const handleEdit = (e: React.MouseEvent, log: T) => {
    e.stopPropagation();
    setEditingLogId(log.id);
    const editData: Partial<T> = {};
    fieldDefinitions.forEach((field) => {
      if (field.key in log) {
        editData[field.key as keyof T] = log[field.key];
      }
    });
    setEditedLog(editData);
    setEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditedLog({});
    setEditDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingLogId || !editedLog) return;

    try {
      const updatedRecord = await ApiService.updateRecord(
        editingLogId,
        editedLog
      );
      if (updatedRecord) {
        updateEntry(editingLogId, updatedRecord, datasetId as DataStoreName);
        toast.success(`${title} updated successfully`);
        setEditingLogId(null);
        setEditedLog({});
        setEditDialogOpen(false);
        onUpdate?.();
      }
    } catch (error) {
      toast.error(`Failed to update ${title}`);
      console.error(error);
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      const success = await ApiService.deleteRecord(logId);
      if (success) {
        deleteEntry(logId, datasetId as DataStoreName);
        toast.success(`${title} deleted successfully`);
        onUpdate?.();
      }
    } catch (error) {
      toast.error(`Failed to delete ${title}`);
      console.error(error);
    }
  };

  const handleFileClick = (
    filePath: string | object,
    originalFileName?: string
  ) => {
    const pathString = String(filePath || "");

    const fileName =
      originalFileName ||
      (pathString.includes("/")
        ? pathString.split("/").pop() || pathString
        : pathString);
    setSelectedFile({ path: pathString, name: fileName });
    setDownloadDialogOpen(true);
  };

  const handleDownloadFile = async () => {
    if (!selectedFile) return;

    try {
      await ApiService.downloadFile(selectedFile.path, selectedFile.name);
      setDownloadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(`Failed to download ${selectedFile.name}`);
      console.error(error);
    }
  };

  const formatValue = (
    value: unknown,
    field: string,
    record: T
  ): string | React.ReactNode => {
    if (formatters[field]) {
      return formatters[field](value, record);
    }

    const fieldDef = getFieldDef(field);
    if (!fieldDef) return String(value || "");

    if (fieldDef.type === "file-multiple" || fieldDef.type === "file") {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return "No files";
      }

      const files = Array.isArray(value) ? value : [value];
      return (
        <div className="flex gap-1 flex-wrap">
          {files.map(
            (
              fileItem:
                | string
                | {
                    id?: string;
                    src?: string;
                    name?: string;
                    [key: string]: unknown;
                  },
              index: number
            ) => {
              let fileName: string;
              let filePath: string;

              if (typeof fileItem === "string") {
                fileName = fileItem.includes("/")
                  ? fileItem.split("/").pop() || fileItem
                  : fileItem;
                filePath = fileItem;
              } else if (fileItem && typeof fileItem === "object") {
                fileName = fileItem.name || "Unknown file";
                filePath = fileItem.src || fileItem.name || "";
              } else {
                return null;
              }

              if (!fileName.trim()) {
                return null;
              }

              return (
                <button
                  key={(typeof fileItem === "object" && fileItem?.id) || index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileClick(filePath, fileName);
                  }}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  {fileName}
                </button>
              );
            }
          )}
        </div>
      );
    }

    if (field === amountField || fieldDef.unit === "$") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Number(value) || 0);
    }

    if (fieldDef.type === "date") {
      return format(new Date(value as string), "MMM d, yyyy");
    }

    if (fieldDef.type === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value || "");
  };

  const renderCompactLog = (log: T, index: number) => {
    const primaryValue = primaryField ? log[primaryField] : null;

    return (
      <div
        key={log.id}
        className={cn(
          "cursor-pointer transition-all p-2 flex items-center justify-between gap-2",
          index % 2 === 0 ? "bg-muted/30" : "bg-background"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {dateField && log[dateField] && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(log[dateField]), "MMM d, yyyy")}
            </span>
          )}

          {primaryValue && (
            <span className="font-medium text-sm truncate">
              {formatValue(primaryValue, primaryField!, log)}
            </span>
          )}

          {badgeFields.map((field) =>
            log[field] ? (
              <Badge key={field} variant="outline" className="text-xs shrink-0">
                {formatValue(log[field], field, log)}
              </Badge>
            ) : null
          )}

          {tagFields.map((field) =>
            log[field] ? (
              <div key={field} className="flex gap-1 ml-2 flex-wrap">
                {String(log[field])
                  .split(",")
                  .map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs px-1 py-0"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
              </div>
            ) : null
          )}

          {compactFields &&
            compactFields
              .filter(
                (field) =>
                  field !== dateField &&
                  field !== primaryField &&
                  !badgeFields.includes(field) &&
                  !tagFields.includes(field) &&
                  log[field] !== undefined &&
                  log[field] !== null &&
                  log[field] !== ""
              )
              .map((field) => (
                <div key={field} className="text-xs">
                  {formatValue(log[field], field, log)}
                </div>
              ))}
        </div>

        <div className="flex items-center gap-1">
          {amountField && log[amountField] !== undefined && (
            <span
              className={cn(
                "font-medium text-sm whitespace-nowrap",
                Number(log[amountField]) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {formatValue(log[amountField], amountField, log)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => handleEdit(e, log)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDeleteDialog
              variant="ghost"
              size="sm"
              onConfirm={() => handleDelete(log.id)}
              title={`Delete ${title}`}
              description={`Are you sure you want to delete this record? This action cannot be undone.`}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDetailedLog = (log: T, index: number) => {
    return (
      <div
        key={log.id}
        className={cn(
          "cursor-pointer transition-all p-3",
          index % 2 === 0 ? "bg-muted/30" : "bg-background"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {primaryField && log[primaryField] && (
                <span className="font-medium">
                  {formatValue(log[primaryField], primaryField, log)}
                </span>
              )}
              {badgeFields.map((field) =>
                log[field] ? (
                  <Badge key={field} variant="outline" className="text-xs">
                    {formatValue(log[field], field, log)}
                  </Badge>
                ) : null
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {displayFields
                .filter(
                  (field) =>
                    field !== primaryField &&
                    !badgeFields.includes(field) &&
                    !tagFields.includes(field) &&
                    log[field] !== undefined
                )
                .map((field) => (
                  <span key={field}>
                    {getFieldDef(field)?.displayName}:{" "}
                    {formatValue(log[field], field, log)}
                  </span>
                ))}
            </div>

            {tagFields.map((field) =>
              log[field] ? (
                <div key={field} className="flex gap-1 flex-wrap mt-2">
                  {String(log[field])
                    .split(",")
                    .map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.trim()}
                      </Badge>
                    ))}
                </div>
              ) : null
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleEdit(e, log)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDeleteDialog
                variant="ghost"
                size="sm"
                onConfirm={() => handleDelete(log.id)}
                title={`Delete ${title}`}
                description={`Are you sure you want to delete this record? This action cannot be undone.`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-logs"
          checked={showLogs}
          onCheckedChange={setShowLogs}
        />
        <Label htmlFor="show-logs" className="flex items-center gap-2">
          {showLogs ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          {showLogs ? `Hide ${title}` : `Show ${title}`}
        </Label>
        {latestLogDate && dateField && (
          <span className="text-sm text-muted-foreground ml-2">
            Latest: {format(new Date(latestLogDate), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {showLogs && (
        <div>
          <ReusableCard
            title={`${title} (${filteredAndSortedLogs.length} of ${logs.length} total)`}
            headerActions={
              <>
                <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="compact-mode"
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                    <Label
                      htmlFor="compact-mode"
                      className="flex items-center gap-1 text-sm whitespace-nowrap"
                    >
                      {compactMode ? (
                        <Rows3 className="h-4 w-4" />
                      ) : (
                        <LayoutList className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {compactMode ? "Compact" : "Detailed"}
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pagination"
                      checked={showPagination}
                      onCheckedChange={setShowPagination}
                    />
                    <Label
                      htmlFor="pagination"
                      className="text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Pagination</span>
                    </Label>
                  </div>
                  {showPagination && (
                    <ReusableSelect
                      options={[
                        { id: "5", label: "5" },
                        { id: "10", label: "10" },
                        { id: "20", label: "20" },
                        { id: "50", label: "50" },
                      ]}
                      value={itemsPerPage.toString()}
                      onChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                      triggerClassName="w-16 sm:w-20"
                    />
                  )}
                  {showPagination && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm whitespace-nowrap px-1">
                        <span className="hidden sm:inline">Page </span>
                        {currentPage}
                        <span className="hidden sm:inline">
                          {" "}
                          of {totalPages}
                        </span>
                        <span className="sm:hidden">/{totalPages}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            }
            content={
              <div className="space-y-4">
                <div className="space-y-3 border-b pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Search..."
                      value={filterText}
                      onChange={(e) => {
                        setFilterText(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-sm"
                    />
                    {filterableFieldsList.map((field) => (
                      <ReusableSelect
                        key={field}
                        options={[
                          {
                            id: `_all_${field}_`,
                            label: `All ${getFieldDef(field)?.displayName || field}`,
                          },
                          ...filterOptions[field].map((value) => ({
                            id: value,
                            label: value,
                          })),
                        ]}
                        value={filterValues[field] || `_all_${field}_`}
                        onChange={(value) => {
                          setFilterValues((prev) => ({
                            ...prev,
                            [field]: value === `_all_${field}_` ? "" : value,
                          }));
                          setCurrentPage(1);
                        }}
                        placeholder={`Select ${getFieldDef(field)?.displayName || field}`}
                        triggerClassName="text-sm"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <ReusableSelect
                      options={sortableFieldsList.map((field) => ({
                        id: field,
                        label: getFieldDef(field)?.displayName || field,
                      }))}
                      value={sortBy}
                      onChange={(value) => setSortBy(value)}
                      placeholder="Sort by"
                      triggerClassName="text-sm w-32"
                    />
                    <ReusableSelect
                      options={[
                        { id: "desc", label: "Descending" },
                        { id: "asc", label: "Ascending" },
                      ]}
                      value={sortOrder}
                      onChange={(value) =>
                        setSortOrder(value as "asc" | "desc")
                      }
                      placeholder="Sort order"
                      triggerClassName="text-sm w-32"
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-2 overflow-y-auto pr-2",
                    compactMode ? "max-h-[400px]" : "max-h-[520px]"
                  )}
                >
                  {displayedLogs.map((log, index) =>
                    compactMode
                      ? renderCompactLog(log, index)
                      : renderDetailedLog(log, index)
                  )}
                </div>
              </div>
            }
            showHeader={true}
            cardClassName="h-fit"
            contentClassName="relative"
          />
        </div>
      )}

      {editingLogId &&
        (() => {
          const editingLog = logs.find((log) => log.id === editingLogId);
          if (!editingLog) return null;

          return (
            <ReusableDialog
              title={`Edit ${title}`}
              description={`Update the details of your record`}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onConfirm={handleSaveEdit}
              onCancel={handleCancelEdit}
              confirmText="Save Changes"
              confirmIcon={<Save />}
              customContent={
                <div className="space-y-4 mt-4">
                  {fieldDefinitions
                    .filter((field) => !field.isRelation && field.key !== "id")
                    .map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`edit-${field.key}`}>
                          {field.displayName}
                        </Label>
                        {field.type === "date" ? (
                          <>
                            <Input
                              id={`edit-${field.key}`}
                              type="date"
                              value={
                                (editedLog[field.key as keyof T] as string) ||
                                ""
                              }
                              onChange={(e) =>
                                setEditedLog({
                                  ...editedLog,
                                  [field.key]: e.target.value,
                                })
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Current:{" "}
                              {editingLog[field.key]
                                ? format(
                                    new Date(editingLog[field.key]),
                                    "MMM d, yyyy"
                                  )
                                : "Not set"}
                            </p>
                          </>
                        ) : field.type === "number" ? (
                          <>
                            <Input
                              id={`edit-${field.key}`}
                              type="number"
                              step="0.01"
                              value={
                                (editedLog[field.key as keyof T] as number) ||
                                ""
                              }
                              onChange={(e) =>
                                setEditedLog({
                                  ...editedLog,
                                  [field.key]: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                              placeholder={String(editingLog[field.key] || "")}
                              className="mt-1"
                            />
                            {field.unit === "$" && (
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  Number(editingLog[field.key]) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                Current:{" "}
                                {formatValue(
                                  editingLog[field.key],
                                  field.key,
                                  editingLog
                                )}
                              </p>
                            )}
                          </>
                        ) : field.type === "autocomplete" ? (
                          <>
                            <AutocompleteInput
                              id={`edit-${field.key}`}
                              label=""
                              value={
                                (editedLog[field.key as keyof T] as string) ||
                                ""
                              }
                              onChange={(value) =>
                                setEditedLog({
                                  ...editedLog,
                                  [field.key]: value,
                                })
                              }
                              onSelect={
                                enhancedAutocompleteFields[field.key]
                                  ? (option) =>
                                      handleEnhancedAutocompleteSelect(
                                        field.key,
                                        option
                                      )
                                  : undefined
                              }
                              options={getAutocompleteOptions(field)}
                              placeholder={`Enter ${field.displayName.toLowerCase()}...`}
                              emptyMessage="Type to add new option"
                              showRecentOptions={
                                !enhancedAutocompleteFields[field.key]
                              }
                              maxRecentOptions={5}
                              usePortal={
                                enhancedAutocompleteFields[field.key]
                                  ?.usePortal || true
                              }
                              dropdownPosition={
                                enhancedAutocompleteFields[field.key]
                                  ?.dropdownPosition || "top"
                              }
                              renderItem={
                                enhancedAutocompleteFields[field.key]
                                  ? (option) =>
                                      renderEnhancedAutocompleteItem(
                                        field.key,
                                        option
                                      )
                                  : undefined
                              }
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {editingLog[field.key] || "Not set"}
                            </p>
                          </>
                        ) : field.type === "tags" ? (
                          <>
                            <TagInput
                              value={
                                (editedLog[field.key as keyof T] as string) ||
                                ""
                              }
                              onChange={(value) =>
                                setEditedLog({
                                  ...editedLog,
                                  [field.key]: value,
                                })
                              }
                              generalData={logs}
                              generalDataTagField={field.key}
                              usePortal={true}
                              dropdownPosition="top"
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {editingLog[field.key] || "Not set"}
                            </p>
                          </>
                        ) : field.type === "boolean" ? (
                          <>
                            <div className="flex items-center space-x-2 mt-1">
                              <Checkbox
                                id={`edit-${field.key}`}
                                checked={
                                  (editedLog[
                                    field.key as keyof T
                                  ] as boolean) || false
                                }
                                onCheckedChange={(checked) =>
                                  setEditedLog({
                                    ...editedLog,
                                    [field.key]: checked,
                                  })
                                }
                              />
                              <Label
                                htmlFor={`edit-${field.key}`}
                                className="text-sm"
                              >
                                {field.displayName}
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {editingLog[field.key] ? "Yes" : "No"}
                            </p>
                          </>
                        ) : (
                          <>
                            <Input
                              id={`edit-${field.key}`}
                              value={
                                (editedLog[field.key as keyof T] as string) ||
                                ""
                              }
                              onChange={(e) =>
                                setEditedLog({
                                  ...editedLog,
                                  [field.key]: e.target.value,
                                })
                              }
                              placeholder={String(editingLog[field.key] || "")}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Current: {editingLog[field.key] || "Not set"}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              }
              showTrigger={false}
            />
          );
        })()}

      <ReusableDialog
        title="Download File"
        description={`Do you want to download "${selectedFile?.name}"?`}
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        onConfirm={handleDownloadFile}
        onCancel={() => {
          setDownloadDialogOpen(false);
          setSelectedFile(null);
        }}
        confirmText="Download"
        confirmIcon={<Download className="h-4 w-4" />}
        showTrigger={false}
      />
    </div>
  );
}
