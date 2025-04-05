// backend/database/cleaup_unused_tables.go
package database

import (
	"fmt"
	"strings"
)

func CleanupUnusedTables() error {
	// Core tables that should always be kept
	coreTables := []string{
		"datasets",
		"data_records",
		"sqlite_sequence", // SQLite internal table
	}

	// Add any dataset-specific tables based on constants
	// Currently, your application uses a unified table structure with
	// datasets and data_records tables only, so we don't need to add
	// dataset-specific tables

	// Get all tables in the database
	rows, err := DB.Query("SELECT name FROM sqlite_master WHERE type='table'")
	if err != nil {
		return err
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return err
		}
		tables = append(tables, name)
	}

	// Drop tables not in the active list
	for _, table := range tables {
		// Skip system tables
		if strings.HasPrefix(table, "sqlite_") {
			continue
		}

		isCore := false
		for _, coreTable := range coreTables {
			if table == coreTable {
				isCore = true
				break
			}
		}

		if !isCore {
			fmt.Printf("Dropping unused table: %s\n", table)
			_, err := DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s", table))
			if err != nil {
				return fmt.Errorf("error dropping table %s: %w", table, err)
			}
		}
	}

	// Log successful cleanup
	fmt.Println("Database cleanup completed successfully")
	return nil
}
