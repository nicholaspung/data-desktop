import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReusableCard from "@/components/reusable/reusable-card";
import ReusableSelect from "@/components/reusable/reusable-select";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FinancialLog } from "@/features/financial/types";
import { ApiService } from "@/services/api";

interface FinancialLogsManagerProps {
  logs: FinancialLog[];
  onUpdate?: () => void;
}

export default function FinancialLogsManager({
  logs,
  onUpdate,
}: FinancialLogsManagerProps) {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editedLog, setEditedLog] = useState<Partial<FinancialLog>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPagination, setShowPagination] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showLogs, setShowLogs] = useState(true);
  const [compactMode, setCompactMode] = useState(true);
  const [sortBy, setSortBy] = useState<
    "date" | "amount" | "description" | "category"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply text filter (searches description, category, and tags)
    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description.toLowerCase().includes(searchTerm) ||
          log.category.toLowerCase().includes(searchTerm) ||
          (log.tags && log.tags.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter((log) => log.category === filterCategory);
    }

    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(
        (log) =>
          log.tags && log.tags.toLowerCase().includes(filterTag.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [logs, filterText, filterCategory, filterTag, sortBy, sortOrder]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.category))).sort();
  }, [logs]);

  // Get unique tags for filter dropdown
  const uniqueTags = useMemo(() => {
    const allTags = logs
      .filter((log) => log.tags)
      .flatMap((log) => log.tags!.split(",").map((tag) => tag.trim()))
      .filter((tag) => tag.length > 0);
    return Array.from(new Set(allTags)).sort();
  }, [logs]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);
  const startIndex = showPagination ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = showPagination
    ? startIndex + itemsPerPage
    : filteredAndSortedLogs.length;
  const displayedLogs = filteredAndSortedLogs.slice(startIndex, endIndex);


  const handleEdit = (e: React.MouseEvent, log: FinancialLog) => {
    e.stopPropagation();
    setEditingLogId(log.id);
    setEditedLog({
      date: log.date,
      amount: log.amount,
      description: log.description,
      category: log.category,
      tags: log.tags,
    });
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
      await ApiService.updateRecord(editingLogId, editedLog);
      toast.success("Financial log updated successfully");
      setEditingLogId(null);
      setEditedLog({});
      setEditDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update financial log");
      console.error(error);
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await ApiService.deleteRecord(logId);
      toast.success("Financial log deleted successfully");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete financial log");
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Show/Hide Logs Control */}
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
          {showLogs ? "Hide Logs" : "Show Logs"}
        </Label>
      </div>

      {showLogs && (
        <div>
          {/* Logs List */}
          <ReusableCard
            title={`Financial Logs (${filteredAndSortedLogs.length} of ${logs.length} total)`}
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
                      <span className="hidden sm:inline">{compactMode ? "Compact" : "Detailed"}</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pagination"
                      checked={showPagination}
                      onCheckedChange={setShowPagination}
                    />
                    <Label htmlFor="pagination" className="text-sm whitespace-nowrap">
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
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm whitespace-nowrap px-1">
                        <span className="hidden sm:inline">Page </span>{currentPage}<span className="hidden sm:inline"> of {totalPages}</span>
                        <span className="sm:hidden">/{totalPages}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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

                {/* Filters and Sorting */}
                <div className="space-y-3 border-b pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Search description, category, or tags..."
                      value={filterText}
                      onChange={(e) => {
                        setFilterText(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-sm"
                    />
                    <ReusableSelect
                      options={[
                        { id: "_all_categories_", label: "All Categories" },
                        ...uniqueCategories.map((cat) => ({
                          id: cat,
                          label: cat,
                        })),
                      ]}
                      value={filterCategory || "_all_categories_"}
                      onChange={(value) => {
                        setFilterCategory(value === "_all_categories_" ? "" : value);
                        setCurrentPage(1);
                      }}
                      placeholder="Select category"
                      triggerClassName="text-sm"
                    />
                    <ReusableSelect
                      options={[
                        { id: "_all_tags_", label: "All Tags" },
                        ...uniqueTags.map((tag) => ({
                          id: tag,
                          label: tag,
                        })),
                      ]}
                      value={filterTag || "_all_tags_"}
                      onChange={(value) => {
                        setFilterTag(value === "_all_tags_" ? "" : value);
                        setCurrentPage(1);
                      }}
                      placeholder="Select tag"
                      triggerClassName="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ReusableSelect
                      options={[
                        { id: "date", label: "Date" },
                        { id: "amount", label: "Amount" },
                        { id: "description", label: "Description" },
                        { id: "category", label: "Category" },
                      ]}
                      value={sortBy}
                      onChange={(value) => setSortBy(value as typeof sortBy)}
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
                        setSortOrder(value as typeof sortOrder)
                      }
                      placeholder="Sort order"
                      triggerClassName="text-sm w-32"
                    />
                  </div>
                </div>

                {/* Logs List */}
                <div
                  className={cn(
                    "space-y-2 overflow-y-auto pr-2",
                    compactMode ? "max-h-[400px]" : "max-h-[520px]"
                  )}
                >
                  {displayedLogs.map((log, index) => (
                    <div
                      key={log.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        compactMode ? "p-2" : "p-3",
                        index % 2 === 0 ? "bg-muted/30" : "bg-background"
                      )}
                    >
                      {compactMode ? (
                        // Compact mode - single line
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.date), "MMM d")}
                            </span>
                            <span className="font-medium text-sm truncate">
                              {log.description}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {log.category}
                            </Badge>
                            {log.tags && (
                              <div className="flex gap-1 ml-2 flex-wrap">
                                {log.tags.split(",").map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs px-1 py-0"
                                  >
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "font-medium text-sm whitespace-nowrap",
                                log.amount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {formatCurrency(log.amount)}
                            </span>
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
                                title="Delete Financial Log"
                                description="Are you sure you want to delete this financial log? This action cannot be undone."
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Detailed mode - original layout
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {log.description}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {log.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>
                                {format(new Date(log.date), "MMM d, yyyy")}
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  log.amount >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {formatCurrency(log.amount)}
                              </span>
                            </div>
                            {log.tags && (
                              <div className="flex gap-1 flex-wrap mt-2">
                                {log.tags.split(",").map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
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
                                title="Delete Financial Log"
                                description="Are you sure you want to delete this financial log? This action cannot be undone."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            }
            showHeader={true}
            cardClassName="h-fit"
            contentClassName="relative"
          />
        </div>
      )}

      {/* Edit Dialog */}
      {editingLogId &&
        (() => {
          const editingLog = logs.find((log) => log.id === editingLogId);
          if (!editingLog) return null;

          return (
            <ReusableDialog
              title="Edit Financial Log"
              description="Update the details of your financial log"
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onConfirm={handleSaveEdit}
              onCancel={handleCancelEdit}
              confirmText="Save Changes"
              confirmIcon={<Save />}
              customContent={
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-date">Date</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editedLog.date || ""}
                        onChange={(e) =>
                          setEditedLog({ ...editedLog, date: e.target.value })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current:{" "}
                        {format(new Date(editingLog.date), "MMM d, yyyy")}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="edit-amount">Amount</Label>
                      <Input
                        id="edit-amount"
                        type="number"
                        step="0.01"
                        value={editedLog.amount || ""}
                        onChange={(e) =>
                          setEditedLog({
                            ...editedLog,
                            amount: Number(e.target.value),
                          })
                        }
                        placeholder={editingLog.amount.toString()}
                        className="mt-1"
                      />
                      <p
                        className={cn(
                          "text-xs mt-1",
                          editingLog.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        Current: {formatCurrency(editingLog.amount)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editedLog.description || ""}
                      onChange={(e) =>
                        setEditedLog({
                          ...editedLog,
                          description: e.target.value,
                        })
                      }
                      placeholder={editingLog.description}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {editingLog.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        value={editedLog.category || ""}
                        onChange={(e) =>
                          setEditedLog({
                            ...editedLog,
                            category: e.target.value,
                          })
                        }
                        placeholder={editingLog.category}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {editingLog.category}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="edit-tags">Tags (optional)</Label>
                      <Input
                        id="edit-tags"
                        value={editedLog.tags || ""}
                        onChange={(e) =>
                          setEditedLog({ ...editedLog, tags: e.target.value })
                        }
                        placeholder={
                          editingLog.tags || "comma, separated, tags"
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {editingLog.tags || "No tags"}
                      </p>
                    </div>
                  </div>
                </div>
              }
              showTrigger={false}
            />
          );
        })()}

    </div>
  );
}
