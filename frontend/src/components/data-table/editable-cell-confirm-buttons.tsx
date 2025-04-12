import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditableCellConfirmButtons({
  handleSave,
  handleCancel,
  isSubmitting,
}: {
  handleSave: () => void;
  handleCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex justify-end gap-1 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3 text-green-500" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        <X className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  );
}
