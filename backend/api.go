// backend/api.go
package backend

import (
	"context"

	"myproject/backend/database"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize the database
	err := database.Initialize("./DataDesktop.db")
	if err != nil {
		println("Error initializing database:", err.Error())
	}
}

// shutdown is called when the app is about to quit
func (a *App) Shutdown(ctx context.Context) {
	database.Close()
}
