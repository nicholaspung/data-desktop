import { useState, useEffect } from "react";
import { Save, FolderPlus } from "lucide-react";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { toast } from "sonner";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import AutocompleteInput from "@/components/reusable/autocomplete-input";

export default function AddCategoryDialog({
  onSuccess,
}: {
  onSuccess?: (categoryId: string, categoryName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  useEffect(() => {
    const duplicate = categories.some(
      (cat: any) => cat.name.toLowerCase() === categoryName.trim().toLowerCase()
    );
    setIsDuplicate(duplicate);
  }, [categoryName, categories]);

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (isDuplicate) {
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
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((cat: any) => ({
    id: cat.id,
    label: cat.name,
  }));

  return (
    <ReusableDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setCategoryName("");
        }
        setOpen(newOpen);
      }}
      title="Add New Category"
      triggerIcon={<FolderPlus className="h-4 w-4 mr-2" />}
      triggerText="Add Category"
      variant="default"
      description="Create a new category for organizing metrics"
      customContent={
        <div className="py-4">
          <AutocompleteInput
            label="Category Name"
            id="categoryName"
            value={categoryName}
            onChange={setCategoryName}
            options={categoryOptions}
            placeholder="e.g., Fitness, Health, Productivity"
            autofocus={true}
            required={true}
            description={
              isDuplicate
                ? "A category with this name already exists"
                : "Enter a unique name for your category"
            }
            className={isDuplicate ? "text-destructive" : ""}
          />

          {isDuplicate && (
            <p className="text-sm text-destructive mt-2">
              This category already exists. Please use a different name.
            </p>
          )}
        </div>
      }
      onCancel={() => setOpen(false)}
      onConfirm={handleSubmit}
      footerActionDisabled={isSubmitting || !categoryName.trim() || isDuplicate}
      loading={isSubmitting}
      footerActionLoadingText="Creating..."
      confirmText="Create Category"
      confirmIcon={<Save className="h-4 w-4 mr-2" />}
    />
  );
}
