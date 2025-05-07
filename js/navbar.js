// Mobile Menu Toggle
document.addEventListener("DOMContentLoaded", () => {
  // Add navbar-animations CSS file
  if (!document.querySelector('link[href*="navbar-animations.css"]')) {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'css/navbar-animations.css';
    document.head.appendChild(linkElement);
  }

  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenu = document.querySelector(".mobile-menu")

  if (mobileMenuToggle && mobileMenu) {
  mobileMenuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("active")
      mobileMenuToggle.classList.toggle("active")

    // Change icon based on menu state
    const icon = mobileMenuToggle.querySelector("i")
      if (icon) {
    if (mobileMenu.classList.contains("active")) {
      icon.classList.remove("fa-bars")
      icon.classList.add("fa-times")
    } else {
      icon.classList.remove("fa-times")
      icon.classList.add("fa-bars")
        }
    }
  })

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
        mobileMenu &&
      mobileMenu.classList.contains("active")
      ) {
        if (
          !mobileMenu.contains(event.target) &&
          !mobileMenuToggle.contains(event.target)
    ) {
      mobileMenu.classList.remove("active")
          mobileMenuToggle.classList.remove("active")
          
          // Reset icon
      const icon = mobileMenuToggle.querySelector("i")
          if (icon) {
      icon.classList.remove("fa-times")
      icon.classList.add("fa-bars")
          }
        }
    }
  })
  }

  // Handle dropdown menus on mobile
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle")

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function(e) {
      if (window.innerWidth <= 992) {
        e.preventDefault()
        const parent = this.parentElement
        const dropdown = parent.querySelector(".dropdown-menu")

        if (dropdown) {
          dropdown.classList.toggle("show")
          this.classList.toggle("active")
        }
      }
    })
  })

  // Handle notification click
  const notificationBtn = document.querySelector(".notifications-dropdown .dropdown-toggle")
  const notificationDropdown = document.querySelector(".notifications-dropdown .dropdown-menu")
  
  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      notificationDropdown.classList.toggle("show")
      notificationBtn.classList.toggle("active")
      
      // Mark notifications as read when dropdown is opened
      if (notificationDropdown.classList.contains("show")) {
        const unreadItems = notificationDropdown.querySelectorAll(".notification-item.unread")
        if (unreadItems.length > 0) {
          setTimeout(() => {
            unreadItems.forEach(item => {
              item.classList.remove("unread")
            })
            
            // Update badge count
            const badge = notificationBtn.querySelector(".badge")
            if (badge) {
              badge.textContent = "0"
              badge.style.display = "none"
            }
          }, 3000) // Mark as read after 3 seconds of being open
        }
      }
    })
    
    // Close when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove("show")
        notificationBtn.classList.remove("active")
      }
    })
    
    // Handle mark all as read button
    const markAllReadBtn = notificationDropdown.querySelector(".mark-all-read")
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", (e) => {
        e.preventDefault()
        const unreadItems = notificationDropdown.querySelectorAll(".notification-item.unread")
        unreadItems.forEach(item => {
          item.classList.remove("unread")
        })
        
        // Update badge count
        const badge = notificationBtn.querySelector(".badge")
        if (badge) {
          badge.textContent = "0"
          badge.style.display = "none"
        }
      })
    }
  }

  // Handle user dropdown click
  const userDropdownToggle = document.querySelector(".user-dropdown .dropdown-toggle")
  const userDropdown = document.querySelector(".user-dropdown .dropdown-menu")
  
  if (userDropdownToggle && userDropdown) {
    userDropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("show")
      userDropdownToggle.classList.toggle("active")
    })
    
    document.addEventListener("click", (e) => {
      if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("show")
        userDropdownToggle.classList.remove("active")
      }
    })
  }

  // Highlight active link
  const currentPath = window.location.pathname
  const filename = currentPath.split("/").pop() || 'index.html'
  
  const navLinks = document.querySelectorAll(".navbar-menu a, .mobile-menu a")
  navLinks.forEach((link) => {
    const href = link.getAttribute("href")
    if (href === filename || (filename === "" && href === "index.html")) {
      link.classList.add("active")
    } else if (href && filename.includes(href.split('.')[0]) && href !== "index.html") {
      // For pages like report-waste-details.html that should highlight report-waste.html link
      link.classList.add("active")
    }
  })
  
  // Implement scroll behavior for navbar
  const navbar = document.querySelector(".navbar")
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        navbar.classList.add("scrolled")
      } else {
        navbar.classList.remove("scrolled")
      }
    })
  }
  
  // Logout button functionality
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      
      try {
        // Check if supabase is loaded
        if (typeof supabase !== 'undefined') {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
        }
        
        // For frontend display, we'll redirect even if the logout API fails
        showToast("You have been logged out successfully!")
        setTimeout(() => {
          window.location.href = "login.html"
        }, 1000)
      } catch (error) {
        console.error("Error logging out:", error)
        showToast("Error logging out. Please try again.", "error")
      }
    })
  }
})

/**
 * Show toast notification
 * @param {string} message - The message to display
 * @param {string} type - The notification type (success, error, info)
 */
