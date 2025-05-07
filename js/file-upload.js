// File Upload Utility
import { supabase } from "./supabase.js"

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

// Maximum number of files
const MAX_FILES = 5

/**
 * Initialize file upload container with drag and drop functionality
 * @param {string} containerSelector - The selector for the upload container
 * @param {string} inputSelector - The selector for the file input
 * @param {string} previewSelector - The selector for the preview container
 * @param {Object} options - Additional options
 * @returns {Object} - Methods to interact with the uploader
 */
export function initFileUpload(containerSelector, inputSelector, previewSelector, options = {}) {
  const container = document.querySelector(containerSelector)
  const fileInput = document.querySelector(inputSelector)
  const previewContainer = document.querySelector(previewSelector)

  if (!container || !fileInput || !previewContainer) {
    console.error("One or more required elements not found")
    return
  }

  const defaultOptions = {
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES,
    onFilesAdded: () => {},
    onFileRemoved: () => {},
    onValidationError: () => {},
  }

  const settings = { ...defaultOptions, ...options }

  // Store uploaded files
  let uploadedFiles = []

  // Click container to trigger file input
  container.addEventListener("click", () => {
    fileInput.click()
  })

  // Handle file selection
  fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files)
  })

  // Drag and drop functionality
  container.addEventListener("dragover", (e) => {
    e.preventDefault()
    container.classList.add("dragover")
  })

  container.addEventListener("dragleave", (e) => {
    e.preventDefault()
    container.classList.remove("dragover")
  })

  container.addEventListener("drop", (e) => {
    e.preventDefault()
    container.classList.remove("dragover")

    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files)
    }
  })

  /**
   * Handle the selected files
   * @param {FileList} files - The files to handle
   */
  function handleFiles(files) {
    const newFiles = Array.from(files)

    // Check if adding these files would exceed the maximum
    if (uploadedFiles.length + newFiles.length > settings.maxFiles) {
      const errorMessage = `You can only upload a maximum of ${settings.maxFiles} files`
      console.error(errorMessage)
      settings.onValidationError(errorMessage)
      return
    }

    // Validate and process each file
    newFiles.forEach((file) => {
      if (validateFile(file)) {
        uploadedFiles.push(file)
        createPreview(file)
      }
    })

    // Reset the file input to allow selecting the same file again
    fileInput.value = ""

    // Call callback
    settings.onFilesAdded(uploadedFiles)
  }

  /**
   * Validate a file for size and type
   * @param {File} file - The file to validate
   * @returns {boolean} - Whether the file is valid
   */
  function validateFile(file) {
    // Check file size
    if (file.size > settings.maxFileSize) {
      const errorMessage = `File ${file.name} is too large. Maximum size is ${formatSize(settings.maxFileSize)}`
      console.error(errorMessage)
      settings.onValidationError(errorMessage)
      return false
    }

    // Check file type
    if (!settings.allowedTypes.includes(file.type)) {
      const errorMessage = `File ${file.name} has an invalid type. Allowed types: ${settings.allowedTypes.join(", ")}`
      console.error(errorMessage)
      settings.onValidationError(errorMessage)
      return false
    }

    return true
  }

  /**
   * Create a preview for the file
   * @param {File} file - The file to preview
   */
  function createPreview(file) {
    const reader = new FileReader()

    reader.onload = (e) => {
      const previewItem = document.createElement("div")
      previewItem.className = "preview-image"
      previewItem.dataset.filename = file.name

      previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button type="button" class="remove-btn" data-filename="${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            `

      // Add remove button event listener
      const removeBtn = previewItem.querySelector(".remove-btn")
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        removeFile(file.name)
      })

      previewContainer.appendChild(previewItem)
    }

    reader.readAsDataURL(file)
  }

  /**
   * Remove a file from the uploaded files
   * @param {string} filename - The name of the file to remove
   */
  function removeFile(filename) {
    // Find the index of the file
    const fileIndex = uploadedFiles.findIndex((file) => file.name === filename)

    if (fileIndex !== -1) {
      // Remove the file from the array
      uploadedFiles.splice(fileIndex, 1)

      // Remove the preview
      const previewItem = previewContainer.querySelector(`[data-filename="${filename}"]`)
      if (previewItem) {
        previewContainer.removeChild(previewItem)
      }

      // Call callback
      settings.onFileRemoved(filename, uploadedFiles)
    }
  }

  /**
   * Format file size into human-readable format
   * @param {number} bytes - The size in bytes
   * @returns {string} - Formatted size
   */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  /**
   * Reset the uploader
   */
  function reset() {
    uploadedFiles = []
    previewContainer.innerHTML = ""
    fileInput.value = ""
  }

  /**
   * Get the list of uploaded files
   * @returns {Array} - The list of uploaded files
   */
  function getFiles() {
    return [...uploadedFiles]
  }

  return {
    getFiles,
    reset,
    removeFile,
  }
}

