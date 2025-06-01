import { useState, useEffect } from "react";
import { TimeCategory } from "@/store/time-tracking-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Plus, Tags } from "lucide-react";
import { ApiService } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import dataStore, {
  addEntry,
  deleteEntry,
  updateEntry,
} from "@/store/data-store";
import ReusableCard from "@/components/reusable/reusable-card";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { useStore } from "@tanstack/react-store";

interface TimeCategoryManagerProps {
  isLoading: boolean;
  onDataChange: () => void;
}

const getRandomColor = (): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#0ea5e9",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#9333ea",
    "#06b6d4",
    "#d946ef",
    "#f43f5e",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

export default function TimeCategoryManager({
  isLoading,
  onDataChange,
}: TimeCategoryManagerProps) {
  const categories = useStore(dataStore, (state) => state.time_categories);

  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setNewColor(getRandomColor());
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory) return;

    try {
      setIsAdding(true);

      const category = await ApiService.addRecord("time_categories", {
        name: newCategory,
        color: newColor,
      });

      if (category) {
        addEntry(category, "time_categories");
        setNewCategory("");
        setNewColor(getRandomColor());
        onDataChange();
      }
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (category: TimeCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || getRandomColor());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const saveEditing = async () => {
    if (!editingId || !editName) return;

    try {
      const updatedCategory = await ApiService.updateRecord(editingId, {
        name: editName,
        color: editColor,
      });

      if (updatedCategory) {
        updateEntry(editingId, updatedCategory, "time_categories");
        onDataChange();
      }

      cancelEditing();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDelete = async (category: TimeCategory) => {
    try {
      await ApiService.deleteRecord(category.id);
      deleteEntry(category.id, "time_categories");
      onDataChange();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const addCategoryForm = (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <div className="flex-1">
        <Label htmlFor="new-category" className="sr-only">
          New Category
        </Label>
        <Input
          id="new-category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
        />
      </div>
      <div>
        <Label htmlFor="new-color" className="sr-only">
          Color
        </Label>
        <Input
          id="new-color"
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-16 p-1 h-10"
        />
      </div>
      <Button onClick={handleAddCategory} disabled={!newCategory || isAdding}>
        <Plus className="h-4 w-4 mr-2" />
        {isAdding ? "Adding..." : "Add"}
      </Button>
    </div>
  );

  const categoryList = (
    <div className="space-y-2">
      {categories.length === 0 ? (
        <div className="text-center py-6">
          <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No categories yet. Create your first category above.
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-row items-center border rounded-md p-3"
          >
            {editingId === category.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
                <Input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-16 p-1 h-10"
                />
                <div className="flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <div className="flex gap-2 flex-row items-center">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditing} disabled={!editName}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-row items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full mr-3"
                  style={{ backgroundColor: category.color || "#3b82f6" }}
                />
                <div className="flex-1 font-medium">{category.name}</div>
                <div className="flex flex-row items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <ConfirmDeleteDialog
                    title={`Delete "${category.name}" Category`}
                    description={`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`}
                    onConfirm={() => handleDelete(category)}
                    size="icon"
                    variant="ghost"
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const fullContent = (
    <div className="space-y-4">
      {addCategoryForm}
      {categoryList}
    </div>
  );

  return (
    <ReusableCard
      title="Time Categories"
      content={fullContent}
      showHeader={true}
    />
  );
}