function showToast(message, type = "success") {
  let toast = document.getElementById("notification-toast")
  
  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement("div")
    toast.id = "notification-toast"
    toast.className = "toast"
    document.body.appendChild(toast)
  }
  
  // Set message and type
  toast.textContent = message
  toast.className = `toast ${type}`
  
  // Show the toast
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)
  
  // Hide the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    
    // Remove the element after transition
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// Navbar Module
import { supabase } from "./supabase.js"

export const navbar = {
  // Initialize navbar
  init() {
    this.setupAuthState()
    this.setupMobileMenu()
    this.setupUserMenu()
    this.setupNotifications()
    this.highlightActiveNavItem()
    this.setupScrollBehavior()
    this.fixBranding()
    this.ensureProfilePosition()
    this.setupSearchBox()
  },

  // Setup auth state
  async setupAuthState() {
    try {
      // Check if signed in
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      // Update UI based on auth state
      const authLinks = document.querySelectorAll(".auth-links")
      const userMenus = document.querySelectorAll(".user-menu, .user-dropdown")

      if (user) {
        // User is logged in
        authLinks.forEach((el) => (el.style.display = "none"))
        userMenus.forEach((el) => (el.style.display = "flex"))

        // Update user info
        this.updateUserInfo(user)

        // Check if user is admin
        const isAdmin = user.user_metadata?.role === "admin"
        const adminLinks = document.querySelectorAll(".admin-link")
        adminLinks.forEach((link) => {
          link.style.display = isAdmin ? "block" : "none"
        })
      } else {
        // User is not logged in
        authLinks.forEach((el) => (el.style.display = "flex"))
        userMenus.forEach((el) => (el.style.display = "none"))
      }
    } catch (error) {
      console.error("Error setting up auth state:", error)
    }
  },

  // Update user info
  updateUserInfo(user) {
    const userNames = document.querySelectorAll(".user-name")
    const userAvatars = document.querySelectorAll(".user-avatar")

    userNames.forEach((name) => {
      name.textContent = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    })

    userAvatars.forEach((avatar) => {
      avatar.src = user.user_metadata?.avatar_url || "img/avatar.jpg"
      // Make sure avatar has alt text
      if (!avatar.alt) {
        avatar.alt = "User profile"
      }
    })
  },

  // Fix any incorrect app name (EcoTrack should be TrashClick)
  fixBranding() {
    // Update any incorrect brand names
    const brandNames = document.querySelectorAll(".navbar-logo span, .brand-name, .footer-logo span")
    brandNames.forEach(el => {
      if (el.textContent.includes("EcoTrack")) {
        el.textContent = el.textContent.replace("EcoTrack", "TrashClick")
      }
    })
    
    // Update page titles if needed
    if (document.title.includes("EcoTrack")) {
      document.title = document.title.replace("EcoTrack", "TrashClick")
    }
    
    // Update meta tags if needed
    const metaTags = document.querySelectorAll('meta[name="application-name"], meta[property="og:site_name"]')
    metaTags.forEach(tag => {
      if (tag.content && tag.content.includes("EcoTrack")) {
        tag.content = tag.content.replace("EcoTrack", "TrashClick")
      }
    })
  },

  // Make sure profile is correctly positioned in the top right
  ensureProfilePosition() {
    const navbar = document.querySelector(".navbar")
    const navbarActions = document.querySelector(".navbar-actions")
    
    if (navbar && navbarActions) {
      // Make sure navbar-actions has appropriate styling
      navbarActions.style.display = "flex"
      navbarActions.style.alignItems = "center"
      navbarActions.style.marginLeft = "auto"
      
      // Make sure profile elements are in navbar-actions
      const userMenu = document.querySelector(".user-menu")
      if (userMenu && !navbarActions.contains(userMenu)) {
        navbarActions.appendChild(userMenu)
      }
    }
  },

  // Setup mobile menu
  setupMobileMenu() {
    const menuToggle = document.querySelector(".mobile-menu-toggle")
    const mobileMenu = document.querySelector(".mobile-menu")

    if (!menuToggle || !mobileMenu) return

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      mobileMenu.classList.toggle("active")
      menuToggle.classList.toggle("active")

      // Change icon based on menu state
      const icon = menuToggle.querySelector("i")
      if (mobileMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (mobileMenu.classList.contains("active") && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileMenu.classList.remove("active")
        menuToggle.classList.remove("active")
        
        const icon = menuToggle.querySelector("i")
        if (icon) {
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      }
    })
  },

  // Setup user menu
  setupUserMenu() {
    const userToggle = document.querySelector(".user-dropdown .dropdown-toggle")
    const userDropdown = document.querySelector(".user-dropdown .dropdown-menu")

    if (!userToggle || !userDropdown) return

    userToggle.addEventListener("click", (e) => {
        e.stopPropagation()
      userDropdown.classList.toggle("show")
      userToggle.classList.toggle("active")
    })
    
    document.addEventListener("click", (e) => {
      if (!userToggle.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("show")
        userToggle.classList.remove("active")
      }
    })
    
    // Handle logout
    const logoutBtn = document.getElementById("logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          // Show toast notification
          const toast = document.createElement("div")
          toast.className = "toast success"
          toast.textContent = "Logged out successfully"
          document.body.appendChild(toast)
          
          setTimeout(() => toast.classList.add("show"), 10)
          
          // Redirect to login page
          setTimeout(() => {
            window.location.href = "login.html"
          }, 1500)
        } catch (error) {
          console.error("Error during logout:", error)
          
          const toast = document.createElement("div")
          toast.className = "toast error"
          toast.textContent = "Failed to log out. Please try again."
          document.body.appendChild(toast)
          
          setTimeout(() => toast.classList.add("show"), 10)
          setTimeout(() => toast.classList.remove("show"), 3000)
        }
      })
    }
  },

  // Setup notifications
  setupNotifications() {
    const notificationToggle = document.querySelector(".notifications-dropdown .dropdown-toggle")
    const notificationDropdown = document.querySelector(".notifications-dropdown .dropdown-menu")

    if (!notificationToggle || !notificationDropdown) return

    notificationToggle.addEventListener("click", (e) => {
        e.stopPropagation()
      notificationDropdown.classList.toggle("show")
      notificationToggle.classList.toggle("active")
      
      // Mark as read if shown
      if (notificationDropdown.classList.contains("show")) {
        const unreadItems = notificationDropdown.querySelectorAll(".notification-item.unread")
        if (unreadItems.length > 0) {
          // Get notification IDs
          const notificationIds = Array.from(unreadItems).map(item => item.dataset.id).filter(Boolean)
          
          // Mark as read in UI
          setTimeout(() => {
            unreadItems.forEach(item => item.classList.remove("unread"))
            
            // Update badge count
            const badge = notificationToggle.querySelector(".badge")
            if (badge) {
              badge.textContent = "0"
              badge.style.display = "none"
            }
            
            // Mark as read in backend if IDs available
            if (notificationIds.length > 0) {
              this.markNotificationsAsRead(notificationIds)
            }
          }, 2000) // After 2 seconds of viewing
        }
      }
    })

    document.addEventListener("click", (e) => {
      if (!notificationToggle.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove("show")
        notificationToggle.classList.remove("active")
      }
    })
    
    // Mark all as read button
    const markAllBtn = notificationDropdown.querySelector(".mark-all-read")
    if (markAllBtn) {
      markAllBtn.addEventListener("click", () => {
        const unreadItems = notificationDropdown.querySelectorAll(".notification-item.unread")
        const notificationIds = Array.from(unreadItems).map(item => item.dataset.id).filter(Boolean)
        
        unreadItems.forEach(item => item.classList.remove("unread"))
        
        // Update badge count
        const badge = notificationToggle.querySelector(".badge")
        if (badge) {
          badge.textContent = "0"
          badge.style.display = "none"
        }
        
        // Mark as read in backend if IDs available
        if (notificationIds.length > 0) {
          this.markNotificationsAsRead(notificationIds)
        }
      })
    }
  },

  // Mark notifications as read in backend
  async markNotificationsAsRead(notificationIds) {
    try {
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) return
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)

      if (error) throw error

      console.log(`Marked ${notificationIds.length} notifications as read`)
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  },

  // Highlight active nav item
  highlightActiveNavItem() {
    const currentPath = window.location.pathname
    const pageName = currentPath.split("/").pop() || "index.html"
    
    // Find all navigation links
    const navLinks = document.querySelectorAll(".navbar-menu a, .mobile-menu-links a")
    navLinks.forEach(link => {
      const href = link.getAttribute("href")
      
      if (!href) return
      
      // Check if href matches current page or if current page is empty and href is index.html
      if (href === pageName || (pageName === "" && href === "index.html")) {
        link.classList.add("active")
      } 
      // Handle special cases like report-waste-details.html should highlight report-waste.html
      else if (href !== "index.html" && pageName.includes(href.split('.')[0])) {
        link.classList.add("active")
      } else {
        link.classList.remove("active")
      }
    })
  },

  // Setup scroll behavior
  setupScrollBehavior() {
    const navbar = document.querySelector(".navbar")
    if (!navbar) return

    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        navbar.classList.add("scrolled")
      } else {
        navbar.classList.remove("scrolled")
      }
    })
    
    // Initialize on page load
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled")
    }
  },
  
  // Setup search box functionality
  setupSearchBox() {
    const searchToggle = document.querySelector(".search-toggle")
    const searchBox = document.querySelector(".navbar-search")
    const searchInput = document.querySelector(".navbar-search input")
    
    if (!searchToggle || !searchBox || !searchInput) return
    
    searchToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      searchBox.classList.toggle("active")
      if (searchBox.classList.contains("active")) {
        searchInput.focus()
      }
    })
    
    document.addEventListener("click", (e) => {
      if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
        searchBox.classList.remove("active")
      }
    })
    
    // Search functionality
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim()
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`
        }
      }
    })
  }
}

// Initialize navbar when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  navbar.init()
})

// Export for use in other files
export default navbar

