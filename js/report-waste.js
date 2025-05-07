// Report Waste Functionality
import { supabase } from "./supabase.js"
import { checkAuth, getCurrentUser } from "./auth.js"
import * as mapsModule from "./maps.js"
import { initFileUpload, uploadToSupabase, resizeImage } from "./file-upload.js"
import { showNotification } from "./utils.js"

// DOM Elements
const reportForm = document.getElementById("report-waste-form")
const wasteTypeSelect = document.getElementById("waste-type")
const urgencyOptions = document.querySelectorAll(".urgency-option input")
const currentLocationBtn = document.getElementById("current-location-btn")
const wasteTitle = document.getElementById("waste-title")
const wasteQuantity = document.getElementById("waste-quantity")
const wasteDescription = document.getElementById("waste-description")
const wasteLocation = document.getElementById("waste-location")
const wasteLandmark = document.getElementById("waste-landmark")
const wasteLatitude = document.getElementById("waste-latitude")
const wasteLongitude = document.getElementById("waste-longitude")
const addressDisplay = document.getElementById("address-display")
const locationStatus = document.getElementById("location-status")
const progressSteps = document.querySelectorAll(".progress-step")

// Initialize map variables
let map
let marker
let geocoder
let autocomplete
let isMapInitialized = false
let uploadedImages = []
let userLocation = null

// Initialize file uploader
let fileUploader

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check if user is authenticated
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      window.location.href = "login.html"
      return
    }

    // Initialize the file uploader
    initializeFileUploader()

    // Initialize the map
    initializeMapModule()

    // Set up event handlers
    setupEventHandlers()

    // Update the header user info
    updateHeaderUserInfo()
  } catch (error) {
    console.error("Error initializing page:", error)
    showNotification("There was an error loading the page. Please refresh and try again.", "error")
  }
})

// Update header user info
async function updateHeaderUserInfo() {
  try {
    const user = await getCurrentUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        // Update header elements
        const headerAvatar = document.getElementById("header-avatar")
        const headerUsername = document.getElementById("header-username")

        if (headerAvatar && profile.avatar_url) {
          headerAvatar.src = profile.avatar_url
        }
        
        if (headerUsername) {
          headerUsername.textContent = profile.username || user.email
        }
      }
    }
  } catch (error) {
    console.error("Error updating header user info:", error)
  }
}

// Initialize the file uploader
function initializeFileUploader() {
  try {
    fileUploader = initFileUpload("#file-upload-container", "#waste-photos", "#preview-images", {
      onValidationError: (errorMessage) => {
        showNotification(errorMessage, "error")
      },
      maxFiles: 5,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    })
  } catch (error) {
    console.error("Error initializing file uploader:", error)
    showNotification("There was an error initializing the file uploader.", "error")
  }
}

// Initialize the map module
function initializeMapModule() {
  try {
    // Add event listener for when Google Maps API loads
    document.addEventListener('googleMapsLoaded', () => {
      initializeMapComponents()
    }, { once: true })

    // If Google Maps is already loaded, initialize map components
    if (window.google && window.google.maps) {
      initializeMapComponents()
    } else {
      // Load Google Maps API from maps.js module
      console.log("Waiting for Google Maps API to load...")
    }
  } catch (error) {
    console.error("Error initializing map module:", error)
    showNotification("There was an error initializing the map. Please refresh and try again.", "error")
  }
}

