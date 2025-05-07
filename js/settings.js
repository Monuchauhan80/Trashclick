// Settings management for TrashClick
import { supabase } from './supabase.js';
import { showNotification, getCookie, setCookie } from './utils.js';
import { setAnimationSpeed, setScrollAnimations } from './animations.js';

// Settings state
const settings = {
  darkMode: false,
  fontSize: 'normal',
  animationSpeed: 'normal',
  scrollAnimations: true,
  notificationPreferences: {
    email: true,
    push: true,
    community: true,
    messages: true
  },
  language: 'en',
  accessibilityMode: false,
  dataUsage: 'normal',
  isLoaded: false
};

/**
 * Initialize settings
 */
export async function initSettings() {
  console.log('Initializing settings...');
  
  // Try to load settings from localStorage first (for fast initial load)
  loadSettingsFromLocalStorage();
  
  // Then try to load from Supabase (for syncing across devices)
  if (supabase.auth.getUser()) {
    await loadSettingsFromSupabase();
  }
  
  // Apply settings
  applySettings();
  
  // Set up settings UI if on settings page
  setupSettingsUI();
  
  // Mark settings as loaded
  settings.isLoaded = true;
  
  console.log('Settings initialized');
}

/**
 * Load settings from localStorage
 */
function loadSettingsFromLocalStorage() {
  try {
    const storedSettings = localStorage.getItem('trashclick_settings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      Object.assign(settings, parsedSettings);
      console.log('Settings loaded from localStorage');
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
}

/**
 * Load settings from Supabase
 */
async function loadSettingsFromSupabase() {
  try {
    const user = supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('Error loading settings from Supabase:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const userSettings = data[0];
      
      // Update settings state
      settings.darkMode = userSettings.dark_mode || false;
      settings.fontSize = userSettings.font_size || 'normal';
      settings.animationSpeed = userSettings.animation_speed || 'normal';
      settings.scrollAnimations = userSettings.scroll_animations !== false; // Default to true
      settings.notificationPreferences = userSettings.notification_preferences || settings.notificationPreferences;
      settings.language = userSettings.language || 'en';
      settings.accessibilityMode = userSettings.accessibility_mode || false;
      settings.dataUsage = userSettings.data_usage || 'normal';
      
      // Save to localStorage for offline/fast access
      saveSettingsToLocalStorage();
      
      console.log('Settings loaded from Supabase');
    }
  } catch (error) {
    console.error('Error in loadSettingsFromSupabase:', error);
  }
}

/**
 * Save settings to localStorage
 */
function saveSettingsToLocalStorage() {
  try {
    localStorage.setItem('trashclick_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}

/**
 * Save settings to Supabase
 */
export async function saveSettingsToSupabase() {
  try {
    const user = supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        dark_mode: settings.darkMode,
        font_size: settings.fontSize,
        animation_speed: settings.animationSpeed,
        scroll_animations: settings.scrollAnimations,
        notification_preferences: settings.notificationPreferences,
        language: settings.language,
        accessibility_mode: settings.accessibilityMode,
        data_usage: settings.dataUsage,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving settings to Supabase:', error);
      showNotification('Failed to save settings to the server.', 'error');
      return false;
    }
    
    console.log('Settings saved to Supabase');
    return true;
  } catch (error) {
    console.error('Error in saveSettingsToSupabase:', error);
    showNotification('Failed to save settings to the server.', 'error');
    return false;
  }
}

/**
 * Apply current settings to the website
 */
function applySettings() {
  // Apply dark mode
  applyDarkMode(settings.darkMode);
  
  // Apply font size
  applyFontSize(settings.fontSize);
  
  // Apply animation settings
  applyAnimationSettings(settings.animationSpeed, settings.scrollAnimations);
  
  // Apply accessibility settings
  applyAccessibilitySettings(settings.accessibilityMode);
  
  // Apply language settings
  applyLanguageSettings(settings.language);
  
  console.log('Settings applied');
}

/**
 * Apply dark mode setting
 * @param {boolean} darkMode - Whether to enable dark mode
 */
function applyDarkMode(darkMode) {
  if (darkMode) {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

/**
 * Toggle dark mode
 * @returns {boolean} - New dark mode state
 */
export function toggleDarkMode() {
  settings.darkMode = !settings.darkMode;
  applyDarkMode(settings.darkMode);
  saveSettingsToLocalStorage();
  
  // Update toggles on the page
  const darkModeToggles = document.querySelectorAll('.dark-mode-toggle');
  darkModeToggles.forEach(toggle => {
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.darkMode;
    }
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
  
  return settings.darkMode;
}

/**
 * Apply font size setting
 * @param {string} fontSize - Font size setting (small, normal, large, x-large)
 */
function applyFontSize(fontSize) {
  document.documentElement.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-x-large');
  document.documentElement.classList.add(`font-size-${fontSize}`);
  
  // Update font size variables
  let sizeMultiplier = 1;
  switch (fontSize) {
    case 'small': sizeMultiplier = 0.85; break;
    case 'normal': sizeMultiplier = 1; break;
    case 'large': sizeMultiplier = 1.15; break;
    case 'x-large': sizeMultiplier = 1.3; break;
  }
  
  document.documentElement.style.setProperty('--font-size-multiplier', sizeMultiplier.toString());
}

/**
 * Set font size
 * @param {string} fontSize - Font size setting (small, normal, large, x-large)
 */
export function setFontSize(fontSize) {
  settings.fontSize = fontSize;
  applyFontSize(fontSize);
  saveSettingsToLocalStorage();
  
  // Update radio buttons on the page
  const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');
  fontSizeRadios.forEach(radio => {
    radio.checked = radio.value === fontSize;
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
}

/**
 * Apply animation settings
 * @param {string} animationSpeed - Animation speed (slow, normal, fast, none)
 * @param {boolean} scrollAnimations - Whether to enable scroll animations
 */
function applyAnimationSettings(animationSpeed, scrollAnimations) {
  // Apply animation speed
  let speedMultiplier = 1;
  switch (animationSpeed) {
    case 'slow': speedMultiplier = 1.5; break;
    case 'normal': speedMultiplier = 1; break;
    case 'fast': speedMultiplier = 0.7; break;
    case 'none': speedMultiplier = 0; break;
  }
  
  document.documentElement.style.setProperty('--animation-speed-multiplier', speedMultiplier.toString());
  
  // Apply to the animations system
  setAnimationSpeed(speedMultiplier);
  setScrollAnimations(scrollAnimations && speedMultiplier > 0);
}

/**
 * Set animation speed
 * @param {string} animationSpeed - Animation speed (slow, normal, fast, none)
 */
export function setAnimationSpeed(animationSpeed) {
  settings.animationSpeed = animationSpeed;
  applyAnimationSettings(animationSpeed, settings.scrollAnimations);
  saveSettingsToLocalStorage();
  
  // Update radio buttons on the page
  const animationSpeedRadios = document.querySelectorAll('input[name="animation-speed"]');
  animationSpeedRadios.forEach(radio => {
    radio.checked = radio.value === animationSpeed;
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
}

/**
 * Toggle scroll animations
 * @returns {boolean} - New scroll animations state
 */
export function toggleScrollAnimations() {
  settings.scrollAnimations = !settings.scrollAnimations;
  applyAnimationSettings(settings.animationSpeed, settings.scrollAnimations);
  saveSettingsToLocalStorage();
  
  // Update toggles on the page
  const scrollAnimationToggles = document.querySelectorAll('.scroll-animations-toggle');
  scrollAnimationToggles.forEach(toggle => {
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.scrollAnimations;
    }
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
  
  return settings.scrollAnimations;
}

/**
 * Apply accessibility settings
 * @param {boolean} accessibilityMode - Whether to enable accessibility mode
 */
function applyAccessibilitySettings(accessibilityMode) {
  if (accessibilityMode) {
    document.documentElement.classList.add('accessibility-mode');
    
    // Add skip to content link if not already present
    if (!document.getElementById('skip-to-content')) {
      const skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Increase contrast
    document.documentElement.style.setProperty('--contrast-multiplier', '1.3');
    
    // Reduce animations
    setAnimationSpeed('slow');
    
    // Ensure focus styles are visible
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    style.textContent = `
      :focus {
        outline: 3px solid #4d90fe !important;
        outline-offset: 2px !important;
      }
      
      button, a, input, select, textarea {
        transition: outline-color 0.2s ease-in-out !important;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      #skip-to-content {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 100;
        transition: top 0.3s;
      }
      
      #skip-to-content:focus {
        top: 0;
      }
    `;
    
    if (!document.getElementById('accessibility-styles')) {
      document.head.appendChild(style);
    }
  } else {
    document.documentElement.classList.remove('accessibility-mode');
    document.documentElement.style.setProperty('--contrast-multiplier', '1');
    
    // Remove accessibility styles
    const accessibilityStyles = document.getElementById('accessibility-styles');
    if (accessibilityStyles) {
      accessibilityStyles.remove();
    }
  }
}

/**
 * Toggle accessibility mode
 * @returns {boolean} - New accessibility mode state
 */
export function toggleAccessibilityMode() {
  settings.accessibilityMode = !settings.accessibilityMode;
  applyAccessibilitySettings(settings.accessibilityMode);
  saveSettingsToLocalStorage();
  
  // Update toggles on the page
  const accessibilityToggles = document.querySelectorAll('.accessibility-toggle');
  accessibilityToggles.forEach(toggle => {
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.accessibilityMode;
    }
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
  
  return settings.accessibilityMode;
}

/**
 * Apply language settings
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
 */
function applyLanguageSettings(language) {
  document.documentElement.lang = language;
  
  // In a real app, this would load translations and update UI text
  console.log(`Language set to: ${language}`);
}

/**
 * Set language
 * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
 */
export function setLanguage(language) {
  settings.language = language;
  applyLanguageSettings(language);
  saveSettingsToLocalStorage();
  
  // Update language selector on the page
  const languageSelectors = document.querySelectorAll('.language-selector');
  languageSelectors.forEach(selector => {
    if (selector.tagName === 'SELECT') {
      selector.value = language;
    }
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
}

/**
 * Update notification preferences
 * @param {string} type - Notification type (email, push, community, messages)
 * @param {boolean} enabled - Whether to enable notifications of this type
 */
export function updateNotificationPreference(type, enabled) {
  if (!settings.notificationPreferences.hasOwnProperty(type)) {
    console.error(`Invalid notification type: ${type}`);
    return;
  }
  
  settings.notificationPreferences[type] = enabled;
  saveSettingsToLocalStorage();
  
  // Update toggles on the page
  const notificationToggles = document.querySelectorAll(`.notification-toggle[data-type="${type}"]`);
  notificationToggles.forEach(toggle => {
    if (toggle.type === 'checkbox') {
      toggle.checked = enabled;
    }
  });
  
  // Save to Supabase if user is logged in
  if (supabase.auth.getUser()) {
    saveSettingsToSupabase();
  }
}

/**
 * Set up settings UI elements
 */
function setupSettingsUI() {
  // Only proceed if on settings page
  if (!document.querySelector('.settings-page, .settings-section')) {
    return;
  }
  
  console.log('Setting up settings UI...');
  
  // Setup dark mode toggle
  setupDarkModeToggle();
  
  // Setup font size selector
  setupFontSizeSelector();
  
  // Setup animation settings
  setupAnimationSettings();
  
  // Setup accessibility toggle
  setupAccessibilityToggle();
  
  // Setup language selector
  setupLanguageSelector();
  
  // Setup notification preferences
  setupNotificationPreferences();
  
  // Setup data usage settings
  setupDataUsageSettings();
  
  // Setup save button (if separate from individual settings)
  setupSaveButton();
  
  console.log('Settings UI setup complete');
}

/**
 * Setup dark mode toggle
 */
function setupDarkModeToggle() {
  const darkModeToggles = document.querySelectorAll('.dark-mode-toggle');
  
  darkModeToggles.forEach(toggle => {
    // Set initial state
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.darkMode;
    }
    
    // Add event listener
    toggle.addEventListener('change', () => {
      toggleDarkMode();
      showNotification(`Dark mode ${settings.darkMode ? 'enabled' : 'disabled'}`, 'success');
    });
  });
  
  // Setup any theme buttons
  const themeButtons = document.querySelectorAll('.theme-button');
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.dataset.theme;
      if (theme === 'dark') {
        if (!settings.darkMode) toggleDarkMode();
      } else {
        if (settings.darkMode) toggleDarkMode();
      }
    });
  });
}

/**
 * Setup font size selector
 */
function setupFontSizeSelector() {
  const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');
  
  fontSizeRadios.forEach(radio => {
    // Set initial state
    radio.checked = radio.value === settings.fontSize;
    
    // Add event listener
    radio.addEventListener('change', () => {
      if (radio.checked) {
        setFontSize(radio.value);
        showNotification(`Font size set to ${radio.value}`, 'success');
      }
    });
  });
}

/**
 * Setup animation settings
 */
function setupAnimationSettings() {
  // Animation speed
  const animationSpeedRadios = document.querySelectorAll('input[name="animation-speed"]');
  animationSpeedRadios.forEach(radio => {
    // Set initial state
    radio.checked = radio.value === settings.animationSpeed;
    
    // Add event listener
    radio.addEventListener('change', () => {
      if (radio.checked) {
        setAnimationSpeed(radio.value);
        showNotification(`Animation speed set to ${radio.value}`, 'success');
      }
    });
  });
  
  // Scroll animations toggle
  const scrollAnimationToggles = document.querySelectorAll('.scroll-animations-toggle');
  scrollAnimationToggles.forEach(toggle => {
    // Set initial state
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.scrollAnimations;
    }
    
    // Add event listener
    toggle.addEventListener('change', () => {
      toggleScrollAnimations();
      showNotification(`Scroll animations ${settings.scrollAnimations ? 'enabled' : 'disabled'}`, 'success');
    });
  });
}

/**
 * Setup accessibility toggle
 */
function setupAccessibilityToggle() {
  const accessibilityToggles = document.querySelectorAll('.accessibility-toggle');
  
  accessibilityToggles.forEach(toggle => {
    // Set initial state
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.accessibilityMode;
    }
    
    // Add event listener
    toggle.addEventListener('change', () => {
      toggleAccessibilityMode();
      showNotification(`Accessibility mode ${settings.accessibilityMode ? 'enabled' : 'disabled'}`, 'success');
    });
  });
}

/**
 * Setup language selector
 */
function setupLanguageSelector() {
  const languageSelectors = document.querySelectorAll('.language-selector');
  
  languageSelectors.forEach(selector => {
    // Set initial state
    if (selector.tagName === 'SELECT') {
      selector.value = settings.language;
    }
    
    // Add event listener
    selector.addEventListener('change', () => {
      setLanguage(selector.value);
      showNotification(`Language set to ${selector.options[selector.selectedIndex].text}`, 'success');
    });
  });
}

/**
 * Setup notification preferences
 */
function setupNotificationPreferences() {
  const notificationToggles = document.querySelectorAll('.notification-toggle');
  
  notificationToggles.forEach(toggle => {
    const type = toggle.dataset.type;
    
    // Skip if no type is specified
    if (!type) return;
    
    // Set initial state
    if (toggle.type === 'checkbox') {
      toggle.checked = settings.notificationPreferences[type];
    }
    
    // Add event listener
    toggle.addEventListener('change', () => {
      updateNotificationPreference(type, toggle.checked);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
    });
  });
}

/**
 * Setup data usage settings
 */
function setupDataUsageSettings() {
  const dataUsageRadios = document.querySelectorAll('input[name="data-usage"]');
  
  dataUsageRadios.forEach(radio => {
    // Set initial state
    radio.checked = radio.value === settings.dataUsage;
    
    // Add event listener
    radio.addEventListener('change', () => {
      if (radio.checked) {
        settings.dataUsage = radio.value;
        saveSettingsToLocalStorage();
        
        // Save to Supabase if user is logged in
        if (supabase.auth.getUser()) {
          saveSettingsToSupabase();
        }
        
        showNotification(`Data usage set to ${radio.value}`, 'success');
      }
    });
  });
}

/**
 * Setup save button
 */
function setupSaveButton() {
  const saveButton = document.getElementById('save-settings');
  
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      // Show loading state
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      
      // Save settings to localStorage
      saveSettingsToLocalStorage();
      
      // Save to Supabase if user is logged in
      let saveSuccess = true;
      if (supabase.auth.getUser()) {
        saveSuccess = await saveSettingsToSupabase();
      }
      
      // Reset button
      saveButton.disabled = false;
      saveButton.innerHTML = 'Save Settings';
      
      // Show notification
      if (saveSuccess) {
        showNotification('Settings saved successfully', 'success');
      }
    });
  }
}

/**
 * Export settings object for use in other modules
 */
export function getSettings() {
  return { ...settings };
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);

