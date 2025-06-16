import { Experiment } from "@/store/experiment-definitions";
import ExperimentDialog from "./experiment-dialog";

export default function EditExperimentDialog({
  experiment,
  onSuccess,
}: {
  experiment: Experiment;
  onSuccess?: () => void;
}) {
  return (
    <ExperimentDialog
      mode="edit"
      experiment={experiment}
      onSuccess={onSuccess}
    />
  );
}