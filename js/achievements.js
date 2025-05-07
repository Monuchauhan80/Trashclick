// Achievements module for TrashClick
import { supabase } from './supabase.js';
import { showNotification } from './utils.js';
import { animateSequence } from './animations.js';

// Define achievement types and requirements
const ACHIEVEMENT_TYPES = {
  // Report-based achievements
  REPORTS: [
    { id: 'first_report', name: 'First Report', description: 'Report your first waste location', requirement: 1, icon: 'trash-alt' },
    { id: 'apprentice_reporter', name: 'Apprentice Reporter', description: 'Report 5 waste locations', requirement: 5, icon: 'clipboard-list' },
    { id: 'waste_scout', name: 'Waste Scout', description: 'Report 25 waste locations', requirement: 25, icon: 'binoculars' },
    { id: 'master_reporter', name: 'Master Reporter', description: 'Report 100 waste locations', requirement: 100, icon: 'certificate' },
    { id: 'waste_detective', name: 'Waste Detective', description: 'Report 500 waste locations', requirement: 500, icon: 'search' }
  ],
  
  // Collection-based achievements
  COLLECTION: [
    { id: 'first_collection', name: 'First Collection', description: 'Collect your first kg of waste', requirement: 1, icon: 'hands' },
    { id: 'waste_collector', name: 'Waste Collector', description: 'Collect 10kg of waste', requirement: 10, icon: 'recycle' },
    { id: 'cleanup_specialist', name: 'Cleanup Specialist', description: 'Collect 50kg of waste', requirement: 50, icon: 'broom' },
    { id: 'environment_protector', name: 'Environment Protector', description: 'Collect 100kg of waste', requirement: 100, icon: 'leaf' },
    { id: 'cleanup_champion', name: 'Cleanup Champion', description: 'Collect 500kg of waste', requirement: 500, icon: 'award' }
  ],
  
  // Event-based achievements
  EVENTS: [
    { id: 'first_event', name: 'First Event', description: 'Participate in your first cleanup event', requirement: 1, icon: 'calendar-check' },
    { id: 'event_regular', name: 'Event Regular', description: 'Participate in 5 cleanup events', requirement: 5, icon: 'users' },
    { id: 'community_leader', name: 'Community Leader', description: 'Participate in 10 cleanup events', requirement: 10, icon: 'user-friends' },
    { id: 'event_organizer', name: 'Event Organizer', description: 'Organize your first cleanup event', requirement: 1, icon: 'calendar-plus', special: true },
    { id: 'movement_builder', name: 'Movement Builder', description: 'Organize 5 cleanup events', requirement: 5, icon: 'people-carry', special: true }
  ],
  
  // Streak-based achievements
  STREAKS: [
    { id: 'week_streak', name: 'Week Streak', description: 'Report waste for 7 consecutive days', requirement: 7, icon: 'calendar-day' },
    { id: 'month_streak', name: 'Month Streak', description: 'Report waste for 30 consecutive days', requirement: 30, icon: 'calendar-alt' },
    { id: 'quarter_streak', name: 'Quarter Streak', description: 'Report waste for 90 consecutive days', requirement: 90, icon: 'calendar-star' }
  ],
  
  // Special achievements
  SPECIAL: [
    { id: 'first_verification', name: 'Verified Reporter', description: 'Get your first report verified', requirement: 1, icon: 'check-circle' },
    { id: 'social_sharer', name: 'Social Sharer', description: 'Share your first report on social media', requirement: 1, icon: 'share-alt' },
    { id: 'feedback_provider', name: 'Feedback Provider', description: 'Provide feedback on the platform', requirement: 1, icon: 'comment' },
    { id: 'area_cleaner', name: 'Area Cleaner', description: 'Clean up an entire area', requirement: 1, icon: 'map-marked-alt', special: true },
    { id: 'ambassador', name: 'TrashClick Ambassador', description: 'Invite 10 friends to join the platform', requirement: 10, icon: 'user-plus' }
  ]
};

// Flattened array of all achievements for easy lookup
const ALL_ACHIEVEMENTS = [
  ...ACHIEVEMENT_TYPES.REPORTS,
  ...ACHIEVEMENT_TYPES.COLLECTION,
  ...ACHIEVEMENT_TYPES.EVENTS,
  ...ACHIEVEMENT_TYPES.STREAKS,
  ...ACHIEVEMENT_TYPES.SPECIAL
];

