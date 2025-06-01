import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JsonViewCellProps {
  value: any;
  title?: string;
}

export default function JsonViewCell({ value, title }: JsonViewCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  let parsedValue;
  try {
    parsedValue = typeof value === "string" ? JSON.parse(value) : value;
  } catch (e) {
    console.error(e);
    parsedValue = value;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="h-8 px-2 text-xs"
      >
        <Code className="h-3 w-3 mr-1" />
        {Array.isArray(parsedValue)
          ? `${parsedValue.length} item${parsedValue.length !== 1 ? "s" : ""}`
          : "View JSON"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || "JSON Data"}</DialogTitle>
          </DialogHeader>

          <div className="border rounded-md p-4 space-y-4">
            {Array.isArray(parsedValue) && parsedValue.length > 0 ? (
              <div className="overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(parsedValue, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="overflow-auto">
                <pre className="text-xs">
                  {typeof parsedValue === "object"
                    ? JSON.stringify(parsedValue, null, 2)
                    : String(parsedValue || "")}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
