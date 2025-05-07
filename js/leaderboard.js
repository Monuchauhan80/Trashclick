// Leaderboard System
import { supabaseClient } from "./supabase.js"
import { showNotification } from "./utils.js"
import { initializeTheme, toggleTheme } from "./theme.js"
import { animateSequence } from './animations.js'

const leaderboard = {
  // Cache for storing leaderboard data
  cachedData: null,
  activeFilter: "points", // Default filter
  activeTimeframe: "all-time", // Default timeframe
  currentPage: 1,
  isLoading: false,
  itemsPerPage: 20,

  // Initialize leaderboard
  async init() {
    try {
      console.log("Initializing leaderboard")
      
      // Set up filter tabs click events
      this.setupFilterTabs()
      
      // Set up timeframe selector
      this.setupTimeframeFilter()
      
      // Set up search functionality
      this.setupSearch()
      
      // Set up pagination
      this.setupPagination()
      
      // Load leaderboard data
      await this.loadAndRenderLeaderboard()

      // Load user's own rank if logged in
      await this.loadUserRank()
 
      // Initialize achievement showcase carousel
      this.initAchievementShowcase()
    } catch (error) {
      console.error("Error initializing leaderboard:", error)
      showNotification("Failed to initialize leaderboard. Please refresh the page.", "error")
    }
  },

  // Setup UI elements
  setupUI() {
    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle")
    if (themeToggle) {
      themeToggle.addEventListener("change", () => {
        toggleTheme()
      })
    }

    // User dropdown
    const userDropdown = document.getElementById("user-dropdown")
    if (userDropdown) {
      const dropdownToggle = userDropdown.querySelector(".user-dropdown-toggle")
      if (dropdownToggle) {
        dropdownToggle.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          userDropdown.querySelector(".user-dropdown-menu").classList.toggle("active")
        })
      }
    }

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      const dropdownMenus = document.querySelectorAll(".user-dropdown-menu")
      dropdownMenus.forEach((menu) => {
        menu.classList.remove("active")
      })
    })
  },

  // Setup filtering
  setupFiltering() {
    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn")
    filterButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        button.classList.add("active")

        // Get filter value
        this.activeFilter = button.dataset.filter

        // Render leaderboard with new filter
        this.renderLeaderboard()
      })
    })

    // Timeframe select
    const timeframeSelect = document.getElementById("timeframe-select")
    if (timeframeSelect) {
      timeframeSelect.addEventListener("change", async () => {
        this.activeTimeframe = timeframeSelect.value
        this.currentPage = 1
        await this.loadAndRenderLeaderboard()
      })
    }
  },

  // Load and render leaderboard data
  async loadAndRenderLeaderboard() {
    if (this.isLoading) return
    
    this.isLoading = true
    this.showLoadingState()
    
    try {
      // Get time filter based on selected timeframe
      const timeFilter = this.getTimeFilter()
      
      // Calculate offset for pagination
      const offset = (this.currentPage - 1) * this.itemsPerPage
      
      // Fetch data from Supabase
      let query = supabaseClient
        .from("profiles")
        .select("id, full_name, avatar_url, points, reports_count, recycling_count, donations_count, badges")
        .order(this.activeFilter, { ascending: false })
      
      // Add time filter if not "all-time"
      if (timeFilter) {
        query = query.gte("created_at", timeFilter)
      }
      
      // Add pagination
      query = query.range(offset, offset + this.itemsPerPage - 1)
      
      const { data, error } = await query

      if (error) throw error

      // Check if we have results
      if (data && data.length > 0) {
        // Get total count for pagination
        const totalCount = data[0].total_count || 0
        
        // Update pagination UI
        this.updatePaginationUI(totalCount)
        
        // Calculate rank with pagination offset
        this.cachedData = data.map((user, index) => ({
          ...user,
          rank: offset + index + 1
        }))
        
        // Render the leaderboard
        this.renderLeaderboard()
      } else {
        // No results
        document.querySelector("#leaderboard-table tbody").innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-4">
              <div class="empty-state">
                <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                <p>No results found for the selected filters</p>
              </div>
            </td>
          </tr>
        `
        
        // Update pagination for zero results
        this.updatePaginationUI(0)
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error)
      showNotification("Failed to load leaderboard data", "error")
      
      // Show error state
      document.querySelector("#leaderboard-table tbody").innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <div class="error-state">
              <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
              <p>Something went wrong while loading the leaderboard</p>
              <button class="btn btn-sm btn-primary mt-2" id="retry-load">Try Again</button>
            </div>
          </td>
        </tr>
      `
      
      // Add retry button event
      document.getElementById("retry-load")?.addEventListener("click", () => {
        this.loadAndRenderLeaderboard()
      })
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  },

  // Create a top user card
  createTopUserCard(user, rank) {
    const userCard = document.createElement("div")
    userCard.className = `top-user rank-${rank}`

    // Get medal icon based on rank
    let medalIcon = ""
    switch (rank) {
      case 1:
        medalIcon = '<i class="fas fa-medal gold"></i>'
        break
      case 2:
        medalIcon = '<i class="fas fa-medal silver"></i>'
        break
      case 3:
        medalIcon = '<i class="fas fa-medal bronze"></i>'
        break
    }

    // Get user avatar or default
    const avatarUrl = user.avatar_url || "img/default-avatar.jpg"

    // Get stat value based on active filter
    let statValue
    let statLabel
    switch (this.activeFilter) {
      case "points":
        statValue = user.points || 0
        statLabel = "Points"
        break
      case "reports":
        statValue = user.reports_count || 0
        statLabel = "Reports"
        break
      case "recycling":
        statValue = user.recycling_count || 0
        statLabel = "Recycled"
        break
      case "donations":
        statValue = user.donations_count || 0
        statLabel = "Donations"
        break
    }

    userCard.innerHTML = `
            <div class="rank-badge">${rank}</div>
            <div class="medal">${medalIcon}</div>
            <div class="user-avatar">
                <img src="${avatarUrl}" alt="${user.full_name || "User"}">
            </div>
            <div class="user-info">
                <h3>${user.full_name || "User"}</h3>
                <div class="user-badges">
                    ${this.renderBadges(user.badges || [])}
                </div>
            </div>
            <div class="user-stat">
                <span class="stat-value">${statValue}</span>
                <span class="stat-label">${statLabel}</span>
            </div>
        `

    return userCard
  },

  // Create a leaderboard item
  createLeaderboardItem(user, rank) {
    const item = document.createElement("div")
    item.className = "leaderboard-item"

    // Add rank class for top 3
    if (rank <= 3) {
      item.classList.add(`rank-${rank}`)
    }

    // Get user avatar or default
    const avatarUrl = user.avatar_url || "img/default-avatar.jpg"

    item.innerHTML = `
            <div class="leaderboard-rank">${rank}</div>
                <div class="leaderboard-user">
                <img src="${avatarUrl}" alt="${user.full_name || "User"}" class="user-avatar">
                    <div class="user-info">
                    <h3>${user.full_name || "User"}</h3>
                        <div class="user-badges">
                            ${this.renderBadges(user.badges || [])}
                        </div>
                    </div>
                </div>
                <div class="leaderboard-stats">
                <div class="stat ${this.activeFilter === "points" ? "active" : ""}">
                    <span class="stat-value">${user.points || 0}</span>
                        <span class="stat-label">Points</span>
                    </div>
                <div class="stat ${this.activeFilter === "reports" ? "active" : ""}">
                    <span class="stat-value">${user.reports_count || 0}</span>
                        <span class="stat-label">Reports</span>
                    </div>
                <div class="stat ${this.activeFilter === "recycling" ? "active" : ""}">
                    <span class="stat-value">${user.recycling_count || 0}</span>
                        <span class="stat-label">Recycled</span>
                    </div>
                <div class="stat ${this.activeFilter === "donations" ? "active" : ""}">
                    <span class="stat-value">${user.donations_count || 0}</span>
                    <span class="stat-label">Donations</span>
                </div>
                </div>
            `

    return item
  },

  // Render user badges
  renderBadges(badges) {
    if (!badges || badges.length === 0) return ""

    // Limit to 3 badges
    const displayBadges = badges.slice(0, 3)
    const remaining = badges.length - displayBadges.length

    let badgesHtml = displayBadges
      .map(
        (badge) => `
            <div class="badge" title="${badge.name}">
                <i class="fas fa-${badge.icon}"></i>
            </div>
        `,
      )
      .join("")

    // Add badge count if more badges exist
    if (remaining > 0) {
      badgesHtml += `<div class="badge-more">+${remaining}</div>`
    }

    return badgesHtml
  },

  // Set up real-time updates for leaderboard
  setupRealTimeUpdates() {
    // Set up subscription to leaderboard changes
    const subscription = supabaseClient
      .channel("public:profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        async (payload) => {
          console.log("Leaderboard update:", payload)

          // Reload leaderboard data
          await this.loadAndRenderLeaderboard()

          // Show update notification
          showNotification("Leaderboard updated with new data", "info")
        },
      )
      .subscribe()

    // Store subscription for later cleanup if needed
    this.subscription = subscription

    // Refresh data periodically as fallback
    this.refreshInterval = setInterval(async () => {
      await this.loadAndRenderLeaderboard()
    }, 60000) // Refresh every 60 seconds
  },

  // Load current user's rank and display it
  async loadUserRank() {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (!user) return

      // Get user rank based on active filter
      const rank = await this.getUserRank(user.id)
      if (rank === null) return

      // Update UI
      const userRankElement = document.getElementById("user-rank")
      if (userRankElement) {
        userRankElement.textContent = `Your Rank: #${rank}`
        userRankElement.style.display = "block"
      }
    } catch (error) {
      console.error("Error getting user rank:", error)
    }
  },

  // Get user rank
  async getUserRank(userId) {
    try {
      if (!this.cachedData) return null

      // Sort data based on active filter
      const sortedData = [...this.cachedData]
      switch (this.activeFilter) {
        case "points":
          sortedData.sort((a, b) => (b.points || 0) - (a.points || 0))
          break
        case "reports":
          sortedData.sort((a, b) => (b.reports_count || 0) - (a.reports_count || 0))
          break
        case "recycling":
          sortedData.sort((a, b) => (b.recycling_count || 0) - (a.recycling_count || 0))
          break
        case "donations":
          sortedData.sort((a, b) => (b.donations_count || 0) - (a.donations_count || 0))
          break
      }

      // Find user in sorted data
      const userIndex = sortedData.findIndex((user) => user.id === userId)

      return userIndex !== -1 ? userIndex + 1 : null
    } catch (error) {
      console.error("Error getting user rank:", error)
      return null
    }
  },

  // Update user points
  async updateUserPoints(userId, points) {
    try {
      // Get current user data
      const { data: userData, error: userError } = await supabaseClient
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single()

      if (userError) throw userError

      // Update points
      const newPoints = (userData.points || 0) + points
      const { data, error } = await supabaseClient.from("profiles").update({ points: newPoints }).eq("id", userId)

      if (error) throw error

      // Check for new badges
      await this.checkForNewBadges(userId)

      return { success: true, points: newPoints }
    } catch (error) {
      console.error("Error updating user points:", error)
      return { success: false, error: error.message }
    }
  },

  // Update user stats
  async updateUserStat(userId, statType, value) {
    try {
      // Get current user data
      const { data: userData, error: userError } = await supabaseClient
        .from("profiles")
        .select(`${statType}_count`)
        .eq("id", userId)
        .single()

      if (userError) throw userError

      // Update stat
      const newValue = (userData[`${statType}_count`] || 0) + value
      const updateData = { [`${statType}_count`]: newValue }

      const { data, error } = await supabaseClient.from("profiles").update(updateData).eq("id", userId)

      if (error) throw error

      // Check for new badges
      await this.checkForNewBadges(userId)

      return { success: true, value: newValue }
    } catch (error) {
      console.error(`Error updating user ${statType}:`, error)
      return { success: false, error: error.message }
    }
  },

  // Check for new badges
  async checkForNewBadges(userId) {
    try {
      // Get user data
      const { data: userData, error: userError } = await supabaseClient
        .from("profiles")
        .select("points, reports_count, recycling_count, donations_count, badges")
        .eq("id", userId)
        .single()

      if (userError) throw userError

      // Get all available badges
      const { data: allBadges, error: badgesError } = await supabaseClient.from("badges").select("*")

      if (badgesError) throw badgesError

      // User's current badges
      const userBadges = userData.badges || []
      const userBadgeIds = userBadges.map((badge) => badge.id)

      // Check each badge
      const newBadges = []
      allBadges.forEach((badge) => {
        // Skip if user already has this badge
        if (userBadgeIds.includes(badge.id)) return

        // Check if user meets requirements
        let meetsRequirements = false

        switch (badge.type) {
          case "points":
            meetsRequirements = userData.points >= badge.requirement
            break
          case "reports":
            meetsRequirements = userData.reports_count >= badge.requirement
            break
          case "recycling":
            meetsRequirements = userData.recycling_count >= badge.requirement
            break
          case "donations":
            meetsRequirements = userData.donations_count >= badge.requirement
            break
        }

        if (meetsRequirements) {
          newBadges.push(badge)
        }
      })

      // Award new badges
      if (newBadges.length > 0) {
        const updatedBadges = [...userBadges, ...newBadges]

        await supabaseClient.from("profiles").update({ badges: updatedBadges }).eq("id", userId)

        // Show notification for new badges
        newBadges.forEach((badge) => {
          this.showBadgeNotification(badge)
        })
      }

      return newBadges
    } catch (error) {
      console.error("Error checking for new badges:", error)
      return []
    }
  },

  // Show badge notification
  showBadgeNotification(badge) {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = "badge-notification"
    notification.innerHTML = `
            <div class="badge-icon">
                <i class="fas fa-${badge.icon}"></i>
            </div>
            <div class="badge-info">
                <h3>New Badge Unlocked!</h3>
                <p>${badge.name}</p>
                <p>${badge.description}</p>
            </div>
        `

    // Add to document
    document.body.appendChild(notification)

    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add("fade-out")
      setTimeout(() => {
        notification.remove()
      }, 500)
    }, 5000)
  },

  // Initialize achievement showcase carousel
  initAchievementShowcase() {
    const showcase = document.querySelector('.achievement-showcase')
    
    if (!showcase) return
    
    // Find carousel elements
    const carouselTrack = showcase.querySelector('.showcase-items')
    const prevButton = showcase.querySelector('.showcase-prev')
    const nextButton = showcase.querySelector('.showcase-next')
    const indicators = showcase.querySelectorAll('.showcase-indicator')
    
    if (!carouselTrack || !prevButton || !nextButton) return
    
    // Variables to track state
    let currentIndex = 0
    const itemCount = carouselTrack.children.length
    const itemWidth = showcase.offsetWidth
    let autoplayInterval
    
    // Function to update carousel position
    const updateCarousel = (index) => {
      // Ensure index is within bounds
      currentIndex = (index + itemCount) % itemCount
      
      // Update track position
      carouselTrack.style.transform = `translateX(${-currentIndex * 100}%)`
      
      // Update indicators
      if (indicators && indicators.length) {
        indicators.forEach((indicator, i) => {
          if (i === currentIndex) {
            indicator.classList.add('active')
          } else {
            indicator.classList.remove('active')
          }
        })
      }
    }
    
    // Set up click handlers for buttons
    prevButton.addEventListener('click', () => {
      updateCarousel(currentIndex - 1)
      this.resetAutoplay()
    })
    
    nextButton.addEventListener('click', () => {
      updateCarousel(currentIndex + 1)
      this.resetAutoplay()
    })
    
    // Set up indicator clicks
    if (indicators && indicators.length) {
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          updateCarousel(index)
          this.resetAutoplay()
        })
      })
    }
    
    // Set up autoplay
    const startAutoplay = () => {
      autoplayInterval = setInterval(() => {
        updateCarousel(currentIndex + 1)
      }, 5000)
    }
    
    const resetAutoplay = () => {
      clearInterval(autoplayInterval)
      startAutoplay()
    }
    
    // Pause autoplay on hover
    showcase.addEventListener('mouseenter', () => {
      clearInterval(autoplayInterval)
    })
    
    showcase.addEventListener('mouseleave', () => {
      startAutoplay()
    })
    
    // Initialize carousel
    updateCarousel(0)
    startAutoplay()
  },

  // Setup pagination controls
  setupPagination: function() {
    const prevButton = document.getElementById("pagination-prev")
    const nextButton = document.getElementById("pagination-next")
    
    if (prevButton) {
      prevButton.addEventListener("click", async () => {
        if (this.currentPage > 1 && !this.isLoading) {
          this.currentPage--
          await this.loadAndRenderLeaderboard()
          // Scroll to top of leaderboard after page change
          document.querySelector(".leaderboard-table").scrollIntoView({ behavior: "smooth" })
        }
      })
    }
    
    if (nextButton) {
      nextButton.addEventListener("click", async () => {
        if (!this.isLoading) {
          this.currentPage++
          await this.loadAndRenderLeaderboard()
          // Scroll to top of leaderboard after page change
          document.querySelector(".leaderboard-table").scrollIntoView({ behavior: "smooth" })
        }
      })
    }
  },
  
  // Update pagination UI
  updatePaginationUI: function(totalItems) {
    const paginationInfo = document.getElementById("pagination-info")
    const prevButton = document.getElementById("pagination-prev")
    const nextButton = document.getElementById("pagination-next")
    
    const totalPages = Math.ceil(totalItems / this.itemsPerPage)
    
    if (paginationInfo) {
      paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`
    }
    
    if (prevButton) {
      prevButton.disabled = this.currentPage <= 1
    }
    
    if (nextButton) {
      nextButton.disabled = this.currentPage >= totalPages || totalItems <= this.itemsPerPage
    }
    
    // Show/hide pagination based on total items
    const paginationControls = document.querySelector(".pagination-controls")
    if (paginationControls) {
      paginationControls.style.display = totalItems > this.itemsPerPage ? "flex" : "none"
    }
  },

  // Set up search functionality
  setupSearch() {
    const searchInput = document.getElementById("leaderboard-search")
    if (searchInput) {
      searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim()
        await this.performSearch(query)
      })
    }
  },

  // Perform search
  async performSearch(query) {
    if (!query || query.trim() === "" || this.isLoading) return
    
    this.isLoading = true
    this.showLoadingState()
    
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, avatar_url, points, reports_count, recycling_count, donations_count, badges")
        .ilike("full_name", `%${query}%`)
        .order(this.activeFilter, { ascending: false })
        .limit(this.itemsPerPage)
      
      if (error) throw error
      
      // Reset pagination when searching
      this.currentPage = 1
      
      if (data && data.length > 0) {
        // Update with search results
        this.cachedData = data.map((user, index) => ({
          ...user,
          rank: index + 1,
          isSearchResult: true
        }))
        
        // Render the leaderboard
        this.renderLeaderboard()
        
        // Update search info
        const searchInfo = document.querySelector(".search-info")
        if (searchInfo) {
          searchInfo.textContent = `Found ${data.length} results for "${query}"`
          searchInfo.style.display = "block"
        }
        
        // Hide pagination for search results
        this.updatePaginationUI(0)
      } else {
        // No search results
        document.querySelector("#leaderboard-table tbody").innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-4">
              <div class="empty-state">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p>No users found matching "${query}"</p>
              </div>
            </td>
          </tr>
        `
        
        // Show search info for no results
        const searchInfo = document.querySelector(".search-info")
        if (searchInfo) {
          searchInfo.textContent = `No results found for "${query}"`
          searchInfo.style.display = "block"
        }
        
        // Hide pagination for empty search results
        this.updatePaginationUI(0)
      }
    } catch (error) {
      console.error("Error searching users:", error)
      showNotification("Failed to search users", "error")
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  },

  // Clear search
  async clearSearch() {
    const searchInput = document.getElementById("leaderboard-search")
    if (searchInput) {
      searchInput.value = ""
    }
    
    // Hide search info
    const searchInfo = document.querySelector(".search-info")
    if (searchInfo) {
      searchInfo.style.display = "none"
    }
    
    // Reset pagination and reload data
    this.currentPage = 1
    await this.loadAndRenderLeaderboard()
  },

  // Set up timeframe filter
  setupTimeframeFilter() {
    const timeframeSelect = document.getElementById("leaderboard-timeframe")
    if (timeframeSelect) {
      timeframeSelect.addEventListener("change", async () => {
        this.activeTimeframe = timeframeSelect.value
        this.currentPage = 1
        await this.loadAndRenderLeaderboard()
      })
    }
  },

  // Get time filter based on selected timeframe
  getTimeFilter() {
    const now = new Date()
    let timeFilter = null

    switch (this.activeTimeframe) {
      case "week":
        // Last 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        timeFilter = weekAgo.toISOString()
        break
      case "month":
        // Last 30 days
        const monthAgo = new Date(now)
        monthAgo.setDate(now.getDate() - 30)
        timeFilter = monthAgo.toISOString()
        break
      case "year":
        // Last 365 days
        const yearAgo = new Date(now)
        yearAgo.setDate(now.getDate() - 365)
        timeFilter = yearAgo.toISOString()
        break
      case "all-time":
      default:
        // No date filter
        timeFilter = null
    }

    return timeFilter
  },

  // Show loading state
  showLoadingState() {
    const leaderboardElement = document.getElementById("leaderboard-list")
    if (leaderboardElement) {
      leaderboardElement.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>'
    }
  },

  // Hide loading state
  hideLoadingState() {
    const leaderboardElement = document.getElementById("leaderboard-list")
    if (leaderboardElement) {
      leaderboardElement.innerHTML = ""
    }
  },
}

// Initialize leaderboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  leaderboard.init()
})

// Export for use in other files
window.leaderboard = leaderboard