/**
 * Initialize achievements system
 */
function initAchievements() {
  console.log('Achievements module initialized');
  
  // Check for new achievements when page loads if user is logged in
  const currentUser = supabase.auth.getUser();
  if (currentUser) {
    checkForNewAchievements();
  }
  
  // Set up achievement modals and UI elements
  setupAchievementModals();
}

/**
 * Check for new achievements based on user stats
 */
async function checkForNewAchievements() {
  try {
    const currentUser = supabase.auth.getUser();
    if (!currentUser) return;
    
    // Get user stats and current achievements
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, reports_count, waste_collected, events_participated, badges, current_streak')
      .eq('id', currentUser.id)
      .single();
    
    if (userError) throw userError;
    
    // Current user badges
    const currentBadges = userData.badges || [];
    
    // New achievements earned
    const newAchievements = [];
    
    // Check reports-based achievements
    checkAchievementCategory(ACHIEVEMENT_TYPES.REPORTS, userData.reports_count, currentBadges, newAchievements);
    
    // Check collection-based achievements
    checkAchievementCategory(ACHIEVEMENT_TYPES.COLLECTION, userData.waste_collected, currentBadges, newAchievements);
    
    // Check event-based achievements
    checkAchievementCategory(ACHIEVEMENT_TYPES.EVENTS, userData.events_participated, currentBadges, newAchievements);
    
    // Check streak-based achievements
    checkAchievementCategory(ACHIEVEMENT_TYPES.STREAKS, userData.current_streak, currentBadges, newAchievements);
    
    // If new achievements earned, update user and show notification
    if (newAchievements.length > 0) {
      // Update user's badges in database
      const updatedBadges = [...currentBadges, ...newAchievements.map(a => a.id)];
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ badges: updatedBadges })
        .eq('id', currentUser.id);
      
      if (updateError) throw updateError;
      
      // Show achievement notification
      showAchievementNotification(newAchievements);
    }
  } catch (error) {
    console.error('Error checking for achievements:', error);
  }
}

/**
 * Check if user has earned achievements in a category
 * @param {Array} achievementCategory - Category of achievements to check
 * @param {number} userValue - User's value for this category
 * @param {Array} currentBadges - Current user badges
 * @param {Array} newAchievements - Array to fill with new achievements
 */
function checkAchievementCategory(achievementCategory, userValue, currentBadges, newAchievements) {
  for (const achievement of achievementCategory) {
    // Skip if already earned
    if (currentBadges.includes(achievement.id)) continue;
    
    // Check if requirement is met
    if (userValue >= achievement.requirement) {
      newAchievements.push(achievement);
    }
  }
}

/**
 * Show notification for new achievements
 * @param {Array} achievements - Newly earned achievements
 */
function showAchievementNotification(achievements) {
  if (!achievements || achievements.length === 0) return;
  
  // If only one achievement, show simple notification
  if (achievements.length === 1) {
    const achievement = achievements[0];
    showNotification(
      `<strong>Achievement Unlocked!</strong><br>${achievement.name}`,
      'achievement',
      6000
    );
    return;
  }
  
  // For multiple achievements, show achievement modal
  openAchievementModal(achievements);
}

/**
 * Setup achievement modals
 */
function setupAchievementModals() {
  // Add event listeners for achievement modal buttons
  document.addEventListener('click', (e) => {
    // Open achievement details modal
    if (e.target.matches('.view-achievements-btn') || e.target.closest('.view-achievements-btn')) {
      e.preventDefault();
      openAchievementsPage();
    }
    
    // Close modal
    if (e.target.matches('.achievement-modal .close-btn') || e.target.closest('.achievement-modal .close-btn')) {
      e.preventDefault();
      closeAchievementModal();
    }
  });
}

/**
 * Open achievement modal for new achievements
 * @param {Array} achievements - Newly earned achievements
 */
