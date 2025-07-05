import { memo, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface MetricNoteEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

const MetricNoteEditor = memo(function MetricNoteEditor({
  value,
  onChange,
  onSave,
  onCancel,
  isSubmitting,
  autoFocus = true,
  placeholder = "Add a note for today...",
}: MetricNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-2 mt-2">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          rows={3}
          className="min-h-[80px] text-sm bg-background"
          disabled={isSubmitting}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin mr-1">
                <Loader2 className="h-4 w-4" />
              </div>
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
});

export default MetricNoteEditor;