/**
 * Theme management for TrashClick application
 * Handles theme initialization, toggles and user preferences
 */

// Available themes
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Available color palettes
const COLOR_PALETTES = {
  DEFAULT: 'default',
  OCEAN: 'ocean',
  EARTH: 'earth',
  SUNSET: 'sunset',
  BERRY: 'berry'
};

/**
 * Initialize theme based on user preference or system settings
 */
function initializeTheme() {
  // Get saved theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  const savedPalette = localStorage.getItem('colorPalette');
  
  // Check if user has explicitly set a theme
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDarkMode ? THEMES.DARK : THEMES.LIGHT);
  }
  
  // Apply saved color palette if exists
  if (savedPalette) {
    applyColorPalette(savedPalette);
  }
  
  // Set up theme toggles
  setupThemeToggles();
  setupColorPaletteSelectors();

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // Only change if user hasn't explicitly set a theme
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    }
  });
}

/**
 * Apply specified theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  if (theme === THEMES.DARK) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Save to localStorage
  localStorage.setItem('theme', theme);
  
  // Update all theme toggle controls
  updateThemeToggles(theme);
}

/**
 * Apply a color palette to the site
 * @param {string} palette - one of the COLOR_PALETTES values
 */
function applyColorPalette(palette) {
  // Remove any existing palette classes
  document.documentElement.classList.remove(
    'theme-ocean',
    'theme-earth',
    'theme-sunset',
    'theme-berry'
  );
  
  // Apply the new palette class if not default
  if (palette !== COLOR_PALETTES.DEFAULT) {
    document.documentElement.classList.add(`theme-${palette}`);
  }
  
  // Save to localStorage
  localStorage.setItem('colorPalette', palette);
  
  // Update all palette selectors
  updatePaletteSelectors(palette);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? THEMES.LIGHT : THEMES.DARK;
  
  applyTheme(newTheme);
}

/**
 * Set up theme toggle controls
 */
function setupThemeToggles() {
  const toggles = document.querySelectorAll('.dark-mode-toggle, .theme-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      applyTheme(this.checked ? THEMES.DARK : THEMES.LIGHT);
    });
    
    // Set initial state
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggle.checked = isDark;
  });
  
  // Theme preview elements
  const themePreviewElements = document.querySelectorAll('.theme-preview');
  themePreviewElements.forEach(element => {
    element.addEventListener('click', function() {
      const theme = this.getAttribute('data-theme');
      applyTheme(theme);
    });
  });
}

/**
 * Set up color palette selectors
 */
function setupColorPaletteSelectors() {
  const paletteSelectors = document.querySelectorAll('.color-palette-selector');
  
  paletteSelectors.forEach(selector => {
    selector.addEventListener('change', function() {
      applyColorPalette(this.value);
    });
  });
  
  // Set up palette preview elements if they exist
  const palettePreviewElements = document.querySelectorAll('.palette-preview');
  palettePreviewElements.forEach(element => {
    element.addEventListener('click', function() {
      const palette = this.getAttribute('data-palette');
      applyColorPalette(palette);
    });
  });
}

/**
 * Update all theme toggles to match current theme
 * @param {string} theme - Current theme
 */
function updateThemeToggles(theme) {
  const toggles = document.querySelectorAll('.dark-mode-toggle, .theme-toggle');
  const isDark = theme === THEMES.DARK;
  
  toggles.forEach(toggle => {
    toggle.checked = isDark;
  });
  
  // Update theme preview active state
  const themePreviewElements = document.querySelectorAll('.theme-preview');
  themePreviewElements.forEach(element => {
    if (element.getAttribute('data-theme') === theme) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
}

/**
 * Update all palette selectors to match current palette
 * @param {string} palette - Current color palette
 */
function updatePaletteSelectors(palette) {
  const selectors = document.querySelectorAll('.color-palette-selector');
  
  selectors.forEach(selector => {
    selector.value = palette;
  });
  
  // Update palette preview active state
  const palettePreviewElements = document.querySelectorAll('.palette-preview');
  palettePreviewElements.forEach(element => {
    if (element.getAttribute('data-palette') === palette) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
}

// Export functions for use in other modules
export {
  initializeTheme,
  toggleTheme,
  applyTheme,
  applyColorPalette,
  THEMES,
  COLOR_PALETTES
};

