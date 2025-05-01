// src/features/time-planner/category-picker.tsx
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CategoryWithColor } from "./types";

interface CategoryPickerProps {
  onSelectCategory: (id: string, name: string, color: string) => void;
  selectedCategory: string;
}

export default function CategoryPicker({
  onSelectCategory,
  selectedCategory,
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<CategoryWithColor[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem("timeBlockCategories");
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      } catch (error) {
        console.error("Failed to parse saved categories:", error);
      }
    } else {
      // Set default categories if none exist
      const defaultCategories: CategoryWithColor[] = [
        { id: uuidv4(), name: "Work", color: "#ef4444" },
        { id: uuidv4(), name: "Meeting", color: "#3b82f6" },
        { id: uuidv4(), name: "Exercise", color: "#22c55e" },
        { id: uuidv4(), name: "Personal", color: "#a855f7" },
      ];
      setCategories(defaultCategories);
      localStorage.setItem(
        "timeBlockCategories",
        JSON.stringify(defaultCategories)
      );
    }
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem("timeBlockCategories", JSON.stringify(categories));
    }
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategoryName) return;

    const newCategory: CategoryWithColor = {
      id: uuidv4(),
      name: newCategoryName,
      color: newCategoryColor,
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCategoryName("");
    setNewCategoryColor("#3b82f6");
    setIsAddingNewCategory(false);

    // Select the newly created category
    onSelectCategory(newCategory.id, newCategory.name, newCategory.color);
  };

  const handleSelectCategory = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      onSelectCategory(category.id, category.name, category.color);
    }
  };

  // Find the selected category ID
  const findSelectedCategoryId = () => {
    const category = categories.find((cat) => cat.name === selectedCategory);
    return category ? category.id : "";
  };

  // Predefined colors
  const colorOptions = [
    { value: "#ef4444", label: "Red" },
    { value: "#f97316", label: "Orange" },
    { value: "#eab308", label: "Yellow" },
    { value: "#22c55e", label: "Green" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#a855f7", label: "Purple" },
    { value: "#ec4899", label: "Pink" },
    { value: "#6b7280", label: "Gray" },
  ];

  return (
    <div className="space-y-2">
      <Select
        value={findSelectedCategoryId()}
        onValueChange={handleSelectCategory}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isAddingNewCategory} onOpenChange={setIsAddingNewCategory}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mt-1 gap-1">
            <PlusCircle className="h-4 w-4" />
            Add New Category
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Create New Category</h4>

            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="Work, Exercise, Study, etc."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">Color</Label>
              <Select
                value={newCategoryColor}
                onValueChange={(value) => setNewCategoryColor(value)}
              >
                <SelectTrigger id="category-color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.value }}
                        ></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddCategory} disabled={!newCategoryName}>
              Add Category
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
