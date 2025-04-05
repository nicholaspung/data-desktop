// backend/database/cleanup_unused_tables.go
package database

import (
	"fmt"
)

// CleanupUnusedTables removes datasets that aren't part of the core datasets defined in constants.go
func CleanupUnusedTables() error {
	// Get all core dataset IDs from constants
	coreDatasetIDs := []string{
		DatasetIDDEXA,
		DatasetIDBloodwork,
		DatasetIDPaycheck,
		DatasetIDHabit,
		DatasetIDBloodMarker,
		DatasetIDBloodResult,
	}

	// Get all datasets currently in the database
	rows, err := DB.Query("SELECT id FROM datasets")
	if err != nil {
		return fmt.Errorf("error querying datasets: %w", err)
	}
	defer rows.Close()

	// Collect dataset IDs to delete (those not in core datasets)
	var datasetsToDelete []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("error scanning dataset ID: %w", err)
		}

		// Check if this dataset is in our core list
		isCore := false
		for _, coreID := range coreDatasetIDs {
			if id == coreID {
				isCore = true
				break
			}
		}

		// If not a core dataset, add to delete list
		if !isCore {
			datasetsToDelete = append(datasetsToDelete, id)
		}
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("error iterating dataset rows: %w", err)
	}

	// Delete non-core datasets and their records
	if len(datasetsToDelete) > 0 {
		fmt.Printf("Found %d non-core datasets to delete\n", len(datasetsToDelete))

		// Use a transaction for atomicity
		tx, err := DB.Begin()
		if err != nil {
			return fmt.Errorf("error starting transaction: %w", err)
		}
		defer tx.Rollback()

		for _, datasetID := range datasetsToDelete {
			// Delete records first (due to foreign key constraint)
			result, err := tx.Exec("DELETE FROM data_records WHERE dataset_id = ?", datasetID)
			if err != nil {
				return fmt.Errorf("error deleting records for dataset %s: %w", datasetID, err)
			}

			recordsDeleted, _ := result.RowsAffected()

			// Then delete the dataset
			result, err = tx.Exec("DELETE FROM datasets WHERE id = ?", datasetID)
			if err != nil {
				return fmt.Errorf("error deleting dataset %s: %w", datasetID, err)
			}

			if rowsDeleted, _ := result.RowsAffected(); rowsDeleted > 0 {
				fmt.Printf("Deleted dataset %s and %d associated records\n", datasetID, recordsDeleted)
			}
		}

		// Commit the transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("error committing transaction: %w", err)
		}
	} else {
		fmt.Println("No non-core datasets found to delete")
	}

	// Additionally, check for and clean up any orphaned records
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
