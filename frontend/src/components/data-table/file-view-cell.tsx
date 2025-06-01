import { useState } from "react";
import FileViewer from "@/components/reusable/file-viewer";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { SingleFileItem } from "@/types/types";

interface FileViewCellProps {
  value: SingleFileItem | null;
}

export default function FileViewCell({ value }: FileViewCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const fileSrc = value.src;
  const displayFileName = value.name;

  return (
    <ReusableDialog
      title={displayFileName}
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <div className="cursor-pointer">
          <FileViewer
            src={fileSrc}
            fileName={displayFileName}
            size="sm"
            className="mx-auto"
          />
        </div>
      }
      customContent={
        <FileViewer
          src={fileSrc}
          fileName={displayFileName}
          size="preview"
          showDownloadButton={true}
        />
      }
      customFooter={<div />}
      contentClassName="max-w-4xl"
    />
  );
}
