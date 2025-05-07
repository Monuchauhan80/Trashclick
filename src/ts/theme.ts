/**
 * Theme management for TrashClick application
 * Handles theme initialization, toggles and user preferences
 */

// Theme type and constants
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

// Color palette type and constants
export enum ColorPalette {
  DEFAULT = 'default',
  OCEAN = 'ocean',
  EARTH = 'earth',
  SUNSET = 'sunset',
  BERRY = 'berry'
}

// Storage keys
const THEME_STORAGE_KEY = 'theme';
const PALETTE_STORAGE_KEY = 'colorPalette';

/**
 * Initialize theme based on user preference or system settings
 */
export function initializeTheme(): void {
  // Get saved theme from localStorage
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY) as ColorPalette | null;
  
  // Check if user has explicitly set a theme
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDarkMode ? Theme.DARK : Theme.LIGHT);
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
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? Theme.DARK : Theme.LIGHT);
    }
  });
}

/**
 * Apply specified theme to the document
 * @param {Theme} theme - 'light' or 'dark'
 */
export function applyTheme(theme: Theme): void {
  if (theme === Theme.DARK) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Save to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  
  // Update all theme toggle controls
  updateThemeToggles(theme);
  
  // Dispatch theme change event
  const event = new CustomEvent('themechange', { detail: { theme } });
  window.dispatchEvent(event);
}

/**
 * Apply a color palette to the site
 * @param {ColorPalette} palette - one of the ColorPalette enum values
 */
export function applyColorPalette(palette: ColorPalette): void {
  // Remove any existing palette classes
  document.documentElement.classList.remove(
    'theme-ocean',
    'theme-earth',
    'theme-sunset',
    'theme-berry'
  );
  
  // Apply the new palette class if not default
  if (palette !== ColorPalette.DEFAULT) {
    document.documentElement.classList.add(`theme-${palette}`);
  }
  
  // Save to localStorage
  localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  
  // Update all palette selectors
  updatePaletteSelectors(palette);
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? Theme.LIGHT : Theme.DARK;
  
  applyTheme(newTheme);
}

/**
 * Set up theme toggle controls
 */
function setupThemeToggles(): void {
  const toggles = document.querySelectorAll<HTMLInputElement>('.dark-mode-toggle, .theme-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      applyTheme(this.checked ? Theme.DARK : Theme.LIGHT);
    });
    
    // Set initial state
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggle.checked = isDark;
  });
  
  // Theme preview elements
  const themePreviewElements = document.querySelectorAll<HTMLElement>('.theme-preview');
  themePreviewElements.forEach(element => {
    element.addEventListener('click', function() {
      const theme = this.getAttribute('data-theme') as Theme;
      if (theme) {
        applyTheme(theme);
      }
    });
  });
}

/**
 * Set up color palette selectors
 */
function setupColorPaletteSelectors(): void {
  const paletteSelectors = document.querySelectorAll<HTMLSelectElement>('.color-palette-selector');
  
  paletteSelectors.forEach(selector => {
    selector.addEventListener('change', function() {
      applyColorPalette(this.value as ColorPalette);
    });
  });
  
  // Set up palette preview elements if they exist
  const palettePreviewElements = document.querySelectorAll<HTMLElement>('.palette-preview');
  palettePreviewElements.forEach(element => {
    element.addEventListener('click', function() {
      const palette = this.getAttribute('data-palette') as ColorPalette;
      if (palette) {
        applyColorPalette(palette);
      }
    });
  });
}

/**
 * Update all theme toggles to match current theme
 * @param {Theme} theme - Current theme
 */
function updateThemeToggles(theme: Theme): void {
  const toggles = document.querySelectorAll<HTMLInputElement>('.dark-mode-toggle, .theme-toggle');
  const isDark = theme === Theme.DARK;
  
  toggles.forEach(toggle => {
    toggle.checked = isDark;
  });
  
  // Update theme preview active state
  const themePreviewElements = document.querySelectorAll<HTMLElement>('.theme-preview');
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
 * @param {ColorPalette} palette - Current color palette
 */
function updatePaletteSelectors(palette: ColorPalette): void {
  const selectors = document.querySelectorAll<HTMLSelectElement>('.color-palette-selector');
  
  selectors.forEach(selector => {
    selector.value = palette;
  });
  
  // Update palette preview active state
  const palettePreviewElements = document.querySelectorAll<HTMLElement>('.palette-preview');
  palettePreviewElements.forEach(element => {
    if (element.getAttribute('data-palette') === palette) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
}

/**
 * Get the current theme
 * @returns {Theme} Current theme
 */
export function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' 
    ? Theme.DARK 
    : Theme.LIGHT;
}

/**
 * Get the current color palette
 * @returns {ColorPalette} Current color palette
 */
export function getCurrentPalette(): ColorPalette {
  const root = document.documentElement;
  
  if (root.classList.contains('theme-ocean')) return ColorPalette.OCEAN;
  if (root.classList.contains('theme-earth')) return ColorPalette.EARTH;
  if (root.classList.contains('theme-sunset')) return ColorPalette.SUNSET;
  if (root.classList.contains('theme-berry')) return ColorPalette.BERRY;
  
  return ColorPalette.DEFAULT;
}

// Define theme change event for TypeScript
declare global {
  interface WindowEventMap {
    'themechange': CustomEvent<{ theme: Theme }>;
  }
}

/**
 * Register a callback for theme changes
 * @param callback - Function to call when theme changes
 * @returns Function to unregister the callback
 */
export function onThemeChange(callback: (theme: Theme) => void): () => void {
  const handler = (e: CustomEvent<{ theme: Theme }>) => callback(e.detail.theme);
  
  window.addEventListener('themechange', handler as EventListener);
  
  // Execute callback with current theme
  callback(getCurrentTheme());
  
  // Return unsubscribe function
  return () => window.removeEventListener('themechange', handler as EventListener);
} 