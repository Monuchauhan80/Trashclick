import { initializeTheme, toggleTheme } from "./theme.js"
import { showNotification } from "./utils.js"

document.addEventListener("DOMContentLoaded", () => {
  initAboutPage()
})

/**
 * Initialize the about page functionality
 */
function initAboutPage() {
  // Initialize theme
  initializeTheme()

  // Setup event listeners
  setupEventListeners()

  // Animate statistics on scroll
  initStatCounter()

  // Initialize timeline animations
  initTimelineAnimation()
}

/**
 * Setup event listeners for the about page
 */
function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      toggleTheme()
    })
  }

  // Contact form in the join section
  const contactForm = document.getElementById("contact-form")
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()
      // Process form data
      const formData = new FormData(contactForm)
      const name = formData.get("name")
      const email = formData.get("email")
      const message = formData.get("message")

      // Validate form data
      if (!name || !email || !message) {
        showNotification("Please fill in all required fields", "error")
        return
      }

      // Send form data to server (placeholder for actual implementation)
      console.log("Form submitted:", { name, email, message })

      // Show success message
      showNotification("Your message has been sent successfully!", "success")

      // Reset form
      contactForm.reset()
    })
  }

  // Partner logo hover effects
  const partnerLogos = document.querySelectorAll(".partner-logo")
  partnerLogos.forEach((logo) => {
    logo.addEventListener("mouseenter", () => {
      logo.style.filter = "grayscale(0%)"
      logo.style.opacity = "1"
    })

    logo.addEventListener("mouseleave", () => {
      logo.style.filter = "grayscale(100%)"
      logo.style.opacity = "0.7"
    })
  })
}

/**
 * Initialize the statistic counters animation on scroll
 */
function initStatCounter() {
  const statElements = document.querySelectorAll(".stat-number")

  if (statElements.length === 0) return

  const options = {
    threshold: 0.5,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target
        const targetValue = Number.parseInt(element.getAttribute("data-value"), 10)

        if (!element.classList.contains("counted")) {
          animateCounter(element, targetValue)
          element.classList.add("counted")
        }
      }
    })
  }, options)

  statElements.forEach((stat) => {
    observer.observe(stat)
  })
}

/**
 * Animate a counter from 0 to target value
 * @param {HTMLElement} element - The element to animate
 * @param {number} targetValue - The target value to count up to
 */
function animateCounter(element, targetValue) {
  let currentValue = 0
  const duration = 2000 // 2 seconds
  const interval = 20 // Update every 20ms
  const steps = duration / interval
  const increment = targetValue / steps

  const timer = setInterval(() => {
    currentValue += increment
    if (currentValue >= targetValue) {
      element.textContent = formatNumber(targetValue)
      clearInterval(timer)
    } else {
      element.textContent = formatNumber(Math.floor(currentValue))
    }
  }, interval)
}

/**
 * Format a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} The formatted number
 */
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Initialize the timeline animation
 */
function initTimelineAnimation() {
  const timelineItems = document.querySelectorAll(".timeline-item")

  if (timelineItems.length === 0) return

  const options = {
    threshold: 0.2,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in")
        observer.unobserve(entry.target)
      }
    })
  }, options)

  timelineItems.forEach((item) => {
    item.classList.add("timeline-hidden")
    observer.observe(item)
  })
}

// Add CSS for animation
const style = document.createElement("style")
style.textContent = `
.timeline-hidden {
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in {
    opacity: 1;
    transform: translateY(0);
}
`
document.head.appendChild(style)

export { initAboutPage }

