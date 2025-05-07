// Admin Dashboard JavaScript
import { supabaseClient } from "./supabase.js"
import { showNotification } from "./utils.js"
import { initializeTheme, toggleTheme } from "./theme.js"
import { createActivityChart, createWasteDistributionChart } from "./charts.js"

// Main admin class
const AdminDashboard = {
  // Initialize the dashboard
  async init() {
    try {
      // Check if user is admin
      const isAdmin = await this.checkAdminStatus()
      if (!isAdmin) {
        window.location.href = "../index.html"
        return
      }

      // Cache DOM elements
      this.cacheDOM()

      // Set up event listeners
      this.setupEventListeners()

      // Initialize theme
      initializeTheme()

      // Load dashboard data
      await this.loadDashboardData()

      // Hide loading indicator
      this.hideLoading()
    } catch (error) {
      console.error("Error initializing admin dashboard:", error)
      showNotification("Failed to initialize dashboard", "error")
      this.hideLoading()
    }
  },

  // Check if user has admin privileges
  async checkAdminStatus() {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) return false

      // Check if user has admin role
      return user.user_metadata?.role === "admin"
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  },

  // Cache DOM elements
  cacheDOM() {
    // Layout elements
    this.adminLayout = document.querySelector(".admin-layout")
    this.sidebarToggle = document.getElementById("sidebar-toggle")

    // Theme toggle
    this.themeToggle = document.getElementById("theme-toggle")

    // User dropdown
    this.userDropdown = document.querySelector(".user-dropdown")
    this.logoutBtn = document.getElementById("logout-btn")

    // Stats elements
    this.totalUsersEl = document.getElementById("total-users")
    this.wasteReportsEl = document.getElementById("waste-reports")
    this.recycledWasteEl = document.getElementById("recycled-waste")
    this.foodDonationsEl = document.getElementById("food-donations")

    // Chart elements
    this.activityChart = document.getElementById("activity-chart")
    this.wasteDistributionChart = document.getElementById("waste-distribution-chart")
    this.activityTimeframe = document.getElementById("activity-timeframe")
    this.wasteDistributionType = document.getElementById("waste-distribution-type")

    // Recent activity
    this.recentActivityList = document.getElementById("recent-activity-list")

    // Loading indicator
    this.loadingIndicator = document.getElementById("loading-indicator")
  },

  // Set up event listeners
  setupEventListeners() {
    // Sidebar toggle
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener("click", () => {
        this.adminLayout.classList.toggle("collapsed")
      })
    }

    // Theme toggle
    if (this.themeToggle) {
      this.themeToggle.addEventListener("change", () => {
        toggleTheme()
      })
    }

    // User dropdown toggle
    if (this.userDropdown) {
      const dropdownToggle = this.userDropdown.querySelector(".user-dropdown-toggle")
      const dropdownMenu = this.userDropdown.querySelector(".user-dropdown-menu")

      dropdownToggle.addEventListener("click", (e) => {
        e.preventDefault()
        dropdownMenu.classList.toggle("active")
      })

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!this.userDropdown.contains(e.target)) {
          dropdownMenu.classList.remove("active")
        }
      })
    }

    // Logout button
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        await this.logout()
      })
    }

    // Activity timeframe change
    if (this.activityTimeframe) {
      this.activityTimeframe.addEventListener("change", () => {
        this.loadActivityChart(this.activityTimeframe.value)
      })
    }

    // Waste distribution type change
    if (this.wasteDistributionType) {
      this.wasteDistributionType.addEventListener("change", () => {
        this.loadWasteDistributionChart(this.wasteDistributionType.value)
      })
    }

    // Mark all notifications as read
    const markAllReadBtn = document.querySelector(".mark-all-read")
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", () => {
        const unreadItems = document.querySelectorAll(".notification-item.unread")
        unreadItems.forEach((item) => {
          item.classList.remove("unread")
        })

        const badge = document.querySelector(".notification-badge")
        if (badge) {
          badge.textContent = "0"
        }
      })
    }
  },

  // Load dashboard data
  async loadDashboardData() {
    this.showLoading()

    try {
      // Load data in parallel
      await Promise.all([
        this.loadStats(),
        this.loadActivityChart("month"),
        this.loadWasteDistributionChart("type"),
        this.loadRecentActivity(),
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      showNotification("Failed to load dashboard data", "error")
    } finally {
      this.hideLoading()
    }
  },

  // Load stats
  async loadStats() {
    try {
      // Get total users
      const { count: userCount, error: userError } = await supabaseClient
        .from("profiles")
        .select("*", { count: "exact", head: true })

      if (userError) throw userError

      // Get waste reports
      const { count: reportCount, error: reportError } = await supabaseClient
        .from("waste_reports")
        .select("*", { count: "exact", head: true })

      if (reportError) throw reportError

      // Get recycled waste
      const { data: recycledData, error: recycledError } = await supabaseClient.from("waste_sales").select("quantity")

      if (recycledError) throw recycledError

      const totalRecycled = recycledData.reduce((total, item) => total + (item.quantity || 0), 0)

      // Get food donations
      const { count: donationCount, error: donationError } = await supabaseClient
        .from("food_donations")
        .select("*", { count: "exact", head: true })

      if (donationError) throw donationError

      // Update UI
      if (this.totalUsersEl) this.totalUsersEl.textContent = userCount.toLocaleString()
      if (this.wasteReportsEl) this.wasteReportsEl.textContent = reportCount.toLocaleString()
      if (this.recycledWasteEl) this.recycledWasteEl.textContent = `${totalRecycled.toLocaleString()} kg`
      if (this.foodDonationsEl) this.foodDonationsEl.textContent = donationCount.toLocaleString()
    } catch (error) {
      console.error("Error loading stats:", error)
      throw error
    }
  },

  // Load activity chart
  async loadActivityChart(timeframe) {
    try {
      if (!this.activityChart) return

      let dateFilter
      const now = new Date()

      switch (timeframe) {
        case "week":
          // Last 7 days
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          dateFilter = weekAgo.toISOString()
          break
        case "month":
          // Last 30 days
          const monthAgo = new Date(now)
          monthAgo.setDate(now.getDate() - 30)
          dateFilter = monthAgo.toISOString()
          break
        case "year":
          // Last 365 days
          const yearAgo = new Date(now)
          yearAgo.setDate(now.getDate() - 365)
          dateFilter = yearAgo.toISOString()
          break
        default:
          // Default to month
          const defaultMonthAgo = new Date(now)
          defaultMonthAgo.setDate(now.getDate() - 30)
          dateFilter = defaultMonthAgo.toISOString()
      }

      // Get activity data
      const [reportsData, salesData, donationsData] = await Promise.all([
        supabaseClient.from("waste_reports").select("created_at").gte("created_at", dateFilter).order("created_at"),

        supabaseClient.from("waste_sales").select("created_at").gte("created_at", dateFilter).order("created_at"),

        supabaseClient.from("food_donations").select("created_at").gte("created_at", dateFilter).order("created_at"),
      ])

      // Process data for chart
      createActivityChart(
        this.activityChart,
        reportsData.data || [],
        salesData.data || [],
        donationsData.data || [],
        timeframe,
      )
    } catch (error) {
      console.error("Error loading activity chart:", error)
      throw error
    }
  },

  // Load waste distribution chart
  async loadWasteDistributionChart(type) {
    try {
      if (!this.wasteDistributionChart) return

      let data
      let labels

      if (type === "type") {
        // Get waste distribution by type
        const { data: wasteData, error } = await supabaseClient.from("waste_reports").select("waste_type, quantity")

        if (error) throw error

        // Aggregate by waste type
        const wasteTypes = {}
        wasteData.forEach((item) => {
          if (!wasteTypes[item.waste_type]) {
            wasteTypes[item.waste_type] = 0
          }
          wasteTypes[item.waste_type] += item.quantity || 0
        })

        labels = Object.keys(wasteTypes)
        data = Object.values(wasteTypes)
      } else {
        // Get waste distribution by location
        const { data: locationData, error } = await supabaseClient.from("waste_reports").select("location, quantity")

        if (error) throw error

        // Aggregate by location
        const locations = {}
        locationData.forEach((item) => {
          if (!locations[item.location]) {
            locations[item.location] = 0
          }
          locations[item.location] += item.quantity || 0
        })

        // Get top 5 locations
        const sortedLocations = Object.entries(locations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)

        labels = sortedLocations.map((item) => item[0])
        data = sortedLocations.map((item) => item[1])
      }

      // Create chart
      createWasteDistributionChart(this.wasteDistributionChart, labels, data, type)
    } catch (error) {
      console.error("Error loading waste distribution chart:", error)
      throw error
    }
  },

  // Load recent activity
  async loadRecentActivity() {
    try {
      if (!this.recentActivityList) return

      // Get recent activities
      const { data: activities, error } = await supabaseClient
        .from("activities")
        .select(`
                    id,
                    activity_type,
                    details,
                    created_at,
                    profiles (
                        id,
                        full_name
                    )
                `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error

      // Clear list
      this.recentActivityList.innerHTML = ""

      // Add activities to list
      if (activities.length === 0) {
        this.recentActivityList.innerHTML = '<div class="empty-state">No recent activity</div>'
        return
      }

      activities.forEach((activity) => {
        const activityEl = document.createElement("div")
        activityEl.className = "activity-item"

        // Set icon based on activity type
        const iconClass = this.getActivityIconClass(activity.activity_type)

        // Format date
        const date = new Date(activity.created_at)
        const timeAgo = this.getTimeAgo(date)

        activityEl.innerHTML = `
                    <div class="activity-icon ${iconClass}">
                        <i class="${this.getActivityIcon(activity.activity_type)}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${this.getActivityTitle(activity.activity_type)}</h4>
                        <p>${activity.details}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `

        this.recentActivityList.appendChild(activityEl)
      })
    } catch (error) {
      console.error("Error loading recent activity:", error)
      throw error
    }
  },

  // Get activity icon class based on type
  getActivityIconClass(type) {
    switch (type) {
      case "waste_report":
        return "report"
      case "waste_sale":
        return "recycle"
      case "food_donation":
        return "donation"
      case "user_registration":
        return "user"
      case "query":
        return "query"
      default:
        return ""
    }
  },

  // Get activity icon based on type
  getActivityIcon(type) {
    switch (type) {
      case "waste_report":
        return "fas fa-map-marker-alt"
      case "waste_sale":
        return "fas fa-exchange-alt"
      case "food_donation":
        return "fas fa-hands-helping"
      case "user_registration":
        return "fas fa-user-plus"
      case "query":
        return "fas fa-question-circle"
      default:
        return "fas fa-info-circle"
    }
  },

  // Get activity title based on type
  getActivityTitle(type) {
    switch (type) {
      case "waste_report":
        return "New Waste Report"
      case "waste_sale":
        return "Recycling Transaction"
      case "food_donation":
        return "Food Donation"
      case "user_registration":
        return "New User Registration"
      case "query":
        return "New Query"
      default:
        return "Activity"
    }
  },

  // Get time ago string
  getTimeAgo(date) {
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // Seconds

    if (diff < 60) {
      return `${diff} seconds ago`
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else if (diff < 2592000) {
      const days = Math.floor(diff / 86400)
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else if (diff < 31536000) {
      const months = Math.floor(diff / 2592000)
      return `${months} month${months > 1 ? "s" : ""} ago`
    } else {
      const years = Math.floor(diff / 31536000)
      return `${years} year${years > 1 ? "s" : ""} ago`
    }
  },

  // Logout function
  async logout() {
    try {
      const { error } = await supabaseClient.auth.signOut()

      if (error) throw error

      window.location.href = "../index.html"
    } catch (error) {
      console.error("Error logging out:", error)
      showNotification("Failed to log out", "error")
    }
  },

  // Show loading indicator
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.add("visible")
    }
  },

  // Hide loading indicator
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.classList.remove("visible")
    }
  },
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  AdminDashboard.init()
})

export default AdminDashboard

