package database

import (
	"fmt"
	"strings"
)

func CleanupUnusedTables() error {
	// List of tables to keep
	activeTables := []string{
		"datasets",
		"data_records",
		// Add any other tables that should be kept
	}

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

		isActive := false
		for _, activeTable := range activeTables {
			if table == activeTable {
				isActive = true
				break
			}
		}

		if !isActive {
			fmt.Printf("Dropping unused table: %s\n", table)
			_, err := DB.Exec(fmt.Sprintf("DROP TABLE %s", table))
			if err != nil {
				return fmt.Errorf("error dropping table %s: %w", table, err)
			}
		}
	}

	return nil
}
