import { initializeTheme, toggleTheme } from "./theme.js"
import { showNotification } from "./utils.js"

document.addEventListener("DOMContentLoaded", () => {
  initContactPage()
})

/**
 * Initialize the contact page functionality
 */
function initContactPage() {
  setupContactForm()
  setupFaqToggle()
  setupMapListeners()
}

/**
 * Setup contact form event listeners and validation
 */
function setupContactForm() {
  const contactForm = document.getElementById('contact-form')
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault()
      
      // Get form values
      const name = document.getElementById('name').value.trim()
      const email = document.getElementById('email').value.trim()
      const subject = document.getElementById('subject').value
      const message = document.getElementById('message').value.trim()
      const privacyConsent = document.getElementById('privacy-consent').checked
      
      // Validate form
      if (!name || !email || !subject || !message) {
        showToast('Please fill in all required fields', 'error')
        return
      }
      
      // Validate email
      if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error')
        return
      }
      
      // Check privacy consent
      if (!privacyConsent) {
        showToast('You must consent to our Privacy Policy', 'error')
    return
  }

      // Simulate form submission
      showToast('Sending your message...', 'info')
      
      // Simulate API delay
      setTimeout(() => {
        // Show success modal
        const successModal = document.getElementById('success-modal')
        if (successModal) {
          successModal.classList.add('active')
          
          // Setup close modal functionality
          const closeButtons = successModal.querySelectorAll('.modal-close, .modal-close-btn')
          closeButtons.forEach(button => {
            button.addEventListener('click', () => {
              successModal.classList.remove('active')
            })
          })
          
          // Close modal when clicking outside
          successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
              successModal.classList.remove('active')
            }
          })
        }
        
        // Reset form
        contactForm.reset()
      }, 1500)
    })
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Setup FAQ accordion functionality
 */
function setupFaqToggle() {
  const faqItems = document.querySelectorAll('.faq-item')
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question')
    const toggle = item.querySelector('.faq-toggle')
    
    if (question) {
      question.addEventListener('click', () => {
        // Toggle current FAQ
        item.classList.toggle('active')
        
        // Update icon
        const icon = toggle.querySelector('i')
        if (icon) {
          if (item.classList.contains('active')) {
            icon.classList.remove('fa-chevron-down')
            icon.classList.add('fa-chevron-up')
          } else {
            icon.classList.remove('fa-chevron-up')
            icon.classList.add('fa-chevron-down')
          }
        }
      })
    }
  })
}

/**
 * Setup map event listeners and initialization
 */
function setupMapListeners() {
  // Wait for Google Maps to be fully loaded
  document.addEventListener('googleMapsLoaded', () => {
    initializeContactMap()
  })
  
  // Fallback if the event doesn't fire
  setTimeout(() => {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      initializeContactMap()
    }
  }, 3000)
}

/**
 * Initialize the contact page map
 */
function initializeContactMap() {
  const mapElement = document.getElementById('map')
  
  if (!mapElement) return

  try {
    // Office location coordinates
    const officeLocation = { lat: 40.7128, lng: -74.0060 } // New York coordinates
    
    // Map options
    const mapOptions = {
      center: officeLocation,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      styles: [
        {
          "featureType": "administrative",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#444444"}]
        },
        {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [{"color": "#f2f2f2"}]
        },
        {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "road",
          "elementType": "all",
          "stylers": [{"saturation": -100}, {"lightness": 45}]
        },
        {
          "featureType": "road.highway",
          "elementType": "all",
          "stylers": [{"visibility": "simplified"}]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.icon",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "transit",
          "elementType": "all",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "water",
          "elementType": "all",
          "stylers": [{"color": "#c4e5f9"}, {"visibility": "on"}]
        }
      ]
    }
    
    // Create the map
  const map = new google.maps.Map(mapElement, mapOptions)

    // Create a marker for the office location
  const marker = new google.maps.Marker({
      position: officeLocation,
    map: map,
      title: 'TrashClick Headquarters',
      animation: google.maps.Animation.DROP,
    icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4CAF50',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    })
    
    // Create an info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
            <div class="map-info-window">
                <h3>TrashClick Headquarters</h3>
          <p><i class="fas fa-map-marker-alt"></i> 123 Green Street, Eco City, 10001</p>
          <p><i class="fas fa-phone-alt"></i> +1 (555) 123-4567</p>
          <p><i class="fas fa-envelope"></i> info@trashclick.com</p>
            </div>
      `
    })
    
    // Open info window when marker is clicked
    marker.addListener('click', () => {
      infoWindow.open(map, marker)
    })
    
    // Open info window by default
    infoWindow.open(map, marker)
    
  } catch (error) {
    console.error('Error initializing map:', error)
    mapElement.innerHTML = '<div class="map-error">Unable to load map. Please try again later.</div>'
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('notification-toast')
  
  if (!toast) return
  
  // Set message and type
  toast.textContent = message
  toast.className = 'toast'
  toast.classList.add(type)
  
  // Show toast
  toast.classList.add('show')
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show')
  }, 3000)
}

export { initContactPage }

