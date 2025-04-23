// src/features/time-tracker/time-category-manager.tsx
import { useState } from "react";
import { TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash, Plus, Tags } from "lucide-react";
import { ApiService } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { addEntry, deleteEntry, updateEntry } from "@/store/data-store";

interface TimeCategoryManagerProps {
  categories: TimeCategory[];
  isLoading: boolean;
  onDataChange: () => void;
}

export default function TimeCategoryManager({
  categories,
  isLoading,
  onDataChange,
}: TimeCategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
        setNewColor("#3b82f6");
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
    setEditColor(category.color || "#3b82f6");
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
    if (
      !confirm(
        `Are you sure you want to delete the category "${category.name}"?`
      )
    ) {
      return;
    }

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
      <Card>
        <CardHeader>
          <CardTitle>Time Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new category */}
          <div className="flex flex-col sm:flex-row gap-2">
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
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory || isAdding}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </div>

          {/* List categories */}
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No categories yet. Create your first category above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center border rounded-md p-3"
                >
                  {editingId === category.id ? (
                    // Edit mode
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-16 p-1 h-10"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEditing}
                          disabled={!editName}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div
                        className="w-6 h-6 rounded-full mr-3"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
                      />
                      <div className="flex-1 font-medium">{category.name}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
