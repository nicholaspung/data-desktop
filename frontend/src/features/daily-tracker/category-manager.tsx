import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Plus, FolderPlus } from "lucide-react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableSelect from "@/components/reusable/reusable-select";
import { useStore } from "@tanstack/react-store";
import dataStore, {
  deleteEntry,
  addEntry,
  updateEntry,
} from "@/store/data-store";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CategoryManager({
  onSuccess,
}: {
  onSuccess?: (categoryId: string, categoryName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];
  const metrics = useStore(dataStore, (state) => state.metrics) || [];

  const categoryOptions = categories.map((cat: any) => ({
    id: cat.id,
    label: cat.name,
  }));

  const selectedCategoryData = categories.find(
    (cat: any) => cat.id === selectedCategory
  );

  const getCategoryMetricCount = (categoryId: string) => {
    return metrics.filter((metric: any) => metric.category_id === categoryId)
      .length;
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const duplicate = categories.some(
      (cat: any) => cat.name.toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (duplicate) {
      toast.error("A category with this name already exists");
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryData = {
        name: categoryName.trim(),
      };

      const response = await ApiService.addRecord(
        "metric_categories",
        categoryData
      );

      if (response) {
        addEntry(response, "metric_categories");
        toast.success("Category created successfully");

        if (onSuccess) {
          onSuccess(response.id, response.name);
        }

        setCategoryName("");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !editCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const duplicate = categories.some(
      (cat: any) =>
        cat.id !== selectedCategory &&
        cat.name.toLowerCase() === editCategoryName.trim().toLowerCase()
    );

    if (duplicate) {
      toast.error("A category with this name already exists");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedCategory = {
        ...selectedCategoryData,
        name: editCategoryName.trim(),
      };

      const response = await ApiService.updateRecord(
        selectedCategory,
        updatedCategory
      );

      if (response) {
        updateEntry(selectedCategory, response, "metric_categories");
        toast.success("Category updated successfully");
        setSelectedCategory("");
        setEditCategoryName("");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const metricCount = getCategoryMetricCount(selectedCategory);
    if (metricCount > 0) {
      toast.error(
        `Cannot delete category. ${metricCount} metric${
          metricCount > 1 ? "s are" : " is"
        } using this category.`
      );
      return;
    }

    setIsDeleting(true);

    try {
      await ApiService.deleteRecord(selectedCategory);
      deleteEntry(selectedCategory, "metric_categories");
      toast.success("Category deleted successfully");
      setSelectedCategory("");
      setEditCategoryName("");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedCategory("");
      setCategoryName("");
      setEditCategoryName("");
      setTimeout(() => setActiveTab("add"), 300);
    }
  };

  return (
    <ReusableDialog
      title="Category Manager"
      description="Add new categories or update existing ones for organizing your metrics."
      open={open}
      onOpenChange={handleOpenChange}
      contentClassName="sm:max-w-[600px]"
      showTrigger={true}
      trigger={
        <Button variant="outline" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          Category Manager
        </Button>
      }
      customContent={
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <ReusableTabs
            tabs={[
              {
                id: "add",
                label: (
                  <div className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </div>
                ),
                content: (
                  <div className="pt-4 space-y-4">
                    <div>
                      <Label htmlFor="new-category-name">Category Name</Label>
                      <Input
                        id="new-category-name"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g., Fitness, Health, Productivity"
                        className="mt-1"
                        autoFocus
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter a unique name for your category
                      </p>
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      disabled={isSubmitting || !categoryName.trim()}
                      className="w-full"
                    >
                      {isSubmitting ? "Creating..." : "Create Category"}
                    </Button>
                  </div>
                ),
              },
              {
                id: "edit",
                label: (
                  <div className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit Category
                  </div>
                ),
                content: (
                  <div className="pt-4">
                    {categories.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No categories available to edit. Please add a category
                        first.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Select Category to Edit</Label>
                          <ReusableSelect
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(value) => {
                              setSelectedCategory(value);
                              const category = categories.find(
                                (cat: any) => cat.id === value
                              );
                              setEditCategoryName(category?.name || "");
                            }}
                            title="Category"
                            placeholder="Select a category..."
                            triggerClassName="mt-1"
                          />
                          {selectedCategory && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {getCategoryMetricCount(selectedCategory)} metric
                              {getCategoryMetricCount(selectedCategory) !== 1
                                ? "s"
                                : ""}{" "}
                              in this category
                            </p>
                          )}
                        </div>

                        {selectedCategory && (
                          <>
                            <div>
                              <Label htmlFor="edit-category-name">
                                New Name
                              </Label>
                              <Input
                                id="edit-category-name"
                                value={editCategoryName}
                                onChange={(e) =>
                                  setEditCategoryName(e.target.value)
                                }
                                placeholder="Enter new category name"
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleEditCategory}
                                disabled={
                                  isSubmitting || !editCategoryName.trim()
                                }
                                className="flex-1"
                              >
                                {isSubmitting
                                  ? "Updating..."
                                  : "Update Category"}
                              </Button>
                              <ConfirmDeleteDialog
                                title="Delete Category"
                                description={
                                  getCategoryMetricCount(selectedCategory) > 0
                                    ? `This category is being used by ${getCategoryMetricCount(
                                        selectedCategory
                                      )} metric${
                                        getCategoryMetricCount(
                                          selectedCategory
                                        ) > 1
                                          ? "s"
                                          : ""
                                      }. Please reassign or delete these metrics before deleting the category.`
                                    : "Are you sure you want to delete this category? This action cannot be undone."
                                }
                                onConfirm={handleDelete}
                                loading={isDeleting}
                                triggerText="Delete"
                                variant="destructive"
                                size="default"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            defaultTabId={activeTab}
            onChange={setActiveTab}
            className="w-full"
            tabsListClassName="grid w-full grid-cols-2 mb-4"
            tabsContentClassName="mt-0"
          />
        </div>
      }
      customFooter={<div />}
    />
  );
}
