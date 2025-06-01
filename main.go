package main

import (
	"embed"
	"log"
	"myproject/backend"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app
	app := backend.NewApp()

	// Pass build mode as environment variable
	if len(os.Args) > 1 && os.Args[1] == "dev" {
		os.Setenv("BUILD_MODE", "dev")
	} else {
		os.Setenv("BUILD_MODE", "production")
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Data Desktop",
		Width:  800,
		Height: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.Startup,
		OnShutdown:       app.Shutdown,
		Bind: []interface{}{
			app,
		},
		Linux: &linux.Options{
			WebviewGpuPolicy: linux.WebviewGpuPolicyAlways,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
