import { Chart } from "@/components/ui/chart"
import { supabaseClient, db } from './supabase.js';
import { auth } from './auth.js';
import { showNotification, validateAppName } from './utils.js';

// Chart reference for updating
let activityChart = null;
let impactChart = null;

// Data cache
let userData = null;
let userReports = [];
let leaderboardData = [];

// DOM Elements
const sidebarToggle = document.getElementById("sidebar-toggle")
const sidebar = document.getElementById("sidebar")
const themeToggle = document.getElementById("theme-toggle")
const userDropdown = document.getElementById("user-dropdown")
const userDropdownMenu = document.getElementById("user-dropdown-menu")
const dashboardContent = document.getElementById("dashboard-content")
const statsList = document.getElementById("stats-list")
const recentReportsContainer = document.getElementById("recent-reports")
const leaderboardContainer = document.getElementById("leaderboard-preview")
const activityChartContainer = document.getElementById("activity-chart")
const badgesContainer = document.getElementById("user-badges")

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if user is logged in
        const user = await auth.getCurrentUser();
        if (!user) {
            // Redirect to login if not logged in
            window.location.href = 'login.html?redirect=dashboard.html';
            return;
        }
        
        // Load all data
        await Promise.all([
            loadUserData(user.id),
            loadRecentReports(user.id),
            loadLeaderboard(),
            subscribeToUpdates(user.id)
        ]);
        
        // Set up event listeners
        setupEventListeners();
        
        // Check app name is consistent
        validateAppName();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Error loading dashboard data', 'error');
    }
});

// Load user data and profile
async function loadUserData(userId) {
    try {
        // Get user profile data
        const profile = await db.getUserProfile(userId);
        if (!profile) {
            console.error('Failed to fetch user profile');
            showNotification('Failed to load user profile', 'error');
            return;
        }
        
        // Cache the data
        userData = profile;
        
        // Update UI components
        updateUserInfo(profile);
        loadUserStats(profile);
        loadUserBadges(profile);
        initCharts(profile);
        loadNotifications(userId);
        
        return profile;
  } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error loading user data', 'error');
    }
}

// Update user information in the UI
function updateUserInfo(profile) {
    // Update username
    const userNameElements = document.querySelectorAll('#user-name, .username');
    userNameElements.forEach(el => {
        el.textContent = profile.full_name || 'User';
    });
    
    // Update avatar
    const avatarElements = document.querySelectorAll('#user-avatar, .user-avatar');
    avatarElements.forEach(el => {
        el.src = profile.avatar_url || 'img/default-avatar.jpg';
        el.alt = `${profile.full_name || 'User'} Avatar`;
    });
    
    // Update points
    const pointsCount = document.getElementById('points-count');
    if (pointsCount) {
        pointsCount.textContent = profile.points || '0';
    }
    
    // Update impact summary
    updateImpactSummary(profile);
}

// Update environmental impact values
function updateImpactSummary(profile) {
    // Calculate impact metrics based on user activity
    const co2Reduced = Math.round(((profile.points || 0) / 10) * 2.5); // kg of CO2
    const waterSaved = Math.round(((profile.points || 0) / 5) * 20); // liters of water
    const energySaved = Math.round(((profile.points || 0) / 15) * 5); // kWh of energy
    const wasteDiverted = Math.round(((profile.reports_count || 0) * 3) + ((profile.recycling_count || 0) * 2)); // kg of waste
    
    // Update impact stats if they exist
    const impactValues = document.querySelectorAll('.impact-value');
    if (impactValues.length >= 4) {
        impactValues[0].textContent = `${co2Reduced} kg`;
        impactValues[1].textContent = `${waterSaved} L`;
        impactValues[2].textContent = `${energySaved} kWh`;
        impactValues[3].textContent = `${wasteDiverted} kg`;
    }
}

// Load user statistics
function loadUserStats(profile) {
    // Update waste reports count
    const reportsCount = document.getElementById('waste-reports-count');
    if (reportsCount) {
        reportsCount.textContent = profile.reports_count || '0';
    }
    
    // Update waste sold count
    const wasteSoldCount = document.getElementById('waste-sold-count');
    if (wasteSoldCount) {
        wasteSoldCount.textContent = `${profile.recycling_count || '0'} kg`;
    }
    
    // Update food donated count
    const foodDonatedCount = document.getElementById('food-donated-count');
    if (foodDonatedCount) {
        foodDonatedCount.textContent = `${profile.donations_count || '0'} kg`;
    }
}

