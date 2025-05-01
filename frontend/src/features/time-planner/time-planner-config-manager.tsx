// src/features/time-planner/time-planner-config-manager.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen } from "lucide-react";
import { TimeBlock, TimeBlockConfig } from "./types";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmChangesDialog } from "@/components/reusable/confirm-changes-dialog";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

interface TimePlannerConfigManagerProps {
  currentTimeBlocks: Record<number, TimeBlock[]>;
  onLoadConfig: (blocks: Record<number, TimeBlock[]>) => void;
}

export default function TimePlannerConfigManager({
  currentTimeBlocks,
  onLoadConfig,
}: TimePlannerConfigManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [configToLoad, setConfigToLoad] = useState<TimeBlockConfig | null>(
    null
  );
  const [savedConfigs, setSavedConfigs] = useState<TimeBlockConfig[]>([]);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigDescription, setNewConfigDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved configs when component mounts
  useEffect(() => {
    loadSavedConfigs();
  }, []);

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

  const handleSaveConfig = async () => {
    if (!newConfigName.trim()) {
      toast.error("Please enter a name for your configuration");
      return;
    }

    setLoading(true);
    try {
      // Convert blocks object to array for storage
      const blocksArray = Object.values(currentTimeBlocks).flat();

      // Create config object
      const newConfig: Omit<
        TimeBlockConfig,
        "id" | "createdAt" | "lastModified"
      > = {
        name: newConfigName,
        description: newConfigDescription || undefined,
        blocks: blocksArray,
      };

      await ApiService.addRecord("time_planner_configs", newConfig);
      toast.success("Configuration saved successfully");
      setSaveDialogOpen(false);

      // Reset form
      setNewConfigName("");
      setNewConfigDescription("");

      // Reload configs
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

    // If there are existing blocks, show confirmation dialog
    if (Object.keys(currentTimeBlocks).length > 0) {
      setConfirmDialogOpen(true);
    } else {
      // If no existing blocks, load directly
      processConfigLoad(config);
    }

    setLoadDialogOpen(false);
  };

  const processConfigLoad = (config: TimeBlockConfig) => {
    // Load saved categories first
    loadCategories(config.blocks);

    // Convert blocks array back to record structure
    const blocksByDay: Record<number, TimeBlock[]> = {};

    config.blocks.forEach((block) => {
      if (!blocksByDay[block.dayOfWeek]) {
        blocksByDay[block.dayOfWeek] = [];
      }
      blocksByDay[block.dayOfWeek].push(block);
    });

    // Update the planner
    onLoadConfig(blocksByDay);
    toast.success(`Loaded configuration: ${config.name}`);
  };

  // Helper function to ensure all categories from config blocks are added to localStorage
  const loadCategories = (blocks: TimeBlock[]) => {
    // Get existing categories from localStorage
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

    // Get unique categories from blocks
    const categoryMap = new Map<string, { name: string; color: string }>();

    // First build a map of categories from the blocks
    blocks.forEach((block) => {
      if (block.category && !categoryMap.has(block.category)) {
        categoryMap.set(block.category, {
          name: block.category,
          color: block.color || "#3b82f6",
        });
      }
    });

    // Then check if each category exists in our existing categories
    let hasNewCategories = false;
    categoryMap.forEach((categoryData, categoryName) => {
      const exists = categories.some((cat) => cat.name === categoryName);
      if (!exists) {
        // Add the missing category with a new ID
        categories.push({
          id: crypto.randomUUID(),
          name: categoryName,
          color: categoryData.color,
        });
        hasNewCategories = true;
      }
    });

    // Save updated categories if there are new ones
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Configurations
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save Current Configuration
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Load Configuration
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Dialog */}
      <ReusableDialog
        title="Save Configuration"
        description="Save your current time blocks as a named configuration."
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleSaveConfig}
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
