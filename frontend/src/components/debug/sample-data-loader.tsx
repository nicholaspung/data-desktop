import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReusableCard from "@/components/reusable/reusable-card";
import { LoadSampleData } from "../../../wailsjs/go/backend/App";
import { Database, Download, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SampleDataLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSampleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await LoadSampleData();

      const now = new Date().toLocaleString();
      setLastLoadTime(now);
      toast.success(
        "Sample data loaded successfully! Only empty datasets were populated - existing data was preserved."
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      const errorMessage = `Error loading sample data: ${err.message || err}`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error loading sample data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReusableCard
      title={
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Loader
        </div>
      }
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Load comprehensive sample data for empty datasets. This function
            checks each dataset individually and only loads sample data for
            datasets that are currently empty, preserving any existing data you
            may have.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastLoadTime && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Sample data was last loaded on {lastLoadTime}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">
              What gets loaded (only for empty datasets):
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Financial transaction logs (15 realistic transactions)</li>
              <li>• Account balances (11 account snapshots over time)</li>
              <li>• Paycheck details (2 complete paycheck breakdowns)</li>
              <li>• Financial file records (5 document collections)</li>
              <li>
                • DEXA scans, bloodwork, experiments, todos, journaling, time
                tracking, people CRM
              </li>
            </ul>
          </div>

          <Button
            onClick={handleLoadSampleData}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Loading Sample Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Load Sample Data
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Note: Each dataset is checked individually. Only empty datasets will
            receive sample data. Existing data in any dataset will be preserved.
            The page reloads automatically to refresh all data.
          </p>
        </div>
      }
    />
  );
};

export default SampleDataLoader;