// Load user badges
function loadUserBadges(profile) {
    const badgesContainer = document.getElementById('badges-container');
    if (!badgesContainer) return;
    
    // Clear any loading indicators
    badgesContainer.innerHTML = '';
    
    // Define badges (same as in rewards.js)
    const badgesList = [
        { id: 'welcome', name: 'Welcome', icon: 'handshake', description: 'Joined TrashClick' },
        { id: 'first-report', name: 'First Report', icon: 'map-marker-alt', description: 'Submitted first waste report' },
        { id: 'super-reporter', name: 'Super Reporter', icon: 'chart-line', description: 'Submitted 10+ waste reports' },
        { id: 'recycler', name: 'Recycler', icon: 'recycle', description: 'Recycled waste materials' }
    ];
    
    // Get user badges
    const userBadges = profile.badges || [];
    
    // Create badge elements
    badgesList.forEach(badge => {
        const hasBadge = userBadges.includes(badge.id);
        
        const badgeItem = document.createElement('div');
        badgeItem.className = 'badge-item';
        
        badgeItem.innerHTML = `
            <div class="badge-icon ${hasBadge ? 'unlocked' : 'locked'}">
                <i class="fas fa-${badge.icon}"></i>
                    </div>
            <div class="badge-info">
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
                        </div>
        `;
        
        badgesContainer.appendChild(badgeItem);
    });
}

