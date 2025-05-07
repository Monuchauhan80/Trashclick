// Profile Page Javascript
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check user authentication
        const user = await getCurrentUser();
      if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        currentUser = user;
        
        // Initialize UI elements
        initializeTabs();
        setupEventListeners();

      // Load user data
        await loadUserData();
        
        // Setup real-time updates
        setupRealtimeSubscriptions();
        
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showNotification('Failed to load profile. Please try again later.', 'error');
    }
});

// Global variables
let currentUser = null;
let userProfile = null;
let profileSubscription = null;
let activitiesSubscription = null;

// Initialize tab navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
            
            // Save the active tab in sessionStorage
            sessionStorage.setItem('activeProfileTab', targetTab);
        });
    });
    
    // Restore active tab from session storage if available
    const activeTab = sessionStorage.getItem('activeProfileTab');
    if (activeTab) {
        document.querySelector(`[data-tab="${activeTab}"]`)?.click();
    } else {
        // Default to first tab
        tabButtons[0].click();
    }
}

// Set up event listeners for the profile page
function setupEventListeners() {
    // Avatar change button
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', openAvatarModal);
    }
    
    // Avatar upload in modal
    const avatarInput = document.getElementById('avatar-upload');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarPreview);
    }
    
    // Save avatar button
    const saveAvatarBtn = document.getElementById('save-avatar');
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', saveAvatar);
    }
    
    // Close modal buttons
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // About section edit button
    const editAboutBtn = document.getElementById('edit-about-btn');
    if (editAboutBtn) {
        editAboutBtn.addEventListener('click', toggleAboutEdit);
    }
    
    // Save about button
    const saveAboutBtn = document.getElementById('save-about-btn');
    if (saveAboutBtn) {
        saveAboutBtn.addEventListener('click', saveAbout);
    }
    
    // Cancel about edit button
    const cancelAboutBtn = document.getElementById('cancel-about-btn');
    if (cancelAboutBtn) {
        cancelAboutBtn.addEventListener('click', cancelAboutEdit);
    }
    
    // Activity filter dropdown
    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', filterActivities);
    }
}

// Load user data from database
async function loadUserData() {
    try {
        showLoadingState('profile-loading');
        
        // Get user profile data
        userProfile = await getUserProfile(currentUser.id);
        if (!userProfile) {
            showNotification('Error loading profile. Please refresh the page.', 'error');
            return;
        }
        
        // Update UI with user data
        updateProfileUI(userProfile);
        
        // Load badges
        await loadBadges();
        
        // Load activities
        await loadActivities();
        
        // Load impact data
        loadImpactData();
        
        // Hide loading state
        hideLoadingState('profile-loading');
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Failed to load profile data. Please try again later.', 'error');
        hideLoadingState('profile-loading');
    }
}

// Update profile UI with user data
function updateProfileUI(profile) {
    // Update profile header
    document.getElementById('profile-avatar').src = profile.avatar_url || './img/default-avatar.png';
    document.getElementById('user-name').textContent = profile.full_name || 'Anonymous User';
    document.getElementById('user-email').textContent = currentUser.email;
    
    // Update profile stats
    document.getElementById('points-value').textContent = profile.points || 0;
    document.getElementById('rank-value').textContent = profile.rank || 'Newcomer';
    document.getElementById('reports-value').textContent = profile.waste_reports_count || 0;
    document.getElementById('badges-value').textContent = profile.badges?.length || 0;
    
    // Update about section
    const aboutContent = document.getElementById('about-content');
    if (aboutContent) {
        const aboutParagraph = aboutContent.querySelector('p');
        if (aboutParagraph) {
            aboutParagraph.textContent = profile.bio || 'No bio provided yet.';
        }
    }
    
    // Update bio editor
    const bioEditor = document.getElementById('bio-editor');
    if (bioEditor) {
        bioEditor.value = profile.bio || '';
    }
    
    // Update personal information
    document.getElementById('user-location').textContent = profile.location || 'Not specified';
    document.getElementById('user-joined').textContent = new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update edit form fields
    const locationInput = document.getElementById('location-input');
    if (locationInput) {
        locationInput.value = profile.location || '';
    }
}

// Load user badges
async function loadBadges() {
    try {
        if (!userProfile || !userProfile.badges) return;
        
        const badgesContainer = document.querySelector('.badges-container');
        if (!badgesContainer) return;
        
        // Clear existing badges
        badgesContainer.innerHTML = '';
        
        // Get badge criteria to display all possible badges
        const { data: badgeCriteria, error } = await supabaseClient
            .from('badge_criteria')
            .select('*')
            .order('points_required', { ascending: true });
        
        if (error) throw error;
        
        // Create badges HTML
        const userBadges = userProfile.badges || [];
        
        badgeCriteria.forEach(badge => {
            const isEarned = userBadges.includes(badge.badge_id);
            
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
            
            badgeElement.innerHTML = `
                        <div class="badge-icon">
                    <i class="fas ${badge.icon || 'fa-award'}"></i>
                        </div>
                        <div class="badge-info">
                            <h3>${badge.name}</h3>
                            <p>${badge.description}</p>
                    <div class="${isEarned ? 'badge-earned' : 'badge-locked'}">
                        ${isEarned ? 'Earned' : `Requires ${badge.criteria}`}
                    </div>
                </div>
            `;
            
            badgesContainer.appendChild(badgeElement);
        });
        
        // Update next badge progress
        updateNextBadgeProgress(userProfile.points || 0, badgeCriteria);
        
    } catch (error) {
        console.error('Error loading badges:', error);
    }
}

