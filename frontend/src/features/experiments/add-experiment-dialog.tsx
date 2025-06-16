import ExperimentDialog from "./experiment-dialog";

export default function AddExperimentDialog({
  buttonLabel = "Create New Experiment",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  onSuccess,
}: {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  onSuccess?: () => void;
}) {
  return (
    <ExperimentDialog
      mode="add"
      buttonLabel={buttonLabel}
      buttonVariant={buttonVariant}
      buttonSize={buttonSize}
      buttonClassName={buttonClassName}
      onSuccess={onSuccess}
    />
  );
}
