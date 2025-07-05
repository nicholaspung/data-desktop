import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { ApiService } from "@/services/api";
import { BodyMeasurementRecord } from "./types";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { usePin } from "@/hooks/usePin";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

interface InlineEditFormProps {
  record: BodyMeasurementRecord;
  measurementField: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function InlineEditForm({ record, measurementField, onSuccess, onCancel }: InlineEditFormProps) {
  const [value, setValue] = useState<string>(((record as any)[measurementField] || 0).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || isNaN(parseFloat(value))) {
      toast.error("Please enter a valid number");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create updated record with the new value
      const updatedRecord = {
        ...record,
        [measurementField]: parseFloat(value)
      };

      await ApiService.updateRecord("body_measurements", updatedRecord);
      toast.success("Measurement updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error updating measurement:", error);
      toast.error("Failed to update measurement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="measurement-value">
          {measurementField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Value
        </Label>
        <Input
          id="measurement-value"
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter measurement value"
          className="w-full"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !value || isNaN(parseFloat(value))}
          className="flex-1 gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function BodyMeasurementSearch() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("");
  const [records, setRecords] = useState<BodyMeasurementRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BodyMeasurementRecord[]>([]);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [measurementsForDate, setMeasurementsForDate] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BodyMeasurementRecord | null>(null);
  const [hasPrivateRecords, setHasPrivateRecords] = useState(false);
  const { isUnlocked } = usePin();

  // Load all records and get unique dates
  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const data = await ApiService.getRecords<BodyMeasurementRecord>("body_measurements");
        setRecords(data);
        
        // Extract unique dates (YYYY-MM-DD format)
        const dates = [...new Set(data.map(record => {
          return new Date(record.date).toISOString().split('T')[0];
        }))].sort().reverse(); // Most recent first
        setUniqueDates(dates);
      } catch (error) {
        console.error("Error loading records:", error);
        toast.error("Failed to load body measurements");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  // Update available measurements when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setMeasurementsForDate([]);
      setSelectedMeasurement("");
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const recordsForDate = records.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
    
    // Extract measurement types from the actual data structure
    const measurementTypes = new Set<string>();
    recordsForDate.forEach(record => {
      // Get all numeric fields that aren't metadata
      Object.entries(record).forEach(([key, value]) => {
        if (typeof value === 'number' && 
            !['id', 'createdAt', 'lastModified'].includes(key) &&
            value > 0) {
          measurementTypes.add(key);
        }
      });
    });
    
    const measurementsOnDate = Array.from(measurementTypes).sort();
    setMeasurementsForDate(measurementsOnDate);
    setSelectedMeasurement(""); // Reset measurement selection
  }, [selectedDate, records]);

  // Filter records based on selected date and measurement
  useEffect(() => {
    if (!selectedDate || !selectedMeasurement) {
      setFilteredRecords([]);
      setHasPrivateRecords(false);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const allFiltered = records.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr && 
             typeof (record as any)[selectedMeasurement] === 'number' &&
             (record as any)[selectedMeasurement] > 0;
    });

    // Check if there are private records
    const privateRecords = allFiltered.filter(record => record.private);
    setHasPrivateRecords(privateRecords.length > 0);

    // Filter out private records unless PIN is unlocked
    const visibleRecords = isUnlocked 
      ? allFiltered 
      : allFiltered.filter(record => !record.private);

    setFilteredRecords(visibleRecords);
    
    // Reset selected record when filters change
    setSelectedRecord(null);
  }, [selectedDate, selectedMeasurement, records, isUnlocked]);

  const handleEditRecord = (record: BodyMeasurementRecord) => {
    setSelectedRecord(record);
  };

  const handleEditSuccess = async () => {
    setSelectedRecord(null);
    
    // Reload records
    try {
      const data = await ApiService.getRecords<BodyMeasurementRecord>("body_measurements");
      setRecords(data);
      toast.success("Body measurement updated successfully!");
    } catch (error) {
      console.error("Error reloading records:", error);
      toast.error("Failed to reload records");
    }
  };


  const handleDeleteRecord = async (record: BodyMeasurementRecord) => {
    try {
      await ApiService.deleteRecord(record.id);
      toast.success("Measurement record deleted successfully!");
      
      // Reload records
      const data = await ApiService.getRecords<BodyMeasurementRecord>("body_measurements");
      setRecords(data);
      
      // Reset selected record if it was the deleted one
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete measurement record");
    }
  };

  const dateOptions = uniqueDates.map(dateStr => ({
    id: dateStr,
    label: formatDate(new Date(dateStr + 'T00:00:00')),
  }));

  const measurementOptions = measurementsForDate.map(measurement => ({
    id: measurement,
    label: measurement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format field names
  }));

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search-date">Date</Label>
          <ReusableSelect
            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ""}
            onChange={(dateStr) => {
              if (dateStr) {
                setSelectedDate(new Date(dateStr + 'T00:00:00'));
              } else {
                setSelectedDate(null);
              }
            }}
            options={dateOptions}
            placeholder="Select date with records"
            usePortal={true}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-measurement">Measurement Type</Label>
          <ReusableSelect
            value={selectedMeasurement}
            onChange={setSelectedMeasurement}
            options={measurementOptions}
            placeholder={selectedDate ? "Select measurement type" : "Select a date first"}
            usePortal={true}
            disabled={!selectedDate}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : selectedDate && selectedMeasurement ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedMeasurement} measurements for {formatDate(selectedDate)}
            </h3>
          </div>
          
          {filteredRecords.length === 0 && !hasPrivateRecords ? (
            <div className="text-center py-8 text-muted-foreground">
              No {selectedMeasurement.toLowerCase()} measurements found for {formatDate(selectedDate)}
            </div>
          ) : filteredRecords.length === 0 && hasPrivateRecords ? (
            <div className="text-center py-8 text-muted-foreground">
              All {selectedMeasurement.toLowerCase()} measurements for this date are private. 
              Enter your PIN to view private records.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Records List */}
              <div className="space-y-2">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 ${
                      selectedRecord?.id === record.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {((record as any)[selectedMeasurement] || 0).toFixed(2)} {/* Display the selected measurement value */}
                      </div>
                      {record.time && (
                        <div className="text-sm text-muted-foreground">
                          Time: {record.time}
                        </div>
                      )}
                      {record.private && (
                        <div className="text-sm text-muted-foreground">
                          🔒 Private
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecord(record)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {selectedRecord?.id === record.id ? 'Cancel' : 'Edit'}
                      </Button>
                      <ConfirmDeleteDialog
                        title="Delete Measurement Record"
                        description="Are you sure you want to delete this measurement record? This action cannot be undone."
                        onConfirm={() => handleDeleteRecord(record)}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Edit Form */}
              {selectedRecord && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold mb-4">
                    Edit {selectedMeasurement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {((selectedRecord as any)[selectedMeasurement] || 0).toFixed(2)}
                  </h4>
                  <InlineEditForm
                    record={selectedRecord}
                    measurementField={selectedMeasurement}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setSelectedRecord(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Select a date and measurement type to search for records
        </div>
      )}
    </div>
  );
}