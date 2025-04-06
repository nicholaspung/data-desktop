import { Download, Info, Upload } from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function BatchEntryImportButtons({
  fileInputRef,
  isSubmitting,
  handleImportCSV,
  handleDownloadTemplate,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isSubmitting: boolean;
  handleImportCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadTemplate: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* CSV Import Button with Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
                disabled={isSubmitting}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Import data from a CSV file. The file should have headers matching
              the field names. Use the Template button to download a correctly
              formatted example.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Template Download Button with Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Download a CSV template with the correct headers for this data
              type. Fill in your data and then use the Import CSV button to
              upload it.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