// Update next badge progress
function updateNextBadgeProgress(userPoints, badgeCriteria) {
    const nextBadgeContainer = document.querySelector('.next-badge-container');
    if (!nextBadgeContainer) return;
    
    // Find the next badge to earn
    const earnedBadges = userProfile.badges || [];
    const nextBadge = badgeCriteria.find(badge => !earnedBadges.includes(badge.badge_id));
    
    if (!nextBadge) {
        // User has earned all badges
        nextBadgeContainer.innerHTML = `
            <div class="next-badge-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="next-badge-info">
                <h3>All Badges Earned!</h3>
                <p>You've collected all available badges. Great job!</p>
                <div class="progress-container">
                    <div class="progress-fill" style="width: 100%;"></div>
                </div>
                <div class="progress-text">100% Complete</div>
            </div>
        `;
        return;
    }
    
    // Calculate progress
    const previousBadge = badgeCriteria.filter(badge => badge.points_required < nextBadge.points_required).pop();
    const previousThreshold = previousBadge ? previousBadge.points_required : 0;
    const nextThreshold = nextBadge.points_required;
    
    const pointsNeeded = nextThreshold - previousThreshold;
    const pointsAchieved = userPoints - previousThreshold;
    const progress = Math.min(Math.max(pointsAchieved / pointsNeeded, 0), 1) * 100;
    
    // Update UI
    nextBadgeContainer.innerHTML = `
        <div class="next-badge-icon">
            <i class="fas ${nextBadge.icon || 'fa-award'}"></i>
        </div>
        <div class="next-badge-info">
            <h3>Next Badge: ${nextBadge.name}</h3>
            <p>${nextBadge.description}</p>
            <div class="progress-container">
                <div class="progress-fill" style="width: ${progress}%;"></div>
            </div>
            <div class="progress-text">${userPoints}/${nextThreshold} points (${Math.round(progress)}%)</div>
        </div>
    `;
}

// Load user activities
async function loadActivities(filter = 'all') {
    try {
        const activitiesContainer = document.querySelector('.activities-container');
        if (!activitiesContainer) return;

        // Show loading state
        activitiesContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading activities...</span>
            </div>
        `;
        
        // Fetch activities from database
        let query = supabaseClient
            .from('user_activities')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        // Apply filtering
        if (filter !== 'all') {
            query = query.eq('activity_type', filter);
        }
        
        const { data: activities, error } = await query;
        
        if (error) throw error;
        
        // Clear loading state
        activitiesContainer.innerHTML = '';
        
        // Check if we have activities
        if (!activities || activities.length === 0) {
            activitiesContainer.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-info-circle"></i>
                    <span>No activities found.</span>
                </div>
            `;
            return;
        }
        
        // Create activities HTML
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            
            let iconClass = 'fa-check-circle';
            let iconType = '';
            
            switch (activity.activity_type) {
                case 'waste_report':
                    iconClass = 'fa-trash-alt';
                    iconType = 'report';
                    break;
                case 'badge_earned':
                    iconClass = 'fa-award';
                    iconType = 'badge';
                    break;
                case 'points_earned':
                    iconClass = 'fa-star';
                    iconType = 'points';
                    break;
            }
            
            activityElement.innerHTML = `
                <div class="activity-icon ${iconType}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <h3>${activity.title}</h3>
                    <p>${activity.description}</p>
                    <div class="activity-date">
                        ${formatDate(activity.created_at)}
                    </div>
                </div>
            `;
            
            activitiesContainer.appendChild(activityElement);
        });
        
    } catch (error) {
        console.error('Error loading activities:', error);
        
        const activitiesContainer = document.querySelector('.activities-container');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load activities. Please try again.</span>
                </div>
            `;
        }
    }
}

// Load environmental impact data
function loadImpactData() {
    try {
        if (!userProfile) return;
        
        // Update impact cards
        document.getElementById('waste-collected').textContent = formatNumber(userProfile.waste_collected || 0) + ' kg';
        document.getElementById('waste-recycled').textContent = formatNumber(userProfile.waste_recycled || 0) + ' kg';
        document.getElementById('co2-saved').textContent = formatNumber(calculateCO2Saved(userProfile)) + ' kg';
        document.getElementById('trees-saved').textContent = calculateTreesSaved(userProfile);
        
        // Initialize impact chart
        initializeImpactChart();
        
      } catch (error) {
        console.error('Error loading impact data:', error);
    }
}

// Initialize environmental impact chart
function initializeImpactChart() {
    const ctx = document.getElementById('impact-chart');
    if (!ctx || !window.Chart) return;
    
    // Destroy existing chart if it exists
    if (window.impactChart) {
        window.impactChart.destroy();
    }
    
    // Create dummy data for now
    // In a real application, this would come from the user's activity history
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const wasteData = [5, 10, 15, 12, 20, 18];
    const recycledData = [3, 7, 12, 9, 16, 15];
    
    window.impactChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Waste Collected (kg)',
                    data: wasteData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Waste Recycled (kg)',
                    data: recycledData,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
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
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                }
            }
        }
    });
}

// Setup real-time subscriptions
function setupRealtimeSubscriptions() {
    // Unsubscribe from any existing subscriptions
    if (profileSubscription) profileSubscription.unsubscribe();
    if (activitiesSubscription) activitiesSubscription.unsubscribe();
    
    // Subscribe to profile changes
    profileSubscription = supabaseClient
        .channel('profile-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUser.id}`
        }, payload => {
            userProfile = payload.new;
            updateProfileUI(userProfile);
            loadBadges();
            loadImpactData();
        })
        .subscribe();
        
    // Subscribe to activity changes
    activitiesSubscription = supabaseClient
        .channel('activity-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_activities',
            filter: `user_id=eq.${currentUser.id}`
        }, () => {
            const filter = document.getElementById('activity-filter')?.value || 'all';
            loadActivities(filter);
        })
        .subscribe();
}

