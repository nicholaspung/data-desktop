import { useEffect } from "react";
import { useJournalingMetricsSync } from "@/hooks/useJournalingMetricsSync";

export default function JournalingMetricsSync() {
  const { syncJournalingMetrics } = useJournalingMetricsSync();

  useEffect(() => {
    syncJournalingMetrics();
  }, [syncJournalingMetrics]);

  return null;
}
