import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen, Plus } from "lucide-react";
import { TimeBlock, TimeBlockConfig } from "./types";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { ConfirmChangesDialog } from "@/components/reusable/confirm-changes-dialog";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

interface TimePlannerConfigManagerProps {
  currentTimeBlocks: Record<number, TimeBlock[]>;
  onLoadConfig: (blocks: Record<number, TimeBlock[]>) => void;
  onWipeConfig: () => void;
  hasUnsavedChanges: boolean;
  currentConfig: TimeBlockConfig | null;
  onConfigLoaded: (config: TimeBlockConfig | null) => void;
}

export default function TimePlannerConfigManager({
  currentTimeBlocks,
  onLoadConfig,
  onWipeConfig,
  hasUnsavedChanges,
  currentConfig,
  onConfigLoaded,
}: TimePlannerConfigManagerProps) {
  const [saveNewDialogOpen, setSaveNewDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [configToLoad, setConfigToLoad] = useState<TimeBlockConfig | null>(
    null
  );
  const [savedConfigs, setSavedConfigs] = useState<TimeBlockConfig[]>([]);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigDescription, setNewConfigDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedConfigs();
  }, []);

  useEffect(() => {
    const autoLoadLastConfig = async () => {
      if (
        savedConfigs.length > 0 &&
        !currentConfig &&
        Object.keys(currentTimeBlocks).length === 0
      ) {
        const lastConfigId = localStorage.getItem("lastLoadedConfigId");
        if (lastConfigId) {
          const lastConfig = savedConfigs.find(
            (config) => config.id === lastConfigId
          );
          if (lastConfig) {
            await processConfigLoad(lastConfig, false);
            return;
          }
        }

        const mostRecent = [...savedConfigs].sort(
          (a, b) =>
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
        )[0];
        if (mostRecent) {
          await processConfigLoad(mostRecent, false);
        }
      }
    };

    autoLoadLastConfig();
  }, [savedConfigs, currentConfig, currentTimeBlocks]);

  const loadSavedConfigs = async () => {
    setLoading(true);
    try {
      const records = await ApiService.getRecords("time_planner_configs");
      setSavedConfigs(records as TimeBlockConfig[]);
    } catch (error) {
      console.error("Failed to load saved configurations:", error);
      toast.error("Failed to load saved configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!currentConfig) return;

    setLoading(true);
    try {
      const blocksArray = Object.values(currentTimeBlocks).flat();

      const updatedConfig = {
        ...currentConfig,
        blocks: blocksArray,
        lastModified: new Date(),
      };

      await ApiService.updateRecord(currentConfig.id, updatedConfig);
      toast.success(`Updated "${currentConfig.name}" configuration`);

      onConfigLoaded(updatedConfig as TimeBlockConfig);
      await loadSavedConfigs();
    } catch (error) {
      console.error("Failed to update configuration:", error);
      toast.error("Failed to update configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewConfig = async () => {
    if (!newConfigName.trim()) {
      toast.error("Please enter a name for your configuration");
      return;
    }

    setLoading(true);
    try {
      const blocksArray = Object.values(currentTimeBlocks).flat();

      const newConfig: Omit<
        TimeBlockConfig,
        "id" | "createdAt" | "lastModified"
      > = {
        name: newConfigName,
        description: newConfigDescription || undefined,
        blocks: blocksArray,
      };

      const savedConfig = await ApiService.addRecord(
        "time_planner_configs",
        newConfig
      );
      toast.success("Configuration saved successfully");
      setSaveNewDialogOpen(false);

      setNewConfigName("");
      setNewConfigDescription("");

      if (savedConfig) {
        onConfigLoaded(savedConfig as TimeBlockConfig);
        localStorage.setItem("lastLoadedConfigId", savedConfig.id);
      }

      await loadSavedConfigs();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConfig = (config: TimeBlockConfig) => {
    setConfigToLoad(config);

    if (Object.keys(currentTimeBlocks).length > 0) {
      setConfirmDialogOpen(true);
    } else {
      processConfigLoad(config);
    }

    setLoadDialogOpen(false);
  };

  const processConfigLoad = (
    config: TimeBlockConfig,
    showToast: boolean = true
  ) => {
    loadCategories(config.blocks);

    const blocksByDay: Record<number, TimeBlock[]> = {};

    config.blocks.forEach((block) => {
      if (!blocksByDay[block.dayOfWeek]) {
        blocksByDay[block.dayOfWeek] = [];
      }
      blocksByDay[block.dayOfWeek].push(block);
    });

    onLoadConfig(blocksByDay);
    onConfigLoaded(config);
    localStorage.setItem("lastLoadedConfigId", config.id);

    if (showToast) {
      toast.success(`Loaded configuration: ${config.name}`);
    }
  };

  const handleWipeConfig = () => {
    onWipeConfig();
    onConfigLoaded(null);
    localStorage.removeItem("lastLoadedConfigId");
    toast.success("Configuration cleared");
  };

  const loadCategories = (blocks: TimeBlock[]) => {
    let categories: { id: string; name: string; color: string }[] = [];
    try {
      const saved = localStorage.getItem("timeBlockCategories");
      if (saved) {
        categories = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to parse saved categories:", error);
      categories = [];
    }

    const categoryMap = new Map<string, { name: string; color: string }>();

    blocks.forEach((block) => {
      if (block.category && !categoryMap.has(block.category)) {
        categoryMap.set(block.category, {
          name: block.category,
          color: block.color || "#3b82f6",
        });
      }
    });

    let hasNewCategories = false;
    categoryMap.forEach((categoryData, categoryName) => {
      const exists = categories.some((cat) => cat.name === categoryName);
      if (!exists) {
        categories.push({
          id: crypto.randomUUID(),
          name: categoryName,
          color: categoryData.color,
        });
        hasNewCategories = true;
      }
    });

    if (hasNewCategories) {
      localStorage.setItem("timeBlockCategories", JSON.stringify(categories));
    }
  };

  const handleConfirmLoad = () => {
    if (configToLoad) {
      processConfigLoad(configToLoad);
    }
    setConfirmDialogOpen(false);
    setConfigToLoad(null);
  };

  const handleDeleteConfig = async (configId: string) => {
    setLoading(true);
    try {
      await ApiService.deleteRecord(configId);
      toast.success("Configuration deleted successfully");
      await loadSavedConfigs();
    } catch (error) {
      console.error("Failed to delete configuration:", error);
      toast.error("Failed to delete configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* Configuration Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {currentConfig ? (
            <span>
              Configuration:{" "}
              <span className="font-medium">{currentConfig.name}</span>
              {hasUnsavedChanges && (
                <span className="text-orange-600 ml-1">(edited)</span>
              )}
            </span>
          ) : (
            <span>No configuration loaded</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Update current config button - primary when there are changes */}
          {currentConfig && (
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              onClick={handleUpdateConfig}
              disabled={loading || !hasUnsavedChanges}
              className="flex-shrink-0"
            >
              <Save className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                Update "{currentConfig.name}"
              </span>
              <span className="sm:hidden">Update</span>
            </Button>
          )}

          {/* Save as new configuration */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveNewDialogOpen(true)}
            disabled={loading || Object.keys(currentTimeBlocks).length === 0}
            className="flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Save as New</span>
            <span className="sm:hidden">New</span>
          </Button>

          {/* Load configuration */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLoadDialogOpen(true)}
            disabled={loading}
            className="flex-shrink-0"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Load</span>
            <span className="sm:hidden">Load</span>
          </Button>

          {/* Wipe configuration */}
          <ConfirmDeleteDialog
            onConfirm={handleWipeConfig}
            title="Clear Configuration"
            description="This will remove all time blocks. This action cannot be undone."
            size="sm"
          />
        </div>
      </div>

      {/* Save New Configuration Dialog */}
      <ReusableDialog
        title="Save New Configuration"
        description="Save your current time blocks as a new named configuration."
        open={saveNewDialogOpen}
        onOpenChange={setSaveNewDialogOpen}
        onConfirm={handleSaveNewConfig}
        confirmText="Save"
        showTrigger={false}
        loading={loading}
        customContent={
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                placeholder="Weekly Schedule, Work Days, Weekend Plan, etc."
                value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-description">Description (Optional)</Label>
              <Textarea
                id="config-description"
                placeholder="Add some details about this configuration..."
                value={newConfigDescription}
                onChange={(e) => setNewConfigDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        }
      />

      {/* Load Dialog */}
      <ReusableDialog
        title="Load Configuration"
        description="Choose a saved configuration to load."
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        showTrigger={false}
        customContent={
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="text-center py-8">Loading configurations...</div>
            ) : savedConfigs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved configurations found.
              </div>
            ) : (
              <div className="space-y-4">
                {savedConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="border rounded-md p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleSelectConfig(config)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{config.name}</h3>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Last modified:{" "}
                          {new Date(config.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <ConfirmDeleteDialog
                        onConfirm={() => handleDeleteConfig(config.id)}
                        size="sm"
                        variant="ghost"
                        title={`Delete "${config.name}"?`}
                        description="This will permanently remove this saved configuration."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        customFooter={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        }
      />

      {/* Confirm Changes Dialog */}
      <ConfirmChangesDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmLoad}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setConfigToLoad(null);
        }}
        showTrigger={false}
        title="Load Configuration"
        description="Loading this configuration will replace your current time blocks. Unsaved changes will be lost."
      />
    </>
  );
}
