import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import MeetingForm from "./meeting-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Meeting } from "@/store/people-crm-definitions";
import { Button } from "@/components/ui/button";

interface AddMeetingButtonProps {
  existingMeeting?: Meeting;
  defaultPersonId?: string;
  onSuccess?: () => void;
}

export default function AddMeetingButton({
  existingMeeting,
  defaultPersonId,
  onSuccess,
}: AddMeetingButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingMeeting;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Meeting" : "Add New Meeting"}
      description={
        isEditMode
          ? "Update meeting details."
          : "Record a new meeting with someone in your network."
      }
      open={open}
      onOpenChange={setOpen}
      trigger={
        isEditMode ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Meeting
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <MeetingForm
              meeting={existingMeeting}
              defaultPersonId={defaultPersonId}
              onSubmit={async () => {
                setOpen(false);
                onSuccess?.();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </ScrollArea>
      }
      customFooter={<></>}
    />
  );
}
