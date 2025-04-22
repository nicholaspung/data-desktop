// src/features/journaling/journaling-metrics-sync.tsx
import { useEffect } from "react";
import { useJournalingMetricsSync } from "@/hooks/useJournalingMetricsSync";

export default function JournalingMetricsSync() {
  const { syncJournalingMetrics } = useJournalingMetricsSync();

  // Sync metrics whenever the component renders
  useEffect(() => {
    syncJournalingMetrics();
  }, [syncJournalingMetrics]);

  // This is a utility component that doesn't render anything
  return null;
}
