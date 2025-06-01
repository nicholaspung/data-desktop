import { useState } from "react";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import FileViewer from "@/components/reusable/file-viewer";
import { FileItem } from "@/components/reusable/multiple-file-upload";

interface MultipleFileViewCellProps {
  files: FileItem[];
  title?: string;
}

export default function MultipleFileViewCell({
  files,
  title = "Files",
}: MultipleFileViewCellProps) {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!files || files.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getFileInfo = (file: FileItem, index: number) => {
    const fileSrc = file?.src || "";
    const fileName = file?.name || `File ${index + 1}`;
    const fileId = file?.id || `file-${index}`;
    return { fileSrc, fileName, fileId };
  };

  const selectedFile = files[selectedFileIndex]
    ? getFileInfo(files[selectedFileIndex], selectedFileIndex)
    : null;

  return (
    <ReusableDialog
      title={title}
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-75">
          <FolderOpen className="h-4 w-4" />
          <Badge variant="secondary">{files.length} files</Badge>
        </div>
      }
      customContent={
        <div className="flex flex-col gap-4">
          {/* File Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[200px] overflow-auto p-2 border rounded-md">
            {files.map((file, index) => {
              const { fileSrc, fileName, fileId } = getFileInfo(file, index);

              return (
                <div
                  key={fileId}
                  className={`flex flex-col items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    index === selectedFileIndex
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedFileIndex(index)}
                >
                  <FileViewer src={fileSrc} fileName={fileName} size="lg" />
                  <span className="text-xs text-muted-foreground text-center truncate w-full">
                    {fileName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">
                Preview: {selectedFile.fileName}
              </h3>
              <FileViewer
                src={selectedFile.fileSrc}
                fileName={selectedFile.fileName}
                size="preview"
                showDownloadButton={true}
              />
            </div>
          )}
        </div>
      }
      customFooter={<div />}
      contentClassName="max-w-5xl"
    />
  );
}
