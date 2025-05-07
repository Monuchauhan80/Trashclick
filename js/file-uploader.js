// File Uploader Module
import { supabaseClient } from "./supabase.js"

export const fileUploader = {
  // Initialize file uploader
  init(elementId, options = {}) {
    const defaultOptions = {
      maxFiles: 5,
      maxSize: 5 * 1024 * 1024, // 5MB
      acceptedTypes: ["image/*"],
      previewContainer: "file-preview",
    }

    this.options = { ...defaultOptions, ...options }
    this.element = document.getElementById(elementId)
    this.previewContainer = document.getElementById(this.options.previewContainer)

    if (!this.element) {
      console.error("File upload element not found")
      return
    }

    this.setupEventListeners()
  },

  // Setup event listeners
  setupEventListeners() {
    // Drag and drop events
    this.element.addEventListener("dragover", (e) => {
      e.preventDefault()
      this.element.classList.add("dragover")
    })

    this.element.addEventListener("dragleave", () => {
      this.element.classList.remove("dragover")
    })

    this.element.addEventListener("drop", (e) => {
      e.preventDefault()
      this.element.classList.remove("dragover")
      this.handleFiles(e.dataTransfer.files)
    })

    // File input change event
    this.element.addEventListener("change", (e) => {
      this.handleFiles(e.target.files)
    })
  },

  // Handle files
  async handleFiles(files) {
    const validFiles = Array.from(files).filter((file) => this.validateFile(file))

    if (validFiles.length === 0) {
      this.showError("No valid files selected")
      return
    }

    if (validFiles.length > this.options.maxFiles) {
      this.showError(`Maximum ${this.options.maxFiles} files allowed`)
      return
    }

    // Clear existing previews
    this.clearPreviews()

    // Process each file
    for (const file of validFiles) {
      await this.processFile(file)
    }
  },

  // Validate file
  validateFile(file) {
    // Check file type
    if (!file.type.match(this.options.acceptedTypes.join("|"))) {
      this.showError(`Invalid file type: ${file.type}`)
      return false
    }

    // Check file size
    if (file.size > this.options.maxSize) {
      this.showError(`File too large: ${file.name}`)
      return false
    }

    return true
  },

  // Process file
  async processFile(file) {
    try {
      // Create preview
      const preview = await this.createPreview(file)
      this.previewContainer.appendChild(preview)

      // Upload file
      const filePath = `uploads/${Date.now()}-${file.name}`
      const { data, error } = await supabaseClient.storage.from("files").upload(filePath, file)

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("files").getPublicUrl(filePath)

      // Store file info
      this.files = this.files || []
      this.files.push({
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
        url: publicUrl,
      })

      return publicUrl
    } catch (error) {
      console.error("Error processing file:", error)
      this.showError(`Error processing ${file.name}`)
      return null
    }
  },

  // Create preview
  createPreview(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const preview = document.createElement("div")
        preview.className = "file-preview-item"

        if (file.type.startsWith("image/")) {
          preview.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                        </div>
                        <button class="remove-file" data-name="${file.name}">
                            <i class="fas fa-times"></i>
                        </button>
                    `
        } else {
          preview.innerHTML = `
                        <div class="file-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                        </div>
                        <button class="remove-file" data-name="${file.name}">
                            <i class="fas fa-times"></i>
                        </button>
                    `
        }

        // Add remove button event listener
        const removeBtn = preview.querySelector(".remove-file")
        removeBtn.addEventListener("click", () => this.removeFile(file.name))

        resolve(preview)
      }

      reader.readAsDataURL(file)
    })
  },

  // Remove file
  async removeFile(fileName) {
    const file = this.files.find((f) => f.name === fileName)
    if (!file) return

    try {
      // Remove from storage
      const { error } = await supabaseClient.storage.from("files").remove([file.path])

      if (error) throw error

      // Remove from files array
      this.files = this.files.filter((f) => f.name !== fileName)

      // Remove preview
      const preview = this.previewContainer.querySelector(`[data-name="${fileName}"]`).closest(".file-preview-item")
      preview.remove()
    } catch (error) {
      console.error("Error removing file:", error)
      this.showError("Error removing file")
    }
  },

  // Clear previews
  clearPreviews() {
    this.previewContainer.innerHTML = ""
    this.files = []
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  // Show error message
  showError(message) {
    const error = document.createElement("div")
    error.className = "file-error"
    error.textContent = message

    this.element.appendChild(error)

    setTimeout(() => {
      error.remove()
    }, 3000)
  },

  // Get uploaded files
  getFiles() {
    return this.files || []
  },

  // Clear all files
  clear() {
    this.clearPreviews()
    this.element.value = ""
  },
}

