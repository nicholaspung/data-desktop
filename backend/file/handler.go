package file

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const FilesDir = "files"

func Initialize(appDataDir string) error {
	filesPath := filepath.Join(appDataDir, FilesDir)
	return os.MkdirAll(filesPath, 0755)
}

func SaveFile(appDataDir string, base64File string, prefix string, fileName string) (string, error) {
	if !strings.HasPrefix(base64File, "data:") {
		return "", errors.New("invalid file format")
	}

	parts := strings.SplitN(base64File, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("invalid file data format")
	}

	mimeType := strings.Split(parts[0], ":")[1]
	mimeType = strings.Split(mimeType, ";")[0]

	var extension string
	if fileName != "" {
		extension = filepath.Ext(fileName)
	} else {
		extension = mimeTypeToExtension(mimeType)
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode file: %w", err)
	}

	timestamp := time.Now().UnixNano()
	safeFileName := sanitizeFileName(fileName)
	if safeFileName == "" {
		safeFileName = fmt.Sprintf("%s_%d_%s%s", prefix, timestamp, uuid.New().String(), extension)
	} else {
		nameWithoutExt := strings.TrimSuffix(safeFileName, extension)
		safeFileName = fmt.Sprintf("%s_%d%s", nameWithoutExt, timestamp, extension)
	}

	path := filepath.Join(appDataDir, FilesDir, safeFileName)

	if err := ioutil.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return filepath.Join(FilesDir, safeFileName), nil
}

func GetFilePath(appDataDir string, relativePath string) string {
	return filepath.Join(appDataDir, relativePath)
}

func DeleteFile(appDataDir string, relativePath string) error {
	if relativePath == "" {
		return nil
	}
	fullPath := filepath.Join(appDataDir, relativePath)
	return os.Remove(fullPath)
}

func GetFileAsBase64(appDataDir string, relativePath string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	fullPath := filepath.Join(appDataDir, relativePath)

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("file does not exist")
	}

	data, err := ioutil.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	ext := strings.ToLower(filepath.Ext(relativePath))
	contentType := extensionToMimeType(ext)

	base64Data := base64.StdEncoding.EncodeToString(data)
	return "data:" + contentType + ";base64," + base64Data, nil
}

func mimeTypeToExtension(mimeType string) string {
	switch mimeType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "application/pdf":
		return ".pdf"
	case "text/plain":
		return ".txt"
	case "application/msword":
		return ".doc"
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return ".docx"
	case "application/vnd.ms-excel":
		return ".xls"
	case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		return ".xlsx"
	case "audio/mpeg":
		return ".mp3"
	case "audio/wav":
		return ".wav"
	case "audio/ogg":
		return ".ogg"
	case "audio/aac":
		return ".aac"

	case "video/mp4":
		return ".mp4"
	case "video/webm":
		return ".webm"
	case "video/ogg":
		return ".ogv"
	case "video/quicktime":
		return ".mov"
	default:
		return ""
	}
}

func extensionToMimeType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	case ".aac":
		return "audio/aac"

	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".ogv":
		return "video/ogg"
	case ".mov":
		return "video/quicktime"
	default:
		return "application/octet-stream"
	}
}

func sanitizeFileName(fileName string) string {
	if fileName == "" {
		return ""
	}

	fileName = filepath.Base(fileName)

	replacer := strings.NewReplacer(
		" ", "_",
		"\\", "_",
		"/", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)

	return replacer.Replace(fileName)
}

const ChunkSize = 1024 * 1024 // 1MB