// Initialize map components
function initializeMapComponents() {
  try {
    console.log("Initializing map components...");
    
    // Check if map element exists
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.error("Map element with ID 'map' not found");
      showNotification("Map element not found. Please refresh the page.", "error");
      return;
    }
    
    // Force a reflow to ensure the map container has proper dimensions
    mapElement.offsetHeight;
    
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded yet");
      showNotification("Google Maps API not loaded. Please refresh the page.", "error");
      return;
    }
    
    console.log("Creating map with Google Maps API...");
    
    // Create a map centered on a default location
    map = new google.maps.Map(mapElement, {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco as default
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      zoomControl: true,
    });
    
    if (!map) {
      console.error("Map creation failed");
      showNotification("Failed to create the map. Please refresh the page and try again.", "error");
      return;
    }
    
    console.log("Map created successfully, adding marker...");
    
    // Add a marker to the map
    marker = new google.maps.Marker({
      position: { lat: 37.7749, lng: -122.4194 },
      map: map,
      draggable: true,
      animation: google.maps.Animation.DROP
    });
    
    // Add event listener for marker drag end
    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      updateLocationFields(position);
      updateAddressFromPosition(position);
    });
    
    // Initialize geocoder if not already
    if (!geocoder) {
      geocoder = new google.maps.Geocoder();
    }
    
    // Add click event to the map
    map.addListener("click", (event) => {
      marker.setPosition(event.latLng);
      updateLocationFields(event.latLng);
      updateAddressFromPosition(event.latLng);
    });
    
    // Initialize Places Autocomplete
    const autocompleteInput = document.getElementById("waste-location");
    if (autocompleteInput) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInput);
      autocomplete.bindTo("bounds", map);
      
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          showNotification("No location details available for this place.", "error");
          return;
        }
        
        // Update map and marker
        map.setCenter(place.geometry.location);
        marker.setPosition(place.geometry.location);
        
        // Update form fields
        updateLocationFields(place.geometry.location);
        
        // Update the address display
        if (place.formatted_address) {
          addressDisplay.textContent = place.formatted_address;
          addressDisplay.classList.add("has-address");
          // Update location status
          locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> Location set successfully`;
          locationStatus.classList.add("success");
        }
      });
    }
    
    console.log("Map components initialized successfully");
    showNotification("Map loaded successfully. You can now select a location.", "success");
    
  } catch (error) {
    console.error("Error initializing map components:", error);
    showNotification("There was an error initializing the map: " + error.message, "error");
  }
}

// Set up event handlers
function setupEventHandlers() {
  // Current location button
  currentLocationBtn?.addEventListener("click", async () => {
    try {
      showNotification("Getting your current location...", "info")
      const position = await mapsModule.getCurrentLocation()

      // Update map and marker
      mapsModule.centerMap(position)
      mapsModule.updateMarkerPosition(position)

      // Update location fields
      updateLocationFields(position)

      // Get address from coordinates
      updateAddressFromPosition(position)
      
    } catch (error) {
      console.error("Error getting current location:", error)
      showNotification(
        "Could not get your current location. Please ensure you have given permission for location access or enter the location manually.",
        "error"
      )
    }
  })

  // Progress steps navigation
  progressSteps.forEach((step, index) => {
    step.addEventListener("click", () => {
      // Implement step navigation logic here
      goToStep(index + 1)
    })
  })
  
  // Form submission
  reportForm?.addEventListener("submit", async (event) => {
    event.preventDefault()

    // Validate the form
    if (!validateForm()) {
      return
    }

    // Show loading state
    setFormLoading(true)

    try {
      // Submit the report
      const reportResult = await submitReport()
      
      if (reportResult) {
        // Show success message
        showNotification("Your waste report has been submitted successfully! Thank you for contributing to a cleaner community.", "success")

        // Reset form
        resetForm()
      } else {
        throw new Error("Failed to submit report")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      showNotification("There was an error submitting your report. Please try again later.", "error")
    } finally {
      // Hide loading state
      setFormLoading(false)
    }
  })
}

// Go to a specific step in the progress
function goToStep(stepNumber) {
  progressSteps.forEach((step, index) => {
    if (index + 1 < stepNumber) {
      step.classList.remove("active")
      step.classList.add("completed")
    } else if (index + 1 === stepNumber) {
      step.classList.add("active")
      step.classList.remove("completed")
    } else {
      step.classList.remove("active")
      step.classList.remove("completed")
    }
  })
  
  // Implement logic to show/hide form sections based on step
  // For now, this is just visual and doesn't affect the form display
}

// Update location fields with position
function updateLocationFields(position) {
  try {
    // Check if position is a Google Maps LatLng object or a basic object
    const lat = position.lat ? position.lat() : position.lat;
    const lng = position.lng ? position.lng() : position.lng;
    
    // Update the form fields
    if (wasteLatitude && wasteLongitude) {
      wasteLatitude.value = typeof lat === 'function' ? lat() : lat;
      wasteLongitude.value = typeof lng === 'function' ? lng() : lng;
      
      console.log("Location fields updated:", wasteLatitude.value, wasteLongitude.value);
    } else {
      console.error("Latitude or longitude form fields not found");
    }
  } catch (error) {
    console.error("Error updating location fields:", error);
  }
}

// Update address from position
async function updateAddressFromPosition(position) {
  try {
    if (!geocoder) {
      geocoder = new google.maps.Geocoder();
    }
    
    // Convert position to appropriate format if needed
    const latLng = position instanceof google.maps.LatLng
      ? position
      : new google.maps.LatLng(position.lat, position.lng);
    
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        
        // Update address display if it exists
        if (addressDisplay) {
          addressDisplay.textContent = address;
          addressDisplay.classList.add("has-address");
        }
        
        // Update location status if it exists
        if (locationStatus) {
          locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> Location set successfully`;
          locationStatus.classList.add("success");
        }
        
        // Update location input if it exists
        if (wasteLocation) {
          wasteLocation.value = address;
        }
        
        console.log("Address updated:", address);
      } else {
        console.error("Geocoder failed due to:", status);
        if (addressDisplay) {
          addressDisplay.textContent = "Address could not be determined";
          addressDisplay.classList.remove("has-address");
        }
        
        if (locationStatus) {
          locationStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Address could not be determined, but location is set`;
          locationStatus.classList.remove("success");
          locationStatus.classList.add("warning");
        }
      }
    });
  } catch (error) {
    console.error("Error in updateAddressFromPosition:", error);
    showNotification("Error retrieving address from location", "error");
  }
}

// Validate the form before submission
function validateForm() {
  // Check if waste type is selected
  if (!wasteTypeSelect.value) {
    showNotification("Please select a waste type.", "error")
    wasteTypeSelect.focus()
    return false
  }

  // Check if quantity is provided
  if (!wasteQuantity.value) {
    showNotification("Please enter an estimated quantity.", "error")
    wasteQuantity.focus()
    return false
  }

  // Check if urgency is selected
  const selectedUrgency = Array.from(urgencyOptions).find(option => option.checked)
  if (!selectedUrgency) {
    showNotification("Please select an urgency level.", "error")
    urgencyOptions[0].focus()
    return false
  }

  // Check if description is provided
  if (!wasteDescription.value.trim()) {
    showNotification("Please provide a description of the waste.", "error")
    wasteDescription.focus()
    return false
  }

  // Check if location is provided
  if (!wasteLocation.value.trim()) {
    showNotification("Please provide a location for the waste.", "error")
    wasteLocation.focus()
    return false
  }

  // Check if coordinates are available
  if (!wasteLatitude.value || !wasteLongitude.value) {
    showNotification("Please select a precise location on the map.", "error")
    return false
  }

  // Check if at least one photo is uploaded (optional, remove if not required)
  const files = fileUploader ? fileUploader.getFiles() : []
  if (files.length === 0) {
    const confirmUpload = confirm("You haven't uploaded any photos. Photos help our team identify and clean up waste more efficiently. Do you want to continue without photos?")
    if (!confirmUpload) {
      return false
    }
  }

  return true
}

// Set the form in loading state
function setFormLoading(isLoading) {
  const submitBtn = reportForm.querySelector('button[type="submit"]')

  if (isLoading) {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'

    // Disable form fields
    Array.from(reportForm.elements).forEach((element) => {
      if (element.tagName !== "BUTTON") {
        element.disabled = true
      }
    })
  } else {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Report'

    // Enable form fields
    Array.from(reportForm.elements).forEach((element) => {
      if (element.tagName !== "BUTTON") {
        element.disabled = false
      }
    })
  }
}

// Reset the form after submission
function resetForm() {
  reportForm.reset()

  // Reset urgency options
  urgencyOptions.forEach((option) => {
    option.checked = false
  })

  // Reset file uploader
  if (fileUploader) {
    fileUploader.reset()
  }

  // Reset map to default position
  if (map && marker) {
    const defaultPosition = { lat: 37.7749, lng: -122.4194 }
    mapsModule.centerMap(defaultPosition)
    mapsModule.updateMarkerPosition(defaultPosition)
    updateLocationFields(defaultPosition)
  }
  
  // Reset address display
  addressDisplay.textContent = "No address selected"
  addressDisplay.classList.remove("has-address")
  
  // Reset location status
  locationStatus.innerHTML = "Please set the waste location on the map"
  locationStatus.classList.remove("success")
  
  // Reset progress steps
  goToStep(1)
}

// Submit the report to Supabase
async function submitReport() {
  try {
    // Get the current user
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get selected urgency level
    const selectedUrgency = Array.from(urgencyOptions).find(option => option.checked)
    const urgencyLevel = selectedUrgency ? selectedUrgency.value : null

    // Get uploaded files
    let imageUrls = []
    const files = fileUploader ? fileUploader.getFiles() : []

    // Upload images if there are any
    if (files.length > 0) {
      // Show notification
      showNotification("Uploading images...", "info")
      
      // Resize images before uploading to save space
      const resizedFiles = await Promise.all(
        files.map((file) =>
          resizeImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
          }),
        ),
      )

      // Convert Blobs to Files with proper names
      const preparedFiles = resizedFiles.map((blob, index) => {
        const originalFile = files[index]
        return new File([blob], originalFile.name, { type: blob.type })
      })

      // Upload to Supabase storage
      imageUrls = await uploadToSupabase(preparedFiles, "waste-reports", `${user.id}/${Date.now()}`)
    }

    // Prepare the report data
    const reportData = {
      user_id: user.id,
      title: wasteTypeSelect.options[wasteTypeSelect.selectedIndex].text, // Use the waste type as the title
      description: wasteDescription.value.trim(),
      waste_type: wasteTypeSelect.value,
      quantity: Number.parseFloat(wasteQuantity.value),
      urgency: urgencyLevel,
      location: wasteLocation.value.trim(),
      landmark: wasteLandmark ? wasteLandmark.value.trim() : null,
      latitude: Number.parseFloat(wasteLatitude.value),
      longitude: Number.parseFloat(wasteLongitude.value),
      status: "pending",
      image_urls: imageUrls,
      created_at: new Date().toISOString(),
    }

    // Show notification
    showNotification("Submitting your report...", "info")

    // Insert the report into the database
    const { data, error } = await supabase.from("waste_reports").insert([reportData])

    if (error) throw error

    // After successful insertion, add points to the user
    await addPointsToUser(user.id, 50, "Reported waste")

    return data
  } catch (error) {
    console.error("Error submitting report:", error)
    throw error
  }
}

// Add points to the user
async function addPointsToUser(userId, points, reason) {
  try {
    // Get the current user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("points, level")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    // Calculate new points and check if level up is needed
    const currentPoints = profile.points || 0
    const newPoints = currentPoints + points
    const currentLevel = profile.level || 1
    
    // Update user profile with new points
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
      })
      .eq("id", userId)

    if (updateError) throw updateError

    // Add record to points history
    const { error: historyError } = await supabase
      .from("points_history")
      .insert([{
        user_id: userId,
        points: points,
        reason: reason,
        created_at: new Date().toISOString()
      }])

    if (historyError) throw historyError

    // Show notification about earned points
    showNotification(`You earned ${points} points for reporting waste!`, "success")

    return { success: true, points: newPoints }
  } catch (error) {
    console.error("Error adding points to user:", error)
    return { success: false, error }
  }
}

