package image

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
)

func GetImageAsBase64(appDataDir string, imagePath string) (string, error) {
	if imagePath == "" {
		return "", nil
	}

	fullPath := filepath.Join(appDataDir, imagePath)

	data, err := ioutil.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}

	ext := strings.ToLower(filepath.Ext(imagePath))
	var contentType string
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".gif":
		contentType = "image/gif"
	case ".webp":
		contentType = "image/webp"
	default:
		contentType = "application/octet-stream"
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	return "data:" + contentType + ";base64," + base64Data, nil
}

func ProcessRecord(appDataDir string, record map[string]interface{}) error {
	for key, value := range record {

		if imagePath, ok := value.(string); ok && isImagePath(imagePath) {
			base64Image, err := GetImageAsBase64(appDataDir, imagePath)
			if err == nil {
				record[key] = base64Image
			}
		}

		if array, ok := value.([]interface{}); ok {
			for i, item := range array {
				if itemMap, ok := item.(map[string]interface{}); ok {
					for itemKey, itemValue := range itemMap {
						if imagePath, ok := itemValue.(string); ok && isImagePath(imagePath) {
							base64Image, err := GetImageAsBase64(appDataDir, imagePath)
							if err == nil {
								itemMap[itemKey] = base64Image
								array[i] = itemMap
							}
						}
					}
				}
			}
		}

		if nestedMap, ok := value.(map[string]interface{}); ok {
			ProcessRecord(appDataDir, nestedMap)
		}
	}

	return nil
}

func isImagePath(path string) bool {
	if path == "" || strings.HasPrefix(path, "data:image/") {
		return false
	}

	ext := strings.ToLower(filepath.Ext(path))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp"
}