func UploadFileInChunks(appDataDir string, chunkData string, fileName string, chunkIndex int, totalChunks int, sessionId string) (string, error) {
	if chunkIndex == 0 {
		tempDir := filepath.Join(appDataDir, "temp", sessionId)
		if err := os.MkdirAll(tempDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create temp directory: %w", err)
		}
	}

	parts := strings.SplitN(chunkData, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("invalid chunk data format")
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode chunk: %w", err)
	}

	chunkPath := filepath.Join(appDataDir, "temp", sessionId, fmt.Sprintf("chunk_%d", chunkIndex))
	if err := ioutil.WriteFile(chunkPath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write chunk: %w", err)
	}

	if chunkIndex == totalChunks-1 {
		ext := filepath.Ext(fileName)
		if ext == "" {
			mimeType := strings.Split(parts[0], ":")[1]
			mimeType = strings.Split(mimeType, ";")[0]
			ext = mimeTypeToExtension(mimeType)
		}

		timestamp := time.Now().UnixNano()
		safeFileName := sanitizeFileName(fileName)
		finalFileName := ""

		if safeFileName == "" {
			finalFileName = fmt.Sprintf("%s_%d%s", sessionId, timestamp, ext)
		} else {
			nameWithoutExt := strings.TrimSuffix(safeFileName, ext)
			finalFileName = fmt.Sprintf("%s_%d%s", nameWithoutExt, timestamp, ext)
		}

		finalPath := filepath.Join(appDataDir, FilesDir, finalFileName)

		destFile, err := os.Create(finalPath)
		if err != nil {
			return "", fmt.Errorf("failed to create final file: %w", err)
		}
		defer destFile.Close()

		for i := 0; i < totalChunks; i++ {
			chunkPath := filepath.Join(appDataDir, "temp", sessionId, fmt.Sprintf("chunk_%d", i))
			chunkData, err := ioutil.ReadFile(chunkPath)
			if err != nil {
				return "", fmt.Errorf("failed to read chunk %d: %w", i, err)
			}

			if _, err := destFile.Write(chunkData); err != nil {
				return "", fmt.Errorf("failed to write to final file: %w", err)
			}
		}

		os.RemoveAll(filepath.Join(appDataDir, "temp", sessionId))

		return filepath.Join(FilesDir, finalFileName), nil
	}

	return "", nil
}

func StreamFile(w http.ResponseWriter, r *http.Request, fullPath string) {
	file, err := os.Open(fullPath)
	if err != nil {
		http.Error(w, "Failed to open file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		http.Error(w, "Failed to get file info", http.StatusInternalServerError)
		return
	}

	contentType := extensionToMimeType(filepath.Ext(fullPath))
	w.Header().Set("Content-Type", contentType)

	rangeHeader := r.Header.Get("Range")
	if rangeHeader != "" {
		ranges, err := parseRange(rangeHeader, fileInfo.Size())
		if err != nil {
			http.Error(w, "Invalid range", http.StatusRequestedRangeNotSatisfiable)
			return
		}

		if len(ranges) > 1 {
			http.Error(w, "Multiple ranges not supported", http.StatusRequestedRangeNotSatisfiable)
			return
		}

		w.WriteHeader(http.StatusPartialContent)

		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d",
			ranges[0].start, ranges[0].end, fileInfo.Size()))

		w.Header().Set("Content-Length", fmt.Sprintf("%d", ranges[0].end-ranges[0].start+1))

		file.Seek(ranges[0].start, io.SeekStart)

		io.CopyN(w, file, ranges[0].end-ranges[0].start+1)
	} else {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))

		io.Copy(w, file)
	}
}

type httpRange struct {
	start, end int64
}

func parseRange(rangeHeader string, fileSize int64) ([]httpRange, error) {
	if !strings.HasPrefix(rangeHeader, "bytes=") {
		return nil, fmt.Errorf("invalid range header format")
	}

	rangeSpec := strings.TrimPrefix(rangeHeader, "bytes=")
	var ranges []httpRange

	for _, r := range strings.Split(rangeSpec, ",") {
		r = strings.TrimSpace(r)
		if r == "" {
			continue
		}

		parts := strings.Split(r, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid range format")
		}

		var start, end int64
		var err error

		if parts[0] == "" {
			if parts[1] == "" {
				return nil, fmt.Errorf("invalid range format")
			}

			end, err = strconv.ParseInt(parts[1], 10, 64)
			if err != nil {
				return nil, err
			}

			start = fileSize - end
			end = fileSize - 1
		} else {
			start, err = strconv.ParseInt(parts[0], 10, 64)
			if err != nil {
				return nil, err
			}

			if parts[1] == "" {
				end = fileSize - 1
			} else {
				end, err = strconv.ParseInt(parts[1], 10, 64)
				if err != nil {
					return nil, err
				}
			}
		}

		if start < 0 || end < 0 || start > end || end >= fileSize {
			return nil, fmt.Errorf("invalid range values")
		}

		ranges = append(ranges, httpRange{start, end})
	}

	return ranges, nil
}