// Avatar modal functions
function openAvatarModal() {
    document.getElementById('avatar-modal').classList.add('show');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    
    // Reset avatar preview
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
        avatarPreview.src = userProfile.avatar_url || './img/default-avatar.png';
    }
    
    // Reset file input
    const avatarInput = document.getElementById('avatar-upload');
    if (avatarInput) {
        avatarInput.value = '';
    }
}

function handleAvatarPreview(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please select a valid image file (JPEG, PNG, or GIF).', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size should be less than 2MB.', 'error');
        event.target.value = '';
        return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('avatar-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveAvatar() {
    try {
        const fileInput = document.getElementById('avatar-upload');
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('Please select an image first.', 'error');
            return;
        }
        
        showNotification('Uploading avatar...', 'info');
        
        // Upload file to storage
        const filePath = `avatars/${currentUser.id}-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabaseClient
            .storage
            .from('user-content')
            .upload(filePath, file);
            
        if (uploadError) throw uploadError;
        
        // Get public URL for the file
        const { data: urlData } = supabaseClient
            .storage
            .from('user-content')
            .getPublicUrl(filePath);
            
        const avatarUrl = urlData.publicUrl;
        
        // Update user profile with new avatar URL
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', currentUser.id);
            
        if (updateError) throw updateError;
        
        // Update local user profile
        userProfile.avatar_url = avatarUrl;
        
        // Update avatar in the UI
        document.getElementById('profile-avatar').src = avatarUrl;
        
        showNotification('Avatar updated successfully!', 'success');
        closeModal();
        
    } catch (error) {
        console.error('Error updating avatar:', error);
        showNotification('Failed to update avatar. Please try again.', 'error');
    }
}

// About section edit functions
function toggleAboutEdit() {
    document.getElementById('about-content').style.display = 'none';
    document.getElementById('about-edit').style.display = 'block';
}

function cancelAboutEdit() {
    document.getElementById('about-content').style.display = 'block';
    document.getElementById('about-edit').style.display = 'none';
    
    // Reset the textarea to the current bio
    document.getElementById('bio-editor').value = userProfile.bio || '';
}

async function saveAbout() {
    try {
        const bio = document.getElementById('bio-editor').value.trim();
        
        // Update profile in the database
        const { error } = await supabaseClient
            .from('profiles')
            .update({ bio })
            .eq('id', currentUser.id);
            
        if (error) throw error;
        
        // Update local user profile
        userProfile.bio = bio;
        
        // Update the about content
        const aboutParagraph = document.querySelector('#about-content p');
        if (aboutParagraph) {
            aboutParagraph.textContent = bio || 'No bio provided yet.';
        }
        
        // Show success notification
        showNotification('Bio updated successfully!', 'success');
        
        // Hide edit form and show content
        document.getElementById('about-content').style.display = 'block';
        document.getElementById('about-edit').style.display = 'none';
        
    } catch (error) {
        console.error('Error updating bio:', error);
        showNotification('Failed to update bio. Please try again.', 'error');
    }
}

// Activity filter function
function filterActivities() {
    const filter = document.getElementById('activity-filter').value;
    loadActivities(filter);
}

// Helper function to calculate CO2 saved
function calculateCO2Saved(profile) {
    // Simplified calculation: 2.5kg of CO2 saved per kg of waste recycled
    return (profile.waste_recycled || 0) * 2.5;
}

// Helper function to calculate trees saved
function calculateTreesSaved(profile) {
    // Simplified calculation: 1 tree saved per 50kg of waste recycled
    return Math.round((profile.waste_recycled || 0) / 50);
}

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    }
}

// Helper function to format large numbers
function formatNumber(number) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(number);
}

// Helper functions for loading states
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'flex';
    }
}

function hideLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Helper function to get current user
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// Helper function to get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    
    return data;
}

