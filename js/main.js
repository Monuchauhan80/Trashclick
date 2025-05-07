/**
 * Main JavaScript file for TrashClick
 * Contains common functionality used across the application
 */

import { initializeTheme } from './theme.js';
import { showNotification } from './utils.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('TrashClick application initialized');
    
    // Initialize theme
    initializeTheme();
    
    // Setup common UI elements
    setupMobileMenu();
    setupUserDropdown();
    setupNotifications();
    setupScrollBehavior();
    setupFormValidation();
    
    // Check for browser compatibility
    checkBrowserCompatibility();
});

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    
    if (!mobileMenuToggle || !mobileMenu) return;
    
    // Open mobile menu
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        mobileMenuBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
    
    // Close mobile menu
    const closeMenu = () => {
        mobileMenu.classList.remove('open');
        mobileMenuBackdrop.classList.remove('open');
        document.body.style.overflow = ''; // Enable scrolling
    };
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMenu);
    }
    
    if (mobileMenuBackdrop) {
        mobileMenuBackdrop.addEventListener('click', closeMenu);
    }
    
    // Handle logout on mobile
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Implement logout functionality
            // This should match the desktop logout functionality
            logoutUser();
        });
    }
    
    // Close menu when selecting a menu item
    const menuItems = mobileMenu.querySelectorAll('a');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Don't close for toggle buttons or logout
            if (!item.classList.contains('toggle') && item.id !== 'mobile-logout-btn') {
                closeMenu();
            }
        });
    });
}

/**
 * Setup user dropdown functionality
 */
function setupUserDropdown() {
    const dropdownToggle = document.querySelector('.profile-dropdown-toggle');
    const dropdown = document.querySelector('.profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (dropdownToggle && dropdown) {
        // Toggle dropdown
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        // Close when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
        
        // Stop propagation on dropdown click
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

/**
 * Setup notifications functionality
 */
function setupNotifications() {
    const notificationsBtn = document.querySelector('.notifications-btn');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            // Implement notification panel
            showNotification('Notifications feature coming soon!', 'info');
        });
    }
}

/**
 * Setup smooth scroll behavior
 */
function setupScrollBehavior() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll-to-top button if page is scrollable
    const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
    );
    const viewportHeight = window.innerHeight;
    
    if (pageHeight > viewportHeight * 1.5) {
        createScrollToTopButton();
    }
}

/**
 * Create a scroll-to-top button
 */
function createScrollToTopButton() {
    // Create button if it doesn't exist
    if (!document.getElementById('scroll-to-top')) {
        const button = document.createElement('button');
        button.id = 'scroll-to-top';
        button.className = 'scroll-to-top-btn';
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.title = 'Scroll to top';
        document.body.appendChild(button);
        
        // Initially hide the button
        button.style.display = 'none';
        
        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight / 2) {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        });
        
        // Scroll to top when clicked
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const isIE = /MSIE|Trident/.test(window.navigator.userAgent);
    
    if (isIE) {
        showNotification(
            'You are using an outdated browser. Some features may not work correctly. For the best experience, please use a modern browser.',
            'warning',
            10000
        );
    }
}

/**
 * Basic form validation setup
 */
function setupFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            // Get required fields
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    
                    // Add error styling
                    field.classList.add('error');
                    
                    // Create or update error message
                    let errorMessage = field.parentNode.querySelector('.error-message');
                    if (!errorMessage) {
                        errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        field.parentNode.appendChild(errorMessage);
                    }
                    errorMessage.textContent = `${field.name || 'This field'} is required`;
                } else {
                    // Remove error styling
                    field.classList.remove('error');
                    
                    // Remove error message
                    const errorMessage = field.parentNode.querySelector('.error-message');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showNotification('Please fill out all required fields.', 'error');
            }
        });
    });
}

/**
 * Log out user
 */
function logoutUser() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        // Implement logout functionality
        // This would typically involve clearing auth tokens and redirecting
        // For demo purposes, we'll just redirect to login page
        showNotification('Logging out...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Export common functions
export {
    setupMobileMenu,
    logoutUser,
    showNotification
}; 