function openAchievementModal(achievements) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('achievement-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'achievement-modal';
    modal.className = 'achievement-modal';
    document.body.appendChild(modal);
  }
  
  // Generate HTML for achievements
  let achievementsHtml = '';
  achievements.forEach(achievement => {
    achievementsHtml += `
      <div class="achievement-item">
        <div class="achievement-icon">
          <i class="fas fa-${achievement.icon}"></i>
        </div>
        <div class="achievement-details">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
        </div>
      </div>
    `;
  });
  
  // Set modal content
  modal.innerHTML = `
    <div class="achievement-modal-content">
      <div class="achievement-modal-header">
        <h3><i class="fas fa-trophy"></i> Achievements Unlocked!</h3>
        <button class="close-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="achievement-modal-body">
        <div class="achievement-list">
          ${achievementsHtml}
        </div>
      </div>
      <div class="achievement-modal-footer">
        <button class="btn btn-primary view-achievements-btn">View All Achievements</button>
      </div>
    </div>
  `;
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('open');
    
    // Animate achievement items
    const items = modal.querySelectorAll('.achievement-item');
    animateSequence(items, 'fade-in-up', 200);
  }, 300);
}

/**
 * Close achievement modal
 */
function closeAchievementModal() {
  const modal = document.getElementById('achievement-modal');
  if (modal) {
    modal.classList.remove('open');
    
    // Remove modal after animation completes
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Open achievements page
 */
function openAchievementsPage() {
  window.location.href = 'achievements.html';
}

/**
 * Get achievement by ID
 * @param {string} id - Achievement ID
 * @returns {Object} Achievement object
 */
function getAchievementById(id) {
  return ALL_ACHIEVEMENTS.find(achievement => achievement.id === id);
}

/**
 * Get user achievements
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User achievements
 */
async function getUserAchievements(userId) {
  try {
    // Get user badges
    const { data, error } = await supabase
      .from('users')
      .select('badges')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // Return empty array if no badges
    if (!data.badges) return [];
    
    // Convert badge IDs to achievement objects
    return data.badges.map(badgeId => getAchievementById(badgeId)).filter(Boolean);
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
}

/**
 * Get user progress towards achievements
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User achievement progress
 */
async function getUserAchievementProgress(userId) {
  try {
    // Get user stats
    const { data, error } = await supabase
      .from('users')
      .select('reports_count, waste_collected, events_participated, current_streak, badges')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    const progress = {
      reports: calculateCategoryProgress(ACHIEVEMENT_TYPES.REPORTS, data.reports_count, data.badges),
      collection: calculateCategoryProgress(ACHIEVEMENT_TYPES.COLLECTION, data.waste_collected, data.badges),
      events: calculateCategoryProgress(ACHIEVEMENT_TYPES.EVENTS, data.events_participated, data.badges),
      streaks: calculateCategoryProgress(ACHIEVEMENT_TYPES.STREAKS, data.current_streak, data.badges),
      special: calculateSpecialProgress(ACHIEVEMENT_TYPES.SPECIAL, data.badges)
    };
    
    return progress;
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return null;
  }
}

/**
 * Calculate progress for an achievement category
 * @param {Array} category - Achievement category
 * @param {number} value - User value
 * @param {Array} badges - User badges
 * @returns {Array} Progress for each achievement in category
 */
function calculateCategoryProgress(category, value, badges) {
  return category.map(achievement => {
    const earned = badges && badges.includes(achievement.id);
    const progress = Math.min(value / achievement.requirement, 1);
    
    return {
      ...achievement,
      earned,
      progress,
      value
    };
  });
}

/**
 * Calculate progress for special achievements
 * @param {Array} category - Special achievement category
 * @param {Array} badges - User badges
 * @returns {Array} Progress for special achievements
 */
function calculateSpecialProgress(category, badges) {
  return category.map(achievement => {
    const earned = badges && badges.includes(achievement.id);
    
    return {
      ...achievement,
      earned,
      progress: earned ? 1 : 0,
      value: earned ? achievement.requirement : 0
    };
  });
}

/**
 * Render user achievements on profile page
 * @param {string} userId - User ID
 * @param {Element} container - Container element
 */
async function renderUserAchievements(userId, container) {
  if (!container) return;
  
  try {
    // Get user achievements
    const achievements = await getUserAchievements(userId);
    
    // Get achievement progress
    const progress = await getUserAchievementProgress(userId);
    
    // If no achievements, show empty state
    if (!achievements || achievements.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>No achievements yet. Start reporting waste to earn your first badge!</p>
        </div>
      `;
      return;
    }
    
    // Create badges grid
    let badgesHtml = '';
    achievements.forEach(achievement => {
      badgesHtml += `
        <div class="achievement-badge" title="${achievement.name}: ${achievement.description}">
          <div class="badge-icon">
            <i class="fas fa-${achievement.icon}"></i>
          </div>
          <div class="badge-name">${achievement.name}</div>
        </div>
      `;
    });
    
    // Create progress sections
    let progressHtml = '';
    
    // Only show progress if we have it
    if (progress) {
      // Helper function to create progress bar
      const createProgressBar = (achievement) => {
        const progressPercent = Math.round(achievement.progress * 100);
        const status = achievement.earned ? 'complete' : 'in-progress';
        
        return `
          <div class="achievement-progress-item ${status}">
            <div class="achievement-info">
              <div class="achievement-icon">
                <i class="fas fa-${achievement.icon}"></i>
              </div>
              <div class="achievement-details">
                <h5>${achievement.name}</h5>
                <p>${achievement.description}</p>
              </div>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${progressPercent}%"></div>
              <div class="progress-text">
                ${achievement.value} / ${achievement.requirement}
                ${achievement.earned ? '<i class="fas fa-check-circle"></i>' : ''}
              </div>
            </div>
          </div>
        `;
      };
      
      // Create progress sections for each category
      if (progress.reports && progress.reports.length) {
        progressHtml += `
          <div class="progress-section">
            <h4><i class="fas fa-clipboard-list"></i> Reporting Achievements</h4>
            <div class="achievement-progress-list">
              ${progress.reports.map(createProgressBar).join('')}
            </div>
          </div>
        `;
      }
      
      if (progress.collection && progress.collection.length) {
        progressHtml += `
          <div class="progress-section">
            <h4><i class="fas fa-recycle"></i> Collection Achievements</h4>
            <div class="achievement-progress-list">
              ${progress.collection.map(createProgressBar).join('')}
            </div>
          </div>
        `;
      }
      
      if (progress.events && progress.events.length) {
        progressHtml += `
          <div class="progress-section">
            <h4><i class="fas fa-calendar-check"></i> Event Achievements</h4>
            <div class="achievement-progress-list">
              ${progress.events.map(createProgressBar).join('')}
            </div>
          </div>
        `;
      }
      
      if (progress.streaks && progress.streaks.length) {
        progressHtml += `
          <div class="progress-section">
            <h4><i class="fas fa-calendar-day"></i> Streak Achievements</h4>
            <div class="achievement-progress-list">
              ${progress.streaks.map(createProgressBar).join('')}
            </div>
          </div>
        `;
      }
    }
    
    // Set HTML content
    container.innerHTML = `
      <div class="achievements-summary">
        <div class="earned-count">
          <span class="number">${achievements.length}</span>
          <span class="label">Achievements Earned</span>
        </div>
        <div class="completion-rate">
          <span class="number">${Math.round((achievements.length / ALL_ACHIEVEMENTS.length) * 100)}%</span>
          <span class="label">Completion Rate</span>
        </div>
      </div>
      
      <div class="badges-grid">
        ${badgesHtml}
      </div>
      
      <div class="achievements-progress">
        <h3>Achievement Progress</h3>
        ${progressHtml}
      </div>
    `;
    
    // Animate badges appearance
    const badges = container.querySelectorAll('.achievement-badge');
    animateSequence(badges, 'fade-in', 100);
    
    // Animate progress items
    const progressItems = container.querySelectorAll('.achievement-progress-item');
    animateSequence(progressItems, 'fade-in-left', 100);
  } catch (error) {
    console.error('Error rendering achievements:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load achievements. Please try again later.</p>
      </div>
    `;
  }
}

// Export functions
export {
  initAchievements,
  checkForNewAchievements,
  getUserAchievements,
  getUserAchievementProgress,
  renderUserAchievements,
  ALL_ACHIEVEMENTS,
  ACHIEVEMENT_TYPES
}; 