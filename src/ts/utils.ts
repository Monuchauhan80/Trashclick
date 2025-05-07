/**
 * Utility functions for the TrashClick application
 */

/**
 * Display a notification message to the user
 * @param message - The message to display
 * @param type - Type of notification (success, error, warning, info)
 * @param duration - How long to show the notification in ms (default: 5000)
 */
export function showNotification(
  message: string, 
  type: 'success' | 'error' | 'warning' | 'info' = 'info', 
  duration: number = 5000
): void {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Set notification content
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas ${getIconForType(type)}"></i>
    </div>
    <div class="notification-body">
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" aria-label="Close notification">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to container
  container.appendChild(notification);
  
  // Add close handler
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeNotification(notification);
    });
  }
  
  // Auto remove after duration
  setTimeout(() => {
    removeNotification(notification);
  }, duration);
}

/**
 * Remove a notification element with animation
 * @param notification - The notification element to remove
 */
function removeNotification(notification: HTMLElement): void {
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(100%)';
  
  // Remove from DOM after animation completes
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 300);
}

/**
 * Get the appropriate Font Awesome icon class for a notification type
 * @param type - Notification type
 * @returns The FontAwesome icon class
 */
function getIconForType(type: 'success' | 'error' | 'warning' | 'info'): string {
  switch (type) {
    case 'success':
      return 'fa-check-circle';
    case 'error':
      return 'fa-exclamation-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'info':
    default:
      return 'fa-info-circle';
  }
}

/**
 * Format a date string or timestamp into a human-readable date
 * @param date - Date string or timestamp
 * @param includeTime - Whether to include the time
 * @returns Formatted date string
 */
export function formatDate(date: string | number | Date, includeTime: boolean = false): string {
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Truncate a string if it exceeds the max length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  const element = document.createElement('div');
  element.textContent = html;
  return element.innerHTML;
}

/**
 * Validate an email address format
 * @param email - Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debounce a function call
 * @param func - Function to debounce
 * @param wait - Wait time in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>) {
    const context = this;
    
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Get a value from localStorage with type safety
 * @param key - Storage key
 * @param defaultValue - Default value if not found
 * @returns The stored value or default
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Save a value to localStorage
 * @param key - Storage key
 * @param value - Value to store
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Generate a random string ID
 * @param length - Length of the ID
 * @returns Random string ID
 */
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Check if the device is mobile
 * @returns Whether the device is mobile
 */
export function isMobileDevice(): boolean {
  return window.innerWidth <= 768;
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise resolving to success state
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
} 