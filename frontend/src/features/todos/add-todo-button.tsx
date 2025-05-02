import { useState } from "react";
import { PlusCircle } from "lucide-react";
import TodoForm from "./todo-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AddTodoButton() {
  const [open, setOpen] = useState(false);

  return (
    <ReusableDialog
      title="Create New Todo"
      description="Add a new todo with a deadline and optional progress tracking."
      open={open}
      variant="default"
      onOpenChange={setOpen}
      triggerText="Add Todo"
      triggerIcon={<PlusCircle className="h-4 w-4" />}
      triggerClassName="gap-2"
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <TodoForm onSuccess={() => setOpen(false)} />
          </div>
        </ScrollArea>
      }
      customFooter={<></>}
    />
  );
}