/**
 * Upload files to Supabase storage
 * @param {Array} files - The files to upload
 * @param {string} bucketName - The name of the storage bucket
 * @param {string} folderPath - The folder path within the bucket
 * @param {function} progressCallback - Callback for upload progress
 * @returns {Promise<Array>} - Array of uploaded file URLs
 */
export async function uploadToSupabase(files, bucketName, folderPath = "", progressCallback = null) {
  if (!files || files.length === 0) {
    return []
  }

  try {
    const uploadPromises = files.map(async (file, index) => {
      // Create a unique filename to prevent overwrites
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName

      // Upload file
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(index + 1, files.length, urlData.publicUrl)
      }

      return urlData.publicUrl
    })

    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error("Error uploading files:", error)
    throw error
  }
}

/**
 * Resize an image file to reduce its size
 * @param {File} file - The image file to resize
 * @param {Object} options - Resize options
 * @returns {Promise<Blob>} - The resized image as a Blob
 */
export function resizeImage(file, options = {}) {
  const defaultOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    format: "jpeg",
  }

  const settings = { ...defaultOptions, ...options }

  return new Promise((resolve, reject) => {
    // Create a FileReader
    const reader = new FileReader()

    // Set up FileReader callbacks
    reader.onload = (readerEvent) => {
      // Create an image element
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > settings.maxWidth || height > settings.maxHeight) {
          const ratio = Math.min(settings.maxWidth / width, settings.maxHeight / height)

          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        // Create a canvas for resizing
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        // Draw the image on the canvas
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            // Create a new file from the blob
            const resizedFile = new Blob([blob], { type: `image/${settings.format}` })
            resolve(resizedFile)
          },
          `image/${settings.format}`,
          settings.quality,
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      // Load the image
      img.src = readerEvent.target.result
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    // Read the file
    reader.readAsDataURL(file)
  })
}

/**
 * Delete files from Supabase storage
 * @param {Array} filePaths - The paths of the files to delete
 * @param {string} bucketName - The name of the storage bucket
 * @returns {Promise<Array>} - Array of deletion results
 */
export async function deleteFromSupabase(filePaths, bucketName) {
  if (!filePaths || filePaths.length === 0) {
    return []
  }

  try {
    const { data, error } = await supabase.storage.from(bucketName).remove(filePaths)

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error deleting files:", error)
    throw error
  }
}

/**
 * Convert a public URL back to a file path for deletion
 * @param {string} publicUrl - The public URL of the file
 * @param {string} bucketName - The name of the storage bucket
 * @returns {string} - The file path
 */
export function getFilePathFromUrl(publicUrl, bucketName) {
  // Extract the path from the URL
  const url = new URL(publicUrl)
  const pathParts = url.pathname.split("/")

  // Remove the first parts which contain the domain and bucket
  const bucketIndex = pathParts.findIndex((part) => part === "storage" || part === "object") + 2
  const path = pathParts.slice(bucketIndex).join("/")

  return path
}

