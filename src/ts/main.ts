/**
 * Main entry point for the TrashClick application
 */
import { initializeTheme } from './theme';
import { initAuth } from './auth';
import { showNotification } from './utils';
import { initReportForm, loadReportsOnMap } from './report';
import { initReportsMap } from './reports-data';

// App initialization state
let isAppInitialized = false;

/**
 * Initialize the application
 */
async function initApp(): Promise<void> {
  if (isAppInitialized) return;
  
  try {
    // Initialize theme
    initializeTheme();
    
    // Initialize auth
    await initAuth();
    
    // Initialize mobile menu
    setupMobileMenu();
    
    // Set up smooth scroll behavior
    setupSmoothScroll();
    
    // Initialize dropdowns
    setupDropdowns();
    
    // Initialize notification dismissal
    setupNotificationDismissal();
    
    // Initialize form validation
    setupFormValidation();
    
    // Create scroll-to-top button
    createScrollToTopButton();
    
    // Initialize waste report form if on report page
    initWasteReportingFeatures();
    
    // Check for outdated browsers
    checkBrowserCompatibility();
    
    // Set app as initialized
    isAppInitialized = true;
    
    console.log('TrashClick app initialized');
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('There was an error initializing the application. Please refresh the page.', 'error');
  }
}

/**
 * Initialize waste reporting features based on current page
 */
function initWasteReportingFeatures(): void {
  // Check if we're on the report page
  if (document.getElementById('wasteReportForm')) {
    void initReportForm().catch((error: Error) => {
      console.error('Error initializing waste report form:', error);
      showNotification('Failed to initialize waste reporting. Please refresh the page.', 'error');
    });
  }
  
  // Check if we're on the map page with waste map view
  const mapViewContainer = document.getElementById('wasteMapView');
  if (mapViewContainer) {
    void loadReportsOnMap('wasteMapView');
    
    // Initialize the reports dashboard
    void initReportsMap().catch((error: Error) => {
      console.error('Error initializing waste reports map:', error);
      showNotification('Failed to load waste map data. Please refresh the page.', 'error');
    });
  }
}

/**
 * Set up mobile menu functionality
 */
function setupMobileMenu(): void {
  const menuToggle = document.querySelector('.mobile-menu-toggle') as HTMLButtonElement | null;
  const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement | null;
  const menuBackdrop = document.querySelector('.menu-backdrop') as HTMLElement | null;
  
  if (!menuToggle || !mobileMenu) return;
  
  // Create backdrop if it doesn't exist
  let backdrop = menuBackdrop;
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);
  }
  
  // Toggle menu when button is clicked
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  // Close menu when backdrop is clicked
  backdrop.addEventListener('click', closeMenu);
  
  // Close menu when escape key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });
  
  // Helper functions
  function openMenu(): void {
    menuToggle?.setAttribute('aria-expanded', 'true');
    mobileMenu?.classList.add('active');
    backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Change icon to close
    const icon = menuToggle?.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-times';
    }
  }
  
  function closeMenu(): void {
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('active');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
    
    // Change icon back to bars
    const icon = menuToggle?.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-bars';
    }
  }
  
  // Handle submenu toggles
  const submenuToggles = mobileMenu?.querySelectorAll('.submenu-toggle');
  submenuToggles?.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      const parent = (toggle as HTMLElement).closest('.has-submenu');
      if (parent) {
        parent.classList.toggle('active');
        
        // Toggle icon
        const icon = (toggle as HTMLElement).querySelector('i');
        if (icon) {
          if (parent.classList.contains('active')) {
            icon.className = 'fas fa-chevron-up';
          } else {
            icon.className = 'fas fa-chevron-down';
          }
        }
      }
    });
  });
}

/**
 * Set up dropdown functionality
 */
function setupDropdowns(): void {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle') as HTMLElement | null;
    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement | null;
    
    if (!toggle || !menu) return;
    
    // For touch devices
    if ('ontouchstart' in window) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Close other dropdowns
        dropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove('active');
          }
        });
        
        // Toggle this dropdown
        dropdown.classList.toggle('active');
      });
    }
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.classList.remove('active');
      }
    });
  });
}

/**
 * Set up smooth scroll behavior for anchor links
 */
function setupSmoothScroll(): void {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function(this: HTMLAnchorElement, e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (!targetId) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 70; // Height of fixed header
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Set up functionality to dismiss notifications
 */
function setupNotificationDismissal(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    if (target.matches('.notification-close, .notification-close *')) {
      const notification = target.closest('.notification');
      if (notification) {
        notification.classList.add('removing');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }
  });
}

/**
 * Set up form validation
 */
function setupFormValidation(): void {
  const forms = document.querySelectorAll('form.needs-validation');
  
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!(form as HTMLFormElement).checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Create a scroll-to-top button
 */
function createScrollToTopButton(): void {
  // Check if button already exists
  if (document.querySelector('.scroll-to-top-btn')) return;
  
  // Create button
  const button = document.createElement('button');
  button.className = 'scroll-to-top-btn';
  button.setAttribute('aria-label', 'Scroll to top');
  button.innerHTML = '<i class="fas fa-arrow-up"></i>';
  
  // Add to document
  document.body.appendChild(button);
  
  // Show/hide based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      button.classList.add('visible');
    } else {
      button.classList.remove('visible');
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

/**
 * Check for outdated browsers and show notification if needed
 */
function checkBrowserCompatibility(): void {
  // Simple browser check for IE
  const isIE = /*@cc_on!@*/false || !!(document as any).documentMode;
  
  if (isIE) {
    showNotification(
      'You are using an outdated browser. Please upgrade to a modern browser for the best experience.',
      'warning',
      10000
    );
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for potential use in other modules
export { initApp }; 