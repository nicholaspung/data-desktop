import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  checkDefaultMetricsExist,
  createDefaultMetrics,
} from "./default-metrics";
import { useJournalingMetricsSync } from "@/hooks/useJournalingMetricsSync";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

export default function CreateDefaultMetricsButton() {
  const [showButton, setShowButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { syncJournalingMetrics } = useJournalingMetricsSync();

  const metrics = useStore(dataStore, (state) => state.metrics);

  useEffect(() => {
    const checkMetrics = async () => {
      setIsLoading(true);
      const metricsExist = await checkDefaultMetricsExist();
      setShowButton(!metricsExist);
      setIsLoading(false);
    };

    checkMetrics();
  }, []);

  const handleCreateMetrics = async () => {
    setIsLoading(true);
    const success = await createDefaultMetrics(metrics);
    if (success) {
      setShowButton(false);

      await syncJournalingMetrics();
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking metrics...
      </Button>
    );
  }

  if (!showButton) {
    return null;
  }

  return (
    <Button onClick={handleCreateMetrics} variant="outline">
      <PlusCircle className="h-4 w-4 mr-2" />
      Create Journaling Metrics
    </Button>
  );
}
