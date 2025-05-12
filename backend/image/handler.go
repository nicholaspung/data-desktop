package image

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

const ImagesDir = "images"

func Initialize(appDataDir string) error {
	imagesPath := filepath.Join(appDataDir, ImagesDir)
	return os.MkdirAll(imagesPath, 0755)
}

func SaveImage(appDataDir string, base64Image string, prefix string) (string, error) {

	if !strings.HasPrefix(base64Image, "data:image/") {
		return "", errors.New("invalid image format")
	}

	parts := strings.SplitN(base64Image, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("invalid image data format")
	}

	formatParts := strings.SplitN(parts[0], "/", 2)
	if len(formatParts) != 2 {
		return "", errors.New("invalid image format")
	}
	formatParts = strings.SplitN(formatParts[1], ";", 2)
	format := formatParts[0]

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	timestamp := time.Now().UnixNano()
	filename := fmt.Sprintf("%s_%d_%s.%s", prefix, timestamp, uuid.New().String(), format)
	path := filepath.Join(appDataDir, ImagesDir, filename)

	if err := ioutil.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write image: %w", err)
	}

	return filepath.Join(ImagesDir, filename), nil
}

func GetImagePath(appDataDir string, relativePath string) string {
	return filepath.Join(appDataDir, relativePath)
}

func DeleteImage(appDataDir string, relativePath string) error {
	if relativePath == "" {
		return nil
	}
	fullPath := filepath.Join(appDataDir, relativePath)
	return os.Remove(fullPath)
}
