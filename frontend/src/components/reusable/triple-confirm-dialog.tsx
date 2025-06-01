import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TripleConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmationText: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
}

export default function TripleConfirmDialog({
  trigger,
  title,
  description,
  confirmationText,
  onConfirm,
  variant = "destructive",
}: TripleConfirmDialogProps) {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep(1);
      setInputText("");
    }
  };

  const handleConfirm = (e: any) => {
    e.preventDefault();
    if (step === 3 && inputText === confirmationText) {
      onConfirm();
      setIsOpen(false);
      setStep(1);
      setInputText("");
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "First Confirmation",
          description: "Are you sure you want to proceed?",
          actionText: "Yes, continue",
        };
      case 2:
        return {
          title: "Second Confirmation",
          description: "This action cannot be undone. Are you absolutely sure?",
          actionText: "Yes, I'm sure",
        };
      case 3:
        return {
          title: "Final Confirmation",
          description: `To confirm, please type "${confirmationText}" below:`,
          actionText: "Confirm",
        };
      default:
        return {
          title: title,
          description: description,
          actionText: "Confirm",
        };
    }
  };

  const stepContent = getStepContent();
  const canProceed = step < 3 || inputText === confirmationText;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step < 3 ? stepContent.title : title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step < 3 ? stepContent.description : description}
            {step === 3 && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="confirmation-input">
                  Type "{confirmationText}" to confirm:
                </Label>
                <Input
                  id="confirmation-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={confirmationText}
                  className="font-mono"
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canProceed}
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {stepContent.actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
