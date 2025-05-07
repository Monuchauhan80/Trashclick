// Rewards System Module
import { supabaseClient, db } from './supabase.js';
import { auth } from './auth.js';
import { showNotification } from './utils.js';
import { formatDate } from './utils.js';

export const rewards = {
  // Initialize rewards system
  async init() {
    try {
      // Check if user is logged in
      const user = await auth.getCurrentUser();
      if (!user) {
        document.querySelector(".login-required").style.display = "flex";
        document.querySelector(".rewards-content").style.display = "none";
        return;
      }

      // Show rewards content
      document.querySelector(".login-required").style.display = "none";
      document.querySelector(".rewards-content").style.display = "block";

      // Load user data
      await this.loadUserData(user.id);

      // Load badges
      await this.loadBadges(user.id);

      // Load progress to next badge
      await this.loadBadgeProgress(user.id);

      // Load points history
      await this.loadPointsHistory(user.id);

      // Set up badge filters
      this.setupBadgeFilters();
    } catch (error) {
      console.error("Error initializing rewards:", error);
      showNotification("Failed to load rewards data", "error");
    }
  },

  // Load user data
  async loadUserData(userId) {
    try {
      // Get user profile
      const profile = await db.getUserProfile(userId);
      if (!profile) throw new Error("User profile not found");

      // Get user rank
      const rank = await this.getUserRank(userId);

      // Update UI
      document.getElementById("total-points").textContent = profile.points || 0;
      document.getElementById("user-rank").textContent = `#${rank}`;
      document.getElementById("badges-count").textContent = profile.badges?.length || 0;
      document.getElementById("reports-count").textContent = profile.reports_count || 0;
    } catch (error) {
      console.error("Error loading user data:", error);
      throw error;
    }
  },

  // Load badges
  async loadBadges(userId) {
    try {
      // Get user badges
      const userBadges = await this.getUserBadges(userId);

      // Get all available badges
      const allBadges = await this.getAvailableBadges();

      // Filter earned badges
      const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);
      const earnedBadges = allBadges.filter((badge) => earnedBadgeIds.includes(badge.id));

      // Filter badges to earn
      const badgesToEarn = allBadges.filter((badge) => !earnedBadgeIds.includes(badge.id));

      // Render earned badges
      this.renderBadges(earnedBadges, "badges-grid", true);

      // Render badges to earn
      this.renderBadges(badgesToEarn, "available-badges-grid", false);
    } catch (error) {
      console.error("Error loading badges:", error);
      throw error;
    }
  },

  // Render badges
  renderBadges(badges, containerId, earned) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear container
    container.innerHTML = "";

    if (badges.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-medal"></i>
                    <p>${earned ? "You haven't earned any badges yet." : "No more badges to earn!"}</p>
            </div>
        `;
      return;
    }

    // Create badge cards
    badges.forEach((badge) => {
      const badgeCard = document.createElement("div");
      badgeCard.className = `badge-card ${!earned ? "locked" : ""}`;
      badgeCard.dataset.category = badge.category;

      // Get badge icon
      const iconClass = this.getBadgeIconClass(badge.category);

      badgeCard.innerHTML = `
                <div class="badge-icon ${iconClass} ${!earned ? "locked" : ""}">
                    <i class="${this.getBadgeIcon(badge.category)}"></i>
                </div>
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
                ${
                  !earned
                    ? `<div class="badge-requirement">${badge.points_required} points required</div>`
                    : `<div class="badge-date">Earned on ${formatDate(badge.earned_at || new Date(), "medium")}</div>`
                }
            `;

      container.appendChild(badgeCard);
    });
  },

  // Get badge icon class
  getBadgeIconClass(category) {
    switch (category) {
      case "reports":
        return "reports";
      case "recycling":
        return "recycling";
      case "donations":
        return "donations";
      case "community":
        return "community";
      default:
        return "";
    }
  },

  // Get badge icon
  getBadgeIcon(category) {
    switch (category) {
      case "reports":
        return "fas fa-map-marker-alt";
      case "recycling":
        return "fas fa-recycle";
      case "donations":
        return "fas fa-hands-helping";
      case "community":
        return "fas fa-users";
      default:
        return "fas fa-medal";
    }
  },

  // Load badge progress
  async loadBadgeProgress(userId) {
    try {
      const progress = await this.getProgressToNextBadge(userId);

      if (!progress) {
        // No more badges to earn
        document.getElementById("next-badge-content").innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>Congratulations! You've earned all available badges.</p>
                    </div>
                `;
        return;
      }

      // Update next badge info
      document.getElementById("next-badge-name").textContent = progress.nextBadge.name;
      document.getElementById("next-badge-description").textContent = progress.nextBadge.description;
      document.getElementById("badge-progress").style.width = `${progress.progress}%`;
      document.getElementById("points-needed").textContent = `${progress.pointsNeeded} points needed`;

      // Update badge icon
      const iconElement = document.getElementById("next-badge-icon");
      iconElement.className = `next-badge-icon ${this.getBadgeIconClass(progress.nextBadge.category)}`;
      iconElement.innerHTML = `<i class="${this.getBadgeIcon(progress.nextBadge.category)}"></i>`;
    } catch (error) {
      console.error("Error loading badge progress:", error);
      throw error;
    }
  },

  // Load points history
  async loadPointsHistory(userId) {
    try {
      const history = await this.getRewardsHistory(userId);
      const tableBody = document.getElementById("history-table-body");

      if (!tableBody) return;

      // Clear table body
      tableBody.innerHTML = "";

      if (history.length === 0) {
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>No points history yet.</p>
                        </td>
                    </tr>
                `;
        return;
      }

      // Create history rows
      history.forEach((item) => {
        const row = document.createElement("tr");

        row.innerHTML = `
                    <td>${formatDate(item.created_at, "medium")}</td>
                    <td>${item.details}</td>
                    <td class="points-cell ${item.points > 0 ? "positive" : ""}">${item.points > 0 ? "+" : ""}${item.points}</td>
                `;

        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading points history:", error);
      throw error;
    }
  },

  // Setup badge filters
  setupBadgeFilters() {
    const filterButtons = document.querySelectorAll(".badge-filter-btn");
    const badgeCards = document.querySelectorAll(".badge-card");

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"));

        // Add active class to clicked button
        button.classList.add("active");

        // Get filter value
        const filter = button.dataset.filter;

        // Filter badge cards
        badgeCards.forEach((card) => {
          if (filter === "all" || card.dataset.category === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  },

  // Award points to user
  async awardPoints(userId, action) {
    const { data, error } = await supabaseClient.rpc("award_points", {
      user_id: userId,
      action: action,
    });

    if (error) throw error;
    return data;
  },

  // Check and award badges
  async checkBadges(userId) {
    const { data, error } = await supabaseClient.rpc("check_badges", {
      user_id: userId,
    });

    if (error) throw error;
    return data;
  },

  // Get user's badges
  async getUserBadges(userId) {
    const { data, error } = await supabaseClient
      .from("user_badges")
      .select(`
                *,
                badges (
                    id,
                    name,
                    description,
                    icon_url,
                    points_required,
                    category
                )
            `)
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },

  // Get user's points
  async getUserPoints(userId) {
    const { data, error } = await supabaseClient.from("profiles").select("points").eq("id", userId).single();

    if (error) throw error;
    return data.points;
  },

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select(`
                id,
                full_name,
                avatar_url,
                points,
                reports_count,
                badges
            `)
      .order("points", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get available badges
  async getAvailableBadges() {
    const { data, error } = await supabaseClient
      .from("badges")
      .select("*")
      .order("points_required", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get user's rank
  async getUserRank(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, points")
      .order("points", { ascending: false });

    if (error) throw error;

    const userIndex = data.findIndex((user) => user.id === userId);
    return userIndex !== -1 ? userIndex + 1 : data.length + 1;
  },

  // Get user's progress to next badge
  async getProgressToNextBadge(userId) {
    try {
      const userPoints = await this.getUserPoints(userId);
      const availableBadges = await this.getAvailableBadges();
      const userBadges = await this.getUserBadges(userId);

      const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);
      const nextBadge = availableBadges.find(
        (badge) => !earnedBadgeIds.includes(badge.id) && badge.points_required > userPoints,
      );

      if (!nextBadge) return null;

      // Find the highest badge the user has earned
      let previousBadge = null;
      const earnedBadges = availableBadges.filter((badge) => earnedBadgeIds.includes(badge.id));
      if (earnedBadges.length > 0) {
        previousBadge = earnedBadges.reduce((prev, current) =>
          prev.points_required > current.points_required ? prev : current,
        );
      }

      const previousPoints = previousBadge ? previousBadge.points_required : 0;
      const pointsNeeded = nextBadge.points_required - userPoints;
      const pointsRange = nextBadge.points_required - previousPoints;
      const progress = Math.min(100, Math.max(0, ((userPoints - previousPoints) / pointsRange) * 100));

      return {
        nextBadge,
        pointsNeeded,
        progress,
      };
    } catch (error) {
      console.error("Error getting progress to next badge:", error);
      return null;
    }
  },

  // Get user's achievements
  async getUserAchievements(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select(`
                points,
                reports_count,
                badges
            `)
      .eq("id", userId)
      .single();

    if (error) throw error;

    const achievements = {
      totalPoints: data.points || 0,
      reportsSubmitted: data.reports_count || 0,
      badgesEarned: data.badges?.length || 0,
      rank: await this.getUserRank(userId),
    };

    return achievements;
  },

  // Get rewards history
  async getRewardsHistory(userId) {
    const { data, error } = await supabaseClient
      .from("rewards_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Initialize rewards system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  rewards.init();
});

// Export for use in other files
export default rewards;

// Define badge criteria and checking functions
const badgeCriteria = {
  'welcome': {
    check: (user, profile) => true, // Auto-granted when profile is created
    points: 10,
    title: "Welcome to TrashClick!"
  },
  'first-report': {
    check: (user, profile) => profile.reports_count >= 1,
    points: 25,
    title: "First Waste Report Submitted!"
  },
  'super-reporter': {
    check: (user, profile) => profile.reports_count >= 10,
    points: 100,
    title: "Super Reporter Achievement!"
  },
  'recycler': {
    check: (user, profile) => profile.recycling_count >= 1,
    points: 30,
    title: "Recycling Champion!"
  },
  'donor': {
    check: (user, profile) => profile.food_donations >= 1,
    points: 50,
    title: "Food Donor Extraordinaire!"
  },
  'eco-warrior': {
    check: (user, profile) => profile.points >= 500,
    points: 75,
    title: "Eco Warrior Achievement Unlocked!"
  },
  'community-builder': {
    check: (user, profile) => profile.referrals >= 1,
    points: 40,
    title: "Community Builder Badge Earned!"
  },
  'photogenic': {
    check: (user, profile) => profile.photo_reports >= 1,
    points: 25,
    title: "Photogenic Reporter Badge!"
  },
  'clean-streak': {
    check: (user, profile) => profile.streak >= 7,
    points: 60,
    title: "7-Day Clean Streak Achieved!"
  }
};

// Check for new badges
export async function checkForNewBadges(userId) {
  try {
    if (!userId) {
      const user = await auth.getCurrentUser();
      if (!user) return;
      userId = user.id;
    }

    // Get user profile
    const profile = await db.getUserProfile(userId);
    if (!profile) return;

    // Get current badges
    const currentBadges = profile.badges || [];
    const newBadges = [];

    // Check for each badge
    for (const [badgeId, criteria] of Object.entries(badgeCriteria)) {
      if (!currentBadges.includes(badgeId) && criteria.check(null, profile)) {
        newBadges.push(badgeId);
      }
    }

    if (newBadges.length === 0) return;

    // Award new badges
    const updatedBadges = [...currentBadges, ...newBadges];
    let additionalPoints = 0;

    // Calculate points from new badges
    newBadges.forEach(badgeId => {
      additionalPoints += badgeCriteria[badgeId].points || 0;
      // Show notification for each new badge
      showNotification(badgeCriteria[badgeId].title, 'success');
    });

    // Update user profile with new badges and points
    await db.updateUserProfile(userId, {
      badges: updatedBadges,
      points: (profile.points || 0) + additionalPoints
    });

    // Send notification to user about new badges
    for (const badgeId of newBadges) {
      await db.createNotification(userId, {
        type: 'badge',
        title: 'New Badge Earned!',
        message: badgeCriteria[badgeId].title,
        data: { badgeId }
      });
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking for badges:', error);
    return [];
  }
}

// Award points to a user
export async function awardPoints(userId, points, reason) {
  try {
    if (!userId || points <= 0) return false;

    // Get current profile
    const profile = await db.getUserProfile(userId);
    if (!profile) return false;

    // Update points
    const currentPoints = profile.points || 0;
    const newTotal = currentPoints + points;
    
    await db.updateUserProfile(userId, {
      points: newTotal
    });

    // Create notification
    await db.createNotification(userId, {
      type: 'points',
      title: 'Points Awarded!',
      message: `You earned ${points} points for ${reason}`,
      data: { points, reason }
    });

    // Check for new badges after points update
    await checkForNewBadges(userId);

    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
}

// Get user level based on points
export function getUserLevel(points) {
  const levels = [
    { name: "Eco Novice", icon: "seedling", description: "Just starting your eco journey", points: 0 },
    { name: "Eco Explorer", icon: "leaf", description: "Exploring more eco-friendly actions", points: 500 },
    { name: "Eco Champion", icon: "tree", description: "Actively contributing to sustainability", points: 1000 },
    { name: "Eco Warrior", icon: "shield-alt", description: "A dedicated protector of the environment", points: 2500 },
    { name: "Eco Master", icon: "crown", description: "Master of environmental stewardship", points: 5000 },
    { name: "Eco Legend", icon: "star", description: "Your contributions are legendary", points: 10000 }
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].points) {
      return levels[i];
    }
  }
  
  return levels[0];
}

// Calculate environmental impact statistics
export function calculateEnvironmentalImpact(profile) {
  const points = profile.points || 0;
  const reports = profile.reports_count || 0;
  const recycled = profile.recycling_count || 0;
  
  return {
    treesSaved: Math.floor(points / 200),
    co2Reduced: Math.round((points * 0.5) * 10) / 10, // kg
    waterSaved: Math.round(points * 2.5), // liters
    energySaved: Math.round(points * 0.75) // kWh
  };
}

// Initialize leaderboard real-time subscription
export function initLeaderboardRealtime(callback) {
  return supabaseClient
    .channel('public:profiles')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'profiles'
    }, (payload) => {
      // When any profile is updated, refresh the leaderboard
      if (typeof callback === 'function') {
        callback();
      }
    })
    .subscribe();
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check if user is logged in
    const user = await auth.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Check for any new badges
    await checkForNewBadges(user.id);
    
    // Initialize real-time leaderboard updates
    const leaderboardSubscription = initLeaderboardRealtime(() => {
      // Reload leaderboard when data changes
      if (typeof loadLeaderboard === 'function') {
        loadLeaderboard();
      }
    });

    // Clean up subscription when leaving the page
    window.addEventListener('beforeunload', () => {
      supabaseClient.removeChannel(leaderboardSubscription);
    });
  } catch (error) {
    console.error('Error initializing rewards page:', error);
    showNotification('Error loading rewards data', 'error');
  }
});

