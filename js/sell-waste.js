/**
 * Sell Waste page JavaScript
 * Handles recyclable material listings, form interactions, and submissions
 */

import { showNotification, formatNumber } from "./utils.js"

const SellWaste = (() => {
  // DOM element references
  let materialContainer
  let addMaterialBtn
  let materialForm
  let dropoffFields
  let pickupFields
  let bankFields
  let collectionMethodRadios
  let paymentMethodRadios
  let materialPhotosInput
  let filePreview
  let useProfileAddressCheckbox
  let successModal
  let modalClose
  let modalCloseBtn
  let faqItems
  let testimonialNavBtns
  let testimonialIndicators

  // State variables
  let materialRowCount = 1
  let selectedFiles = []
  let currentTestimonial = 0
  const testimonials = [
    {
      quote:
        "I've been recycling for years, but TrashClick makes it so much more rewarding. The points system has helped me save enough for a new eco-friendly bike!",
      author: "Sarah M.",
      location: "Chicago, IL",
      image: "img/testimonial-1.jpg",
      rating: 5,
    },
    {
      quote:
        "The pickup service is a game-changer. Last month I sold over 200kg of recyclables without leaving my apartment. The payment was in my account the next day!",
      author: "Michael T.",
      location: "Austin, TX",
      image: "img/testimonial-2.jpg",
      rating: 5,
    },
    {
      quote:
        "As a small business owner, I appreciate how TrashClick helps me manage and monetize our waste stream. The dashboard makes tracking our environmental impact easy.",
      author: "Priya K.",
      location: "Portland, OR",
      image: "img/testimonial-3.jpg",
      rating: 4,
    },
  ]

  /**
   * Initialize the Sell Waste page
   */
  function init() {
    cacheDOM()
    bindEvents()
    setupFAQs()
    updateRatesDate()
    setupTestimonials()

    // Check login status to pre-fill user info if available
    checkLoginStatus()
  }

  /**
   * Cache DOM elements for future use
   */
  function cacheDOM() {
    materialContainer = document.querySelector(".materials-container")
    addMaterialBtn = document.getElementById("add-material")
    materialForm = document.getElementById("recyclables-form")
    dropoffFields = document.getElementById("dropoff-fields")
    pickupFields = document.getElementById("pickup-fields")
    bankFields = document.getElementById("bank-fields")
    collectionMethodRadios = document.querySelectorAll('input[name="collectionMethod"]')
    paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]')
    materialPhotosInput = document.getElementById("material-photos")
    filePreview = document.getElementById("file-preview")
    useProfileAddressCheckbox = document.getElementById("use-profile-address")
    successModal = document.getElementById("success-modal")
    modalClose = document.querySelector(".modal-close")
    modalCloseBtn = document.querySelector(".modal-close-btn")
    faqItems = document.querySelectorAll(".faq-item")
    testimonialNavBtns = document.querySelectorAll(".testimonial-nav")
    testimonialIndicators = document.querySelectorAll(".indicator")
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    if (addMaterialBtn) {
      addMaterialBtn.addEventListener("click", addMaterialRow)
    }

    if (materialContainer) {
      materialContainer.addEventListener("click", handleMaterialRowAction)
    }

    if (materialForm) {
      materialForm.addEventListener("submit", handleFormSubmit)
      materialForm.addEventListener("reset", resetForm)
    }

    if (collectionMethodRadios.length) {
      collectionMethodRadios.forEach((radio) => {
        radio.addEventListener("change", toggleCollectionFields)
      })
    }

    if (paymentMethodRadios.length) {
      paymentMethodRadios.forEach((radio) => {
        radio.addEventListener("change", togglePaymentFields)
      })
    }

    if (materialPhotosInput) {
      materialPhotosInput.addEventListener("change", handleFileSelection)
    }

    if (useProfileAddressCheckbox) {
      useProfileAddressCheckbox.addEventListener("change", fillProfileAddress)
    }

    if (modalClose) {
      modalClose.addEventListener("click", closeModal)
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal)
    }

    // Close modal when clicking outside of it
    window.addEventListener("click", (e) => {
      if (e.target === successModal) {
        closeModal()
      }
    })

    // Bind FAQ toggle events
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question")
      if (question) {
        question.addEventListener("click", () => toggleFAQ(item))
      }
    })

    // Bind testimonial navigation
    if (testimonialNavBtns.length) {
      testimonialNavBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (btn.classList.contains("prev")) {
            navigateTestimonial(-1)
          } else {
            navigateTestimonial(1)
          }
        })
      })
    }

    if (testimonialIndicators.length) {
      testimonialIndicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => {
          showTestimonial(index)
        })
      })
    }
  }

  /**
   * Add a new material row to the form
   */
  function addMaterialRow() {
    materialRowCount++
    const newRow = document.createElement("div")
    newRow.className = "material-row"
    newRow.innerHTML = `
            <div class="form-group">
                <label for="material-type-${materialRowCount}">Material Type <span class="required">*</span></label>
                <select id="material-type-${materialRowCount}" name="materialType[]" required>
                    <option value="">Select material type</option>
                    <option value="paper">Paper & Cardboard</option>
                    <option value="pet-plastic">PET Plastic (Type 1)</option>
                    <option value="hdpe-plastic">HDPE Plastic (Type 2)</option>
                    <option value="other-plastic">Other Plastics (Types 3-7)</option>
                    <option value="glass">Glass</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="scrap-metal">Scrap Metal</option>
                    <option value="e-waste">E-Waste</option>
                    <option value="batteries">Batteries</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="material-description-${materialRowCount}">Description</label>
                <input type="text" id="material-description-${materialRowCount}" name="materialDescription[]" placeholder="e.g., Office paper, soda bottles, etc.">
            </div>
            <div class="form-group quantity-group">
                <label for="material-quantity-${materialRowCount}">Estimated Quantity <span class="required">*</span></label>
                <div class="input-group">
                    <input type="number" id="material-quantity-${materialRowCount}" name="materialQuantity[]" min="0.1" step="0.1" required>
                    <select id="quantity-unit-${materialRowCount}" name="quantityUnit[]">
                        <option value="kg" selected>Kg</option>
                        <option value="lb">lb</option>
                    </select>
                </div>
            </div>
            <button type="button" class="btn-icon remove-material" data-row="${materialRowCount}">
                <i class="fas fa-times"></i>
            </button>
        `

    materialContainer.appendChild(newRow)

    // Enable remove button on the first row if we now have more than one row
    if (materialRowCount === 2) {
      const firstRowRemoveBtn = document.querySelector(".material-row:first-child .remove-material")
      if (firstRowRemoveBtn) {
        firstRowRemoveBtn.disabled = false
        firstRowRemoveBtn.dataset.row = 1
      }
    }

    // Animate the new row
    setTimeout(() => {
      newRow.style.opacity = 1
    }, 10)
  }

  /**
   * Handle click events within material rows (remove button)
   * @param {Event} e - The click event
   */
  function handleMaterialRowAction(e) {
    const btn = e.target.closest(".remove-material")
    if (btn && !btn.disabled) {
      const row = btn.closest(".material-row")
      if (row) {
        row.remove()
        materialRowCount--

        // If only one row remains, disable its remove button
        if (materialRowCount === 1) {
          const firstRowRemoveBtn = document.querySelector(".material-row:first-child .remove-material")
          if (firstRowRemoveBtn) {
            firstRowRemoveBtn.disabled = true
          }
        }
      }
    }
  }

  /**
   * Toggle visibility of collection-related fields based on selected method
   */
  function toggleCollectionFields() {
    const selectedMethod = document.querySelector('input[name="collectionMethod"]:checked').value

    if (selectedMethod === "dropoff") {
      dropoffFields.classList.remove("hidden")
      pickupFields.classList.add("hidden")

      // Remove required attribute from pickup fields
      document.getElementById("pickup-address").removeAttribute("required")
      document.getElementById("pickup-date").removeAttribute("required")
    } else {
      dropoffFields.classList.add("hidden")
      pickupFields.classList.remove("hidden")

      // Add required attribute to pickup fields
      document.getElementById("pickup-address").setAttribute("required", "")
      document.getElementById("pickup-date").setAttribute("required", "")

      // Remove required attribute from dropoff fields
      document.getElementById("dropoff-date").removeAttribute("required")
    }
  }

  /**
   * Toggle visibility of payment-related fields based on selected method
   */
  function togglePaymentFields() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value

    if (selectedMethod === "bank") {
      bankFields.classList.remove("hidden")
    } else {
      bankFields.classList.add("hidden")
    }
  }

  /**
   * Handle file selection for material photos
   * @param {Event} e - The change event
   */
  function handleFileSelection(e) {
    const files = Array.from(e.target.files)

    // Limit to 5 files
    if (selectedFiles.length + files.length > 5) {
      showNotification("You can upload a maximum of 5 photos.", "error")
      return
    }

    // Check file types and sizes
    const validFiles = files.filter((file) => {
      const validType = file.type.startsWith("image/")
      const validSize = file.size <= 5 * 1024 * 1024 // 5MB

      if (!validType) {
        showNotification(`"${file.name}" is not a valid image file.`, "error")
      }

      if (!validSize) {
        showNotification(`"${file.name}" exceeds the 5MB size limit.`, "error")
      }

      return validType && validSize
    })

    selectedFiles = [...selectedFiles, ...validFiles]
    updateFilePreview()
  }

  /**
   * Update the file preview area with selected images
   */
  function updateFilePreview() {
    filePreview.innerHTML = ""

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader()
      const previewItem = document.createElement("div")
      previewItem.className = "file-preview-item"

      reader.onload = (e) => {
        previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="file-preview-remove" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </div>
                `
      }

      reader.readAsDataURL(file)
      filePreview.appendChild(previewItem)

      // Add event listener for remove button
      setTimeout(() => {
        const removeBtn = previewItem.querySelector(".file-preview-remove")
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            selectedFiles.splice(index, 1)
            updateFilePreview()
          })
        }
      }, 100)
    })
  }

  /**
   * Fill address fields with the user's profile address if checkbox is checked
   */
  function fillProfileAddress() {
    if (useProfileAddressCheckbox.checked) {
      // In a real app, this would fetch the address from the user's profile
      // For demo purposes, we'll use a placeholder address
      document.getElementById("pickup-address").value = "123 Green Street, Eco City, EC 12345"
      document.getElementById("pickup-address").setAttribute("readonly", "")
    } else {
      document.getElementById("pickup-address").value = ""
      document.getElementById("pickup-address").removeAttribute("readonly")
    }
  }

  /**
   * Check if the user is logged in and pre-fill information if available
   */
  function checkLoginStatus() {
    // In a real app, this would check session/token and fetch user data
    // For demo purposes, we'll simulate a logged-in user
    const isLoggedIn = localStorage.getItem("trashclick_logged_in") === "true"

    if (isLoggedIn) {
      // Pre-fill user information if available
      if (useProfileAddressCheckbox) {
        useProfileAddressCheckbox.disabled = false
      }
    } else {
      // Disable profile address checkbox if not logged in
      if (useProfileAddressCheckbox) {
        useProfileAddressCheckbox.disabled = true
        useProfileAddressCheckbox.checked = false
        useProfileAddressCheckbox.parentElement.title = "Please log in to use your profile address"
      }
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - The submit event
   */
  function handleFormSubmit(e) {
    e.preventDefault()

    // Validate the form
    if (!validateForm()) {
      return
    }

    // Collect form data
    const formData = new FormData(materialForm)

    // In a real app, this would send the data to the server
    // For demo purposes, we'll simulate a successful submission
    setTimeout(() => {
      // Show success modal
      showSuccessModal()

      // Reset the form
      resetForm()

      // Show a notification
      showNotification("Your recyclables listing has been submitted successfully!", "success")
    }, 1500)
  }

  /**
   * Validate the form before submission
   * @returns {boolean} - Whether the form is valid
   */
  function validateForm() {
    let isValid = true
    let totalWeight = 0

    // Validate material quantities
    const quantities = document.querySelectorAll('input[name="materialQuantity[]"]')
    quantities.forEach((input) => {
      if (!input.value || isNaN(input.value) || Number.parseFloat(input.value) <= 0) {
        isValid = false
        input.classList.add("error")
        setTimeout(() => input.classList.remove("error"), 3000)
      } else {
        totalWeight += Number.parseFloat(input.value)
      }
    })

    // If pickup is selected, validate minimum weight
    const collectionMethod = document.querySelector('input[name="collectionMethod"]:checked').value
    if (collectionMethod === "pickup" && totalWeight < 50) {
      showNotification(
        "Pickup requires a minimum of 50kg total weight. Your current total is " + totalWeight.toFixed(1) + "kg.",
        "error",
      )
      isValid = false
    }

    // Validate dates
    if (collectionMethod === "dropoff") {
      const dropoffDate = document.getElementById("dropoff-date").value
      if (dropoffDate) {
        const selectedDate = new Date(dropoffDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
          showNotification("Please select a future date for your dropoff.", "error")
          isValid = false
        }
      }
    } else {
      const pickupDate = document.getElementById("pickup-date").value
      if (pickupDate) {
        const selectedDate = new Date(pickupDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const minDate = new Date(today)
        minDate.setDate(today.getDate() + 1)

        if (selectedDate < minDate) {
          showNotification("Pickup requires at least 1 day advance notice.", "error")
          isValid = false
        }
      }
    }

    // Validate terms agreement
    const termsAgreement = document.getElementById("terms-agreement")
    if (!termsAgreement.checked) {
      showNotification("You must agree to the terms of service to proceed.", "error")
      isValid = false
    }

    return isValid
  }

  /**
   * Reset the form to its initial state
   */
  function resetForm() {
    // Reset form fields
    materialForm.reset()

    // Reset material rows
    while (materialContainer.children.length > 1) {
      materialContainer.removeChild(materialContainer.lastChild)
    }
    materialRowCount = 1

    // Reset file preview
    selectedFiles = []
    filePreview.innerHTML = ""

    // Reset remove button on first row
    const firstRowRemoveBtn = document.querySelector(".material-row:first-child .remove-material")
    if (firstRowRemoveBtn) {
      firstRowRemoveBtn.disabled = true
    }

    // Reset collection and payment fields
    dropoffFields.classList.remove("hidden")
    pickupFields.classList.add("hidden")
    bankFields.classList.add("hidden")
  }

  /**
   * Show the success modal with estimated earnings
   */
  function showSuccessModal() {
    // Calculate estimated earnings based on materials
    let estimatedEarningsMin = 0
    let estimatedEarningsMax = 0

    const materialTypes = document.querySelectorAll('select[name="materialType[]"]')
    const quantities = document.querySelectorAll('input[name="materialQuantity[]"]')
    const units = document.querySelectorAll('select[name="quantityUnit[]"]')

    for (let i = 0; i < materialTypes.length; i++) {
      const type = materialTypes[i].value
      let quantity = Number.parseFloat(quantities[i].value) || 0
      const unit = units[i].value

      // Convert pounds to kg if necessary
      if (unit === "lb") {
        quantity = quantity * 0.453592
      }

      // Calculate earnings based on material type
      switch (type) {
        case "paper":
          estimatedEarningsMin += quantity * 0.1 // $0.10 per kg
          estimatedEarningsMax += quantity * 0.25 // $0.25 per kg
          break
        case "pet-plastic":
          estimatedEarningsMin += quantity * 0.15 // $0.15 per kg
          estimatedEarningsMax += quantity * 0.4 // $0.40 per kg
          break
        case "hdpe-plastic":
          estimatedEarningsMin += quantity * 0.2 // $0.20 per kg
          estimatedEarningsMax += quantity * 0.5 // $0.50 per kg
          break
        case "glass":
          estimatedEarningsMin += quantity * 0.05 // $0.05 per kg
          estimatedEarningsMax += quantity * 0.15 // $0.15 per kg
          break
        case "aluminum":
          estimatedEarningsMin += quantity * 0.5 // $0.50 per kg
          estimatedEarningsMax += quantity * 1.2 // $1.20 per kg
          break
        case "scrap-metal":
          estimatedEarningsMin += quantity * 0.3 // $0.30 per kg
          estimatedEarningsMax += quantity * 1.5 // $1.50 per kg (average for various types)
          break
        case "e-waste":
          estimatedEarningsMin += quantity * 0.25 // $0.25 per kg
          estimatedEarningsMax += quantity * 2 // $2.00 per kg (average for various types)
          break
        case "batteries":
          estimatedEarningsMin += quantity * 0.2 // $0.20 per kg
          estimatedEarningsMax += quantity * 0.75 // $0.75 per kg
          break
        default:
          estimatedEarningsMin += quantity * 0.1 // $0.10 per kg
          estimatedEarningsMax += quantity * 0.3 // $0.30 per kg
          break
      }
    }

    // Update earnings display in modal
    document.querySelector(".earnings-amount").textContent =
      `$${estimatedEarningsMin.toFixed(2)} - $${estimatedEarningsMax.toFixed(2)}`
    document.querySelector(".earnings-points").textContent =
      `or ${formatNumber(Math.round(estimatedEarningsMin * 150))} - ${formatNumber(Math.round(estimatedEarningsMax * 150))} TrashClick points`

    // Show the modal
    successModal.style.display = "flex"
  }

  /**
   * Close the success modal
   */
  function closeModal() {
    successModal.style.display = "none"
  }

  /**
   * Set up FAQ functionality (toggle open/closed)
   */
  function setupFAQs() {
    // Open the first FAQ by default
    if (faqItems.length > 0) {
      toggleFAQ(faqItems[0])
    }
  }

  /**
   * Toggle a FAQ item open or closed
   * @param {Element} item - The FAQ item to toggle
   */
  function toggleFAQ(item) {
    // Close all FAQs
    faqItems.forEach((faq) => {
      if (faq !== item) {
        faq.classList.remove("active")
      }
    })

    // Toggle the selected FAQ
    item.classList.toggle("active")
  }

  /**
   * Update the rates date to today's date
   */
  function updateRatesDate() {
    const rateDate = document.querySelector(".rate-date")
    if (rateDate) {
      const today = new Date()
      const options = { year: "numeric", month: "long", day: "numeric" }
      rateDate.textContent = today.toLocaleDateString("en-US", options)
    }
  }

  /**
   * Set up testimonials slider functionality
   */
  function setupTestimonials() {
    // Show first testimonial by default
    showTestimonial(0)
  }

  /**
   * Navigate to the next or previous testimonial
   * @param {number} direction - The direction to navigate (1 for next, -1 for previous)
   */
  function navigateTestimonial(direction) {
    currentTestimonial = (currentTestimonial + direction + testimonials.length) % testimonials.length
    showTestimonial(currentTestimonial)
  }

  /**
   * Show a specific testimonial
   * @param {number} index - The index of the testimonial to show
   */
  function showTestimonial(index) {
    if (index < 0 || index >= testimonials.length) return

    currentTestimonial = index
    const testimonial = testimonials[index]

    // Update testimonial content
    const testimonialCard = document.querySelector(".testimonial-card")
    if (testimonialCard) {
      const quote = testimonialCard.querySelector(".testimonial-quote")
      const authorImg = testimonialCard.querySelector(".testimonial-author img")
      const authorName = testimonialCard.querySelector(".author-name")
      const authorRating = testimonialCard.querySelector(".author-rating")
      const authorLocation = testimonialCard.querySelector(".author-location")

      // Update text content
      if (quote) quote.textContent = testimonial.quote
      if (authorName) authorName.textContent = testimonial.author
      if (authorLocation) authorLocation.textContent = testimonial.location

      // Update image
      if (authorImg) {
        authorImg.src = testimonial.image
        authorImg.alt = testimonial.author
      }

      // Update rating stars
      if (authorRating) {
        authorRating.innerHTML = ""
        for (let i = 0; i < 5; i++) {
          const star = document.createElement("i")
          star.className = i < testimonial.rating ? "fas fa-star" : "far fa-star"
          authorRating.appendChild(star)
        }
      }
    }

    // Update indicators
    testimonialIndicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index)
    })
  }

  // Public API
  return {
    init: init,
  }
})()

// Initialize the module when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  SellWaste.init()
})

