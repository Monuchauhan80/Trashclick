/**
 * TrashClick utility functions
 * Common functions used across the site
 */

/**
 * Shows a notification toast with a message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - How long to show the notification in ms (default: 5000)
 */
export function showNotification(message, type = "info", duration = 5000) {
  const toast = document.getElementById("notification-toast")
  if (!toast) return

  const messageElement = document.getElementById("notification-message")
  if (messageElement) {
    messageElement.textContent = message
  }

  // Remove existing type classes
  toast.classList.remove("success", "error", "info", "warning")

  // Add the type class
  toast.classList.add(type)

  // Show the toast
  toast.classList.add("show")

  // Auto-hide after duration
  const autoHideTimeout = setTimeout(() => {
    toast.classList.remove("show")
  }, duration)

  // Store the timeout ID so it can be cleared if the toast is closed manually
  toast.dataset.timeoutId = autoHideTimeout

  // Setup close button
  const closeButton = document.getElementById("notification-close")
  if (closeButton) {
    closeButton.addEventListener(
      "click",
      () => {
        clearTimeout(Number.parseInt(toast.dataset.timeoutId))
        toast.classList.remove("show")
      },
      { once: true },
    )
  }
}

/**
 * Format a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} - The formatted number
 */
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format to use ('short', 'medium', 'long', 'full')
 * @returns {string} - The formatted date
 */
export function formatDate(date, format = "medium") {
  if (typeof date === "string") {
    date = new Date(date)
  }

  const options = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  }

  return date.toLocaleDateString(undefined, options[format])
}

/**
 * Format time to a readable string (12-hour format)
 * @param {string} time - The time to format (HH:MM format)
 * @returns {string} - The formatted time
 */
export function formatTime(time) {
  if (!time) return ""

  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12

  return `${hour12}:${minutes} ${ampm}`
}

/**
 * Truncate text to a certain length and add ellipsis
 * @param {string} text - The text to truncate
 * @param {number} length - The maximum length
 * @returns {string} - The truncated text
 */
export function truncateText(text, length = 100) {
  if (!text) return ""
  if (text.length <= length) return text

  return text.substring(0, length) + "..."
}

/**
 * Generate random ID
 * @param {number} length - Length of the ID
 * @returns {string} - Random ID
 */
export function generateId(length = 10) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in ms
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300) {
  let timeout

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get a value from localStorage with proper parsing
 * @param {string} key - The key to get
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - The stored value
 */
export function getFromStorage(key, defaultValue = null) {
  const item = localStorage.getItem(key)

  if (item === null) return defaultValue

  try {
    return JSON.parse(item)
  } catch (e) {
    return item
  }
}

/**
 * Set a value in localStorage with proper stringification
 * @param {string} key - The key to set
 * @param {any} value - The value to store
 */
export function setToStorage(key, value) {
  if (typeof value === "object") {
    localStorage.setItem(key, JSON.stringify(value))
  } else {
    localStorage.setItem(key, value)
  }
}

/**
 * Validate an email address format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

/**
 * Create an element with attributes and children
 * @param {string} tag - The tag name
 * @param {Object} attributes - The attributes to set
 * @param {Array|string|Node} children - The children to append
 * @returns {Element} - The created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag)

  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") {
      element.className = value
    } else if (key === "dataset") {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue
      }
    } else if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.substring(2).toLowerCase(), value)
    } else {
      element.setAttribute(key, value)
    }
  }

  // Append children
  if (children) {
    if (typeof children === "string") {
      element.textContent = children
    } else if (children instanceof Node) {
      element.appendChild(children)
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child))
        } else if (child instanceof Node) {
          element.appendChild(child)
        }
      })
    }
  }

  return element
}

/**
 * Convert bytes to human-readable file size
 * @param {number} bytes - The file size in bytes
 * @returns {string} - Human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format a date object or string into a readable format
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include the time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncateString(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Validate an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Generate a random ID string
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Check if the app name is correct and fix any instances of incorrect names
 * @returns {void}
 */
export function validateAppName() {
    const oldName = 'EcoTrack';
    const newName = 'TrashClick';
    
    // Check all text nodes in the document for the old name
    const textWalker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        { acceptNode: node => node.nodeValue.includes(oldName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );
    
    const nodesToFix = [];
    while(textWalker.nextNode()) {
        nodesToFix.push(textWalker.currentNode);
    }
    
    // Replace old name with new name
    nodesToFix.forEach(node => {
        node.nodeValue = node.nodeValue.replace(new RegExp(oldName, 'g'), newName);
    });
    
    // Check attributes (like placeholder, title, alt)
    const elements = document.querySelectorAll('[placeholder],[title],[alt]');
    elements.forEach(el => {
        if (el.hasAttribute('placeholder') && el.getAttribute('placeholder').includes(oldName)) {
            el.setAttribute('placeholder', el.getAttribute('placeholder').replace(new RegExp(oldName, 'g'), newName));
        }
        if (el.hasAttribute('title') && el.getAttribute('title').includes(oldName)) {
            el.setAttribute('title', el.getAttribute('title').replace(new RegExp(oldName, 'g'), newName));
        }
        if (el.hasAttribute('alt') && el.getAttribute('alt').includes(oldName)) {
            el.setAttribute('alt', el.getAttribute('alt').replace(new RegExp(oldName, 'g'), newName));
        }
    });
}

/**
 * Add animation to an element
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationClass - CSS animation class to add
 * @param {boolean} removeAfter - Whether to remove the class after animation
 */
export function animateElement(element, animationClass, removeAfter = true) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    if (removeAfter) {
        const animationDuration = getComputedStyle(element).animationDuration;
        const durationMs = parseFloat(animationDuration) * 1000;
        
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, durationMs);
    }
}

/**
 * Update the database table for user profiles
 * @param {string} userId - User ID 
 * @param {object} data - Data to update
 * @returns {Promise<boolean>} Success result
 */
export async function updateUserData(userId, data) {
    if (!userId) return false;
    
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update(data)
            .eq('id', userId);
            
        return !error;
    } catch (error) {
        console.error('Error updating user data:', error);
        return false;
    }
}

/**
 * Format a number with thousands separators
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined) return 'N/A';
  
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Detect brand inconsistencies and fix them
 * Used to find and fix any remaining "EcoTrack" references
 * @param {string} text - Text to check for brand inconsistencies
 * @returns {string} Fixed text with correct branding
 */
export function fixBranding(text) {
  if (!text) return text;
  
  return text.replace(/EcoTrack/g, 'TrashClick');
}

/**
 * Throttle a function to limit how often it can be called
 * @param {function} func - The function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

