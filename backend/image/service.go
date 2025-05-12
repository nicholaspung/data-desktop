// backend/image/service.go
package image

import (
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/disintegration/imaging"
)

// Simple cache for base64-encoded images
type ImageCache struct {
	mu    sync.RWMutex
	cache map[string]CacheItem
}

type CacheItem struct {
	data      string
	timestamp time.Time
}

type Size struct {
	Width  int
	Height int
}

// New thumbnail sizes
var (
	ThumbnailSize = Size{Width: 150, Height: 150}
	MediumSize    = Size{Width: 600, Height: 600}
	// Original size is preserved as is
)

var imageCache = ImageCache{
	cache: make(map[string]CacheItem),
}

// Clear expired items from cache periodically
func (c *ImageCache) CleanUp(maxAge time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, item := range c.cache {
		if now.Sub(item.timestamp) > maxAge {
			delete(c.cache, key)
		}
	}
}

// Get image from cache
func (c *ImageCache) Get(cacheKey string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.cache[cacheKey]
	if !exists {
		return "", false
	}
	return item.data, true
}

// Set image in cache
func (c *ImageCache) Set(cacheKey string, data string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache[cacheKey] = CacheItem{
		data:      data,
		timestamp: time.Now(),
	}
}

// Start cache cleanup goroutine
func InitializeCache() {
	go func() {
		for {
			time.Sleep(30 * time.Minute)
			imageCache.CleanUp(24 * time.Hour) // Clear items older than 24 hours
		}
	}()
}

// Generate cache key for an image
func getCacheKey(imagePath string, size *Size) string {
	if size == nil {
		return imagePath + ":original"
	}
	return fmt.Sprintf("%s:%dx%d", imagePath, size.Width, size.Height)
}

// Get image as base64 with optional resizing
func GetImageAsBase64(appDataDir string, imagePath string, size *Size) (string, error) {
	if imagePath == "" {
		return "", nil
	}

	// Check if it's in cache first
	cacheKey := getCacheKey(imagePath, size)
	if cachedImage, found := imageCache.Get(cacheKey); found {
		return cachedImage, nil
	}

	fullPath := filepath.Join(appDataDir, imagePath)

	// Determine content type from extension
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

	var base64Data string
	var err error

	if size != nil {
		// Resize the image
		base64Data, err = resizeAndEncodeImage(fullPath, contentType, *size)
	} else {
		// Use original size but stream instead of loading all at once
		base64Data, err = streamAndEncodeImage(fullPath, contentType)
	}

	if err != nil {
		return "", err
	}

	// Cache the result
	imageCache.Set(cacheKey, base64Data)
	return base64Data, nil
}

func resizeAndEncodeImage(imagePath, contentType string, size Size) (string, error) {
	// Open the image file
	src, err := imaging.Open(imagePath)
	if err != nil {
		return "", fmt.Errorf("failed to open image: %w", err)
	}

	// Resize the image while preserving aspect ratio
	resized := imaging.Fit(src, size.Width, size.Height, imaging.Lanczos)

	// Create a temporary file to save the resized image
	tempFile, err := os.CreateTemp("", "resized-*.jpg")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile.Name()) // Clean up temp file after we're done
	defer tempFile.Close()

	// Save the resized image to the temp file
	err = imaging.Save(resized, tempFile.Name())
	if err != nil {
		return "", fmt.Errorf("failed to save resized image: %w", err)
	}

	// Seek back to beginning of file
	_, err = tempFile.Seek(0, 0)
	if err != nil {
		return "", fmt.Errorf("failed to seek temp file: %w", err)
	}

	// Read and encode the resized image
	fileInfo, err := tempFile.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}

	buffer := make([]byte, fileInfo.Size())
	_, err = tempFile.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("failed to read temp file: %w", err)
	}

	base64Data := base64.StdEncoding.EncodeToString(buffer)
	return "data:" + contentType + ";base64," + base64Data, nil
}

func streamAndEncodeImage(imagePath, contentType string) (string, error) {
	file, err := os.Open(imagePath)
	if err != nil {
		return "", fmt.Errorf("failed to open image: %w", err)
	}
	defer file.Close()

	// Get file size to allocate buffer
	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}

	// Stream the file in chunks if it's large
	var buffer []byte
	if fileInfo.Size() > 10*1024*1024 { // 10MB threshold
		// For large files, use a streaming approach
		buffer = make([]byte, 0, fileInfo.Size())
		chunkSize := 1024 * 1024 // 1MB chunks
		chunk := make([]byte, chunkSize)

		for {
			n, err := file.Read(chunk)
			if err != nil && err != io.EOF {
				return "", fmt.Errorf("error reading file chunk: %w", err)
			}
			if n == 0 {
				break
			}
			buffer = append(buffer, chunk[:n]...)
		}
	} else {
		// For smaller files, read all at once
		buffer = make([]byte, fileInfo.Size())
		_, err = file.Read(buffer)
		if err != nil {
			return "", fmt.Errorf("failed to read file: %w", err)
		}
	}

	base64Data := base64.StdEncoding.EncodeToString(buffer)
	return "data:" + contentType + ";base64," + base64Data, nil
}

// Modified ProcessRecord to use thumbnails for record listings
func ProcessRecord(appDataDir string, record map[string]interface{}, useThumbnails bool) error {
	var size *Size
	if useThumbnails {
		thumbnailSize := ThumbnailSize
		size = &thumbnailSize
	}

	for key, value := range record {
		if imagePath, ok := value.(string); ok && isImagePath(imagePath) {
			base64Image, err := GetImageAsBase64(appDataDir, imagePath, size)
			if err == nil {
				record[key] = base64Image
			}
		}

		if array, ok := value.([]interface{}); ok {
			for i, item := range array {
				if itemMap, ok := item.(map[string]interface{}); ok {
					for itemKey, itemValue := range itemMap {
						if imagePath, ok := itemValue.(string); ok && isImagePath(imagePath) {
							base64Image, err := GetImageAsBase64(appDataDir, imagePath, size)
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
			ProcessRecord(appDataDir, nestedMap, useThumbnails)
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
