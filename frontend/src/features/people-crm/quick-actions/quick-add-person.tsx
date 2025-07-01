import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const QuickAddPerson: React.FC = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);
    
    try {
      const dataToSave = {
        name: name.trim(),
        first_met_date: new Date().toISOString(),
      };

      const result = await ApiService.addRecord("people", dataToSave);
      
      if (result?.id) {
        addEntry(result, "people");
        toast.success("Person added successfully!");
        setName("");
        // Don't navigate to detail page after adding
      }
    } catch (error) {
      toast.error("Failed to add person");
      console.error("Error adding person:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Enter person's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <p className="text-sm text-muted-foreground">
        First met date will be set to today automatically
      </p>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !name.trim()}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isLoading ? "Adding..." : "Add Person"}
      </Button>
    </form>
  );
};

export default QuickAddPerson;