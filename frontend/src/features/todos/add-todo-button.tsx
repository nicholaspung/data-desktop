import { useState } from "react";
import { PlusCircle, Pencil } from "lucide-react";
import TodoForm from "./todo-form";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Todo } from "@/store/todo-definitions";
import { Button } from "@/components/ui/button";

interface AddTodoButtonProps {
  existingTodo?: Todo;
  onSuccess?: () => void;
}

export default function AddTodoButton({
  existingTodo,
  onSuccess,
}: AddTodoButtonProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!existingTodo;

  return (
    <ReusableDialog
      title={isEditMode ? "Edit Todo" : "Create New Todo"}
      description={
        isEditMode
          ? "Update your todo details and deadline."
          : "Add a new todo with a deadline and optional progress tracking."
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
            Add Todo
          </Button>
        )
      }
      customContent={
        <ScrollArea className="max-h-[calc(85vh-10rem)] pr-4 overflow-y-auto">
          <div className="p-1">
            <TodoForm
              existingTodo={existingTodo}
              onSuccess={() => {
                setOpen(false);
                onSuccess?.();
              }}
            />
          </div>
        </ScrollArea>
      }
      customFooter={<></>}
    />
  );
}
