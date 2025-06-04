package database

import (
	"fmt"
)

func CleanupUnusedTables() error {
	coreDatasetIDs := []string{
		DatasetIDDEXA,
		DatasetIDBloodwork,
		DatasetIDBloodMarker,
		DatasetIDBloodResult,
		DatasetIDExperiment,
		DatasetIDMetric,
		DatasetIDDailyLog,
		DatasetIDMetricCategory,
		DatasetIDExperimentMetric,
		DatasetIDGratitudeJournal,
		DatasetIDAffirmation,
		DatasetIDCreativityJournal,
		DatasetIDQuestionJournal,
		DatasetIDTimeEntries,
		DatasetIDTimeCategories,
		DatasetIDTimePlannerConfig,
		DatasetIDTodos,
		DatasetIDPeople,
		DatasetIDMeetings,
		DatasetIDPersonAttributes,
		DatasetIDPersonNotes,
		DatasetIDBirthdayReminders,
		DatasetIDPersonRelationships,
		DatasetIDBodyMeasurements,
	}

	rows, err := DB.Query("SELECT id FROM datasets")
	if err != nil {
		return fmt.Errorf("error querying datasets: %w", err)
	}
	defer rows.Close()

	var datasetsToDelete []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("error scanning dataset ID: %w", err)
		}

		isCore := false
		for _, coreID := range coreDatasetIDs {
			if id == coreID {
				isCore = true
				break
			}
		}

		if !isCore {
			datasetsToDelete = append(datasetsToDelete, id)
		}
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error iterating dataset rows: %w", err)
	}

	if len(datasetsToDelete) > 0 {
		fmt.Printf("Found %d non-core datasets to delete\n", len(datasetsToDelete))

		tx, err := DB.Begin()
		if err != nil {
			return fmt.Errorf("error starting transaction: %w", err)
		}
		defer tx.Rollback()

		for _, datasetID := range datasetsToDelete {
			result, err := tx.Exec("DELETE FROM data_records WHERE dataset_id = ?", datasetID)
			if err != nil {
				return fmt.Errorf("error deleting records for dataset %s: %w", datasetID, err)
			}

			recordsDeleted, _ := result.RowsAffected()

			result, err = tx.Exec("DELETE FROM datasets WHERE id = ?", datasetID)
			if err != nil {
				return fmt.Errorf("error deleting dataset %s: %w", datasetID, err)
			}

			if rowsDeleted, _ := result.RowsAffected(); rowsDeleted > 0 {
				fmt.Printf("Deleted dataset %s and %d associated records\n", datasetID, recordsDeleted)
			}
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("error committing transaction: %w", err)
		}
	} else {
		fmt.Println("No non-core datasets found to delete")
	}

	fmt.Println("Checking for orphaned records...")
	result, err := DB.Exec(`
		DELETE FROM data_records 
		WHERE dataset_id NOT IN (SELECT id FROM datasets)
	`)
	if err != nil {
		return fmt.Errorf("error deleting orphaned records: %w", err)
	}

	if rowsDeleted, _ := result.RowsAffected(); rowsDeleted > 0 {
		fmt.Printf("Deleted %d orphaned records\n", rowsDeleted)
	} else {
		fmt.Println("No orphaned records found")
	}

	fmt.Println("Database cleanup completed successfully")
	return nil
}