// Load recent waste reports
async function loadRecentReports(userId) {
    const reportsContainer = document.getElementById('recent-reports-container');
    if (!reportsContainer) return;
    
    try {
        // Show loading state
        reportsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading reports...</p>
            </div>
        `;
        
        // Get reports from database
        const reports = await db.getWasteReports({ user_id: userId, limit: 5 });
        userReports = reports;

    // Clear loading state
        reportsContainer.innerHTML = '';
        
        if (reports.length === 0) {
            reportsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No reports yet. Let's create your first report!</p>
                    <a href="report-waste.html" class="btn btn-primary">Report Waste</a>
                </div>
            `;
            return;
        }
        
        // Create recent reports list
        const reportsList = document.createElement('div');
        reportsList.className = 'reports-list';
        
        // Add reports to the list
        reports.forEach(report => {
            const reportDate = new Date(report.created_at);
            const formattedDate = reportDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            // Determine status class and icon
            let statusClass, statusIcon;
            switch(report.status) {
                case 'approved':
                    statusClass = 'success';
                    statusIcon = 'check-circle';
                    break;
                case 'rejected':
                    statusClass = 'danger';
                    statusIcon = 'times-circle';
                    break;
                case 'in_progress':
                    statusClass = 'warning';
                    statusIcon = 'clock';
                    break;
                default:
                    statusClass = 'info';
                    statusIcon = 'info-circle';
            }
            
            // Create report item
            const reportItem = document.createElement('div');
            reportItem.className = 'report-item';
            reportItem.dataset.id = report.id;
            
            reportItem.innerHTML = `
                <div class="report-image">
                    <img src="${report.image_url || 'img/default-report.jpg'}" alt="Report Image">
                </div>
                <div class="report-content">
                    <h3>${report.title || 'Waste Report'}</h3>
                    <p class="report-location"><i class="fas fa-map-marker-alt"></i> ${report.location || 'Unknown location'}</p>
                    <div class="report-meta">
                        <span class="report-date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                        <span class="report-status ${statusClass}">
                            <i class="fas fa-${statusIcon}"></i> ${report.status || 'pending'}
                        </span>
                    </div>
                </div>
            `;
            
            reportsList.appendChild(reportItem);
        });
        
        reportsContainer.appendChild(reportsList);
        
        // Add click event to view report details
        const reportItems = document.querySelectorAll('.report-item');
        reportItems.forEach(item => {
            item.addEventListener('click', () => {
                const reportId = item.dataset.id;
                window.location.href = `report-details.html?id=${reportId}`;
            });
        });
        
  } catch (error) {
        console.error('Error loading recent reports:', error);
        reportsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load reports. Please try again later.</p>
            </div>
        `;
    }
}

// Load leaderboard preview
async function loadLeaderboard() {
    const leaderboardContainer = document.getElementById('leaderboard-preview-container');
    if (!leaderboardContainer) return;
    
    try {
        // Show loading state
        leaderboardContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading leaderboard...</p>
            </div>
        `;
        
        // Get leaderboard data
        const leaderboard = await db.getLeaderboard(5); // Top 5 users
        leaderboardData = leaderboard;

    // Clear loading state
        leaderboardContainer.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No leaderboard data available yet.</p>
                </div>
            `;
            return;
        }
        
        // Get current user to highlight their position
        const currentUser = await auth.getCurrentUser();
        
        // Create leaderboard list
        const table = document.createElement('table');
        table.className = 'leaderboard-table';
        
        // Add table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');

        // Add leaderboard entries
        leaderboard.forEach((entry, index) => {
            const isCurrentUser = currentUser && entry.id === currentUser.id;

            const row = document.createElement('tr');
            row.className = isCurrentUser ? 'current-user' : '';

      row.innerHTML = `
                <td class="rank">${index + 1}</td>
                <td class="user">
                    <div class="user-info">
                        <img src="${entry.avatar_url || 'img/default-avatar.jpg'}" alt="${entry.full_name || 'User'} Avatar" class="user-avatar">
                        <span>${entry.full_name || 'User'}</span>
                        ${isCurrentUser ? '<span class="current-user-badge">You</span>' : ''}
                    </div>
                </td>
                <td class="points">${entry.points || '0'}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        leaderboardContainer.appendChild(table);
        
  } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load leaderboard. Please try again later.</p>
            </div>
        `;
    }
}

// Load notifications
async function loadNotifications(userId) {
    try {
        const notifications = await db.getNotifications(userId);
        const badgeElement = document.querySelector('.notification-dropdown .badge');
        
        if (!badgeElement) return;
        
        // Count unread notifications
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update badge
        if (unreadCount > 0) {
            badgeElement.textContent = unreadCount;
            badgeElement.style.display = 'flex';
        } else {
            badgeElement.textContent = '0';
            badgeElement.style.display = 'none';
        }
        
        // Update dropdown if it exists
        const container = document.querySelector('.notifications-container');
        if (container) {
            // Clear container
            container.innerHTML = '';
            
            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
                return;
            }
            
            // Add notifications to container (most recent first)
            notifications
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5) // Only show 5 most recent
                .forEach(notification => {
                    const date = new Date(notification.created_at);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const notificationItem = document.createElement('div');
                    notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
                    notificationItem.dataset.id = notification.id;
                    
                    let icon;
                    switch (notification.type) {
                        case 'badge': icon = 'trophy'; break;
                        case 'points': icon = 'star'; break;
                        case 'report': icon = 'clipboard-check'; break;
                        default: icon = 'bell';
                    }
                    
                    notificationItem.innerHTML = `
                        <div class="notification-icon">
                            <i class="fas fa-${icon}"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                            <span class="notification-time">${formattedDate}</span>
                        </div>
                    `;
                    
                    // Add click handler to mark as read
                    notificationItem.addEventListener('click', async () => {
                        if (!notification.read) {
                            await db.markNotificationAsRead(notification.id);
                            notificationItem.classList.remove('unread');
                            
                            // Update badge counter
                            const newUnreadCount = parseInt(badgeElement.textContent) - 1;
                            if (newUnreadCount > 0) {
                                badgeElement.textContent = newUnreadCount;
                            } else {
                                badgeElement.style.display = 'none';
                            }
                        }
                    });
                    
                    container.appendChild(notificationItem);
                });
            
            // Add mark all as read button handler
            const markAllBtn = document.querySelector('.mark-all-read');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', async () => {
                    await db.markAllNotificationsAsRead(userId);
                    
                    // Update UI
                    document.querySelectorAll('.notification-item').forEach(item => {
                        item.classList.remove('unread');
                    });
                    
                    // Update badge
                    badgeElement.style.display = 'none';
                });
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Initialize charts
function initCharts(profile) {
    // Activity chart
    const activityChartCanvas = document.getElementById('activity-chart');
    if (activityChartCanvas) {
        // Generate data for last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const lastMonths = Array.from({length: 6}, (_, i) => {
            return months[(currentMonth - 5 + i + 12) % 12];
        });
        
        // Generate some sample activity data
        // In a real app, this would come from the database
        const wasteReportData = [5, 8, 12, 10, 15, 18];
        const wasteSoldData = [3, 5, 7, 8, 10, 12];
        const foodDonationData = [2, 3, 5, 4, 7, 9];
        
        activityChart = new Chart(activityChartCanvas, {
            type: 'line',
      data: {
                labels: lastMonths,
        datasets: [
          {
                        label: 'Waste Reports',
                        data: wasteReportData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Waste Sold',
                        data: wasteSoldData,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Food Donated',
                        data: foodDonationData,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
                        position: 'bottom'
                    }
        },
        scales: {
          y: {
            beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Activity Count'
                        }
                    }
                }
            }
        });
        
        // Handle period change
        const periodSelect = document.getElementById('activity-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                // In a real app, this would fetch new data based on the selected period
                // For now, we'll just update with random data
                const datasets = activityChart.data.datasets;
                
                datasets[0].data = Array.from({length: 6}, () => Math.floor(Math.random() * 20 + 5));
                datasets[1].data = Array.from({length: 6}, () => Math.floor(Math.random() * 15 + 3));
                datasets[2].data = Array.from({length: 6}, () => Math.floor(Math.random() * 10 + 2));
                
                activityChart.update();
            });
        }
    }
    
    // Impact chart (if it exists)
    const impactChartCanvas = document.getElementById('impact-chart');
    if (impactChartCanvas) {
        impactChart = new Chart(impactChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Waste Reports', 'Waste Sold', 'Food Donated'],
                datasets: [{
                    data: [
                        profile.reports_count || 0, 
                        profile.recycling_count || 0, 
                        profile.donations_count || 0
                    ],
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3',
                        '#FF9800'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Subscribe to real-time updates
function subscribeToUpdates(userId) {
    // Subscribe to profile changes
    const profileSubscription = supabaseClient
        .channel('profile-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
        }, payload => {
            // Update local data
            userData = payload.new;
            
            // Update UI
            updateUserInfo(payload.new);
            loadUserStats(payload.new);
            
            // Update charts if they exist
            if (impactChart) {
                impactChart.data.datasets[0].data = [
                    payload.new.reports_count || 0,
                    payload.new.recycling_count || 0,
                    payload.new.donations_count || 0
                ];
                impactChart.update();
            }
            
            // Show notification for point changes
            if (payload.old.points !== payload.new.points) {
                const pointsDiff = payload.new.points - payload.old.points;
                if (pointsDiff > 0) {
                    showNotification(`You earned ${pointsDiff} points!`, 'success');
                }
            }
        })
        .subscribe();
    
    // Subscribe to new notifications
    const notificationSubscription = supabaseClient
        .channel('notification-updates')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, payload => {
            // Refresh notifications
            loadNotifications(userId);
            
            // Show toast for new notification
            showNotification(payload.new.title, 'info');
        })
        .subscribe();
    
    // Subscribe to leaderboard updates
    const leaderboardSubscription = supabaseClient
        .channel('leaderboard-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles'
        }, () => {
            // Refresh leaderboard
            loadLeaderboard();
        })
        .subscribe();
    
    // Clean up on page leave
    window.addEventListener('beforeunload', () => {
        supabaseClient.removeChannel(profileSubscription);
        supabaseClient.removeChannel(notificationSubscription);
        supabaseClient.removeChannel(leaderboardSubscription);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.dashboard-layout').classList.toggle('sidebar-collapsed');
        });
    }
    
    // Notification dropdown
    const notificationBtn = document.querySelector('.notification-dropdown .btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            const dropdown = document.querySelector('.notification-dropdown-menu');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }
    
    // User dropdown
    const userDropdownToggle = document.querySelector('.user-dropdown-toggle');
    if (userDropdownToggle) {
        userDropdownToggle.addEventListener('click', () => {
            const dropdown = document.querySelector('.user-dropdown-menu');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Close notification dropdown
        const notifDropdown = document.querySelector('.notification-dropdown-menu');
        if (notifDropdown && !e.target.closest('.notification-dropdown')) {
            notifDropdown.classList.remove('active');
        }
        
        // Close user dropdown
        const userDropdown = document.querySelector('.user-dropdown-menu');
        if (userDropdown && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.logout();
                // Redirect happens in the auth.logout() function
  } catch (error) {
                console.error('Logout error:', error);
                showNotification('Error logging out', 'error');
    }
        });
  }
}

// Helper functions
function showLoadingStates() {
  const loadingContainers = [
    statsList,
    recentReportsContainer,
    leaderboardContainer,
    activityChartContainer,
    badgesContainer,
  ]

  loadingContainers.forEach((container) => {
    if (container) {
      container.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            `
    }
  })
}

function showErrorMessage(container, message) {
  if (!container) return

  container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button class="btn btn-sm btn-primary mt-3" onclick="window.location.reload()">
                Try Again
            </button>
        </div>
    `
}

function showEmptyState(container, title, message, buttonText, buttonLink) {
  if (!container) return

  let buttonHtml = ""
  if (buttonText && buttonLink) {
    buttonHtml = `
            <a href="${buttonLink}" class="btn btn-primary btn-sm">
                ${buttonText}
            </a>
        `
  }

  container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-info-circle fa-2x mb-3"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            ${buttonHtml}
        </div>
    `
}

// Export functions for potential use in other modules
export { initializeDashboard, updateUserInfo, loadUserStats, loadRecentReports, loadLeaderboardPreview }

