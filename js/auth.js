/**
 * Authentication module for TrashClick
 * Handles login, registration, password reset and user authentication
 */
import { supabase, auth as supabaseAuth } from './supabase.js';
import { showNotification } from './utils.js';

// Auth state
let currentUser = null;
let authStateChangeCallbacks = [];

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

/**
 * Initialize authentication functionality
 */
async function initAuth() {
  // Check current session
  await refreshUserSession();
  
  // Setup login form
  setupLoginForm();
  
  // Setup registration form
  setupRegisterForm();
  
  // Setup password reset
  setupPasswordReset();
  
  // Setup social logins
  setupSocialLogins();
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    handleAuthStateChange(event, session);
  });
  
  // Setup password visibility toggles
  setupPasswordToggle();
  
  // Setup password strength meter
  setupPasswordStrength();
}

/**
 * Refresh user session from supabase
 */
async function refreshUserSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting auth session:', error);
      return;
    }
    
    if (data?.session) {
      currentUser = data.session.user;
      notifyAuthStateChange('SIGNED_IN', data.session);
      updateUIForAuthenticatedUser();
    } else {
      currentUser = null;
      updateUIForUnauthenticatedUser();
    }
  } catch (err) {
    console.error('Unexpected error refreshing auth session:', err);
    currentUser = null;
  }
}

/**
 * Setup login form handling
 */
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember')?.checked || false;
      
      // Clear any previous errors
      clearFormErrors(loginForm);
      
      // Validate input
      let isValid = true;
      
      if (!email) {
        showFormError('email-error', 'Email is required');
        isValid = false;
      } else if (!isValidEmail(email)) {
        showFormError('email-error', 'Please enter a valid email address');
        isValid = false;
      }
      
      if (!password) {
        showFormError('password-error', 'Password is required');
        isValid = false;
      }
      
      if (!isValid) return;
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      
      try {
        // Attempt login
        const { data, error } = await supabaseAuth.signIn(email, password);
        
        if (error) throw error;
        
        // Success - redirect to dashboard
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Email not confirmed')) {
          showNotification('Please check your email to verify your account.', 'warning', 8000);
        } else if (error.message.includes('Invalid login credentials')) {
          showNotification('Invalid email or password.', 'error');
        } else {
          showNotification('Login failed: ' + error.message, 'error');
        }
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
}

/**
 * Setup registration form handling
 */
function setupRegisterForm() {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const termsAccepted = document.getElementById('terms')?.checked || false;
      
      // Clear any previous errors
      clearFormErrors(registerForm);
      
      // Validate input
      let isValid = true;
      
      if (!username) {
        showFormError('username-error', 'Username is required');
        isValid = false;
      } else if (username.length < 3) {
        showFormError('username-error', 'Username must be at least 3 characters');
        isValid = false;
      }
      
      if (!email) {
        showFormError('email-error', 'Email is required');
        isValid = false;
      } else if (!isValidEmail(email)) {
        showFormError('email-error', 'Please enter a valid email address');
        isValid = false;
      }
      
      if (!password) {
        showFormError('password-error', 'Password is required');
        isValid = false;
      } else if (password.length < 8) {
        showFormError('password-error', 'Password must be at least 8 characters');
        isValid = false;
      }
      
      if (!confirmPassword) {
        showFormError('confirm-password-error', 'Please confirm your password');
        isValid = false;
      } else if (password !== confirmPassword) {
        showFormError('confirm-password-error', 'Passwords do not match');
        isValid = false;
      }
      
      if (!termsAccepted) {
        showFormError('terms-error', 'You must accept the Terms of Service and Privacy Policy');
        isValid = false;
      }
      
      if (!isValid) return;
      
      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
      
      try {
        // Create user account
        const { data, error } = await supabaseAuth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: username
            }
          }
        });
        
        if (error) throw error;
        
        // User created successfully
        if (data.user) {
          if (data.session) {
            // User is automatically signed in
            showNotification('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1500);
          } else {
            // Email confirmation required
            showNotification('Account created! Please check your email to confirm your account.', 'success', 10000);
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already registered')) {
          showNotification('This email is already registered. Please try logging in.', 'error');
        } else {
          showNotification('Registration failed: ' + error.message, 'error');
        }
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
}

/**
 * Setup password reset functionality
 */
function setupPasswordReset() {
  const resetForm = document.getElementById('reset-password-form');
  const resetSubmitForm = document.getElementById('reset-password-submit-form');
  
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      
      if (!email || !isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = resetForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      
      try {
        const { error } = await supabaseAuth.resetPassword(email);
        
        if (error) throw error;
        
        showNotification('Password reset link sent to your email', 'success', 10000);
      } catch (error) {
        console.error('Reset password error:', error);
        showNotification('Error sending reset link: ' + error.message, 'error');
      }
      
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    });
  }
  
  if (resetSubmitForm) {
    resetSubmitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (!password || password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = resetSubmitForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
      
      try {
        const { error } = await supabaseAuth.updatePassword(password);
        
        if (error) throw error;
        
        showNotification('Password updated successfully', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } catch (error) {
        console.error('Update password error:', error);
        showNotification('Error updating password: ' + error.message, 'error');
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
}

/**
 * Setup social login providers
 */
function setupSocialLogins() {
  // Google login
  const googleLoginBtn = document.getElementById('google-login');
  const googleSignupBtn = document.getElementById('google-signup');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      loginWithProvider('google');
    });
  }
  
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', () => {
      loginWithProvider('google');
    });
  }
  
  // Facebook login
  const facebookLoginBtn = document.getElementById('facebook-login');
  const facebookSignupBtn = document.getElementById('facebook-signup');
  
  if (facebookLoginBtn) {
    facebookLoginBtn.addEventListener('click', () => {
      loginWithProvider('facebook');
    });
  }
  
  if (facebookSignupBtn) {
    facebookSignupBtn.addEventListener('click', () => {
      loginWithProvider('facebook');
    });
  }
  
  // GitHub login
  const githubLoginBtn = document.getElementById('github-login');
  const githubSignupBtn = document.getElementById('github-signup');
  
  if (githubLoginBtn) {
    githubLoginBtn.addEventListener('click', () => {
      loginWithProvider('github');
    });
  }
  
  if (githubSignupBtn) {
    githubSignupBtn.addEventListener('click', () => {
      loginWithProvider('github');
    });
  }
}

/**
 * Handle login with third-party provider
 * @param {string} provider - Provider name (google, facebook, etc.)
 */
async function loginWithProvider(provider) {
  try {
    const { data, error } = await supabaseAuth.signInWithProvider(provider);
    
    if (error) throw error;
    
    // Success - the page will be redirected by Supabase
  } catch (error) {
    console.error(`${provider} login error:`, error);
    showNotification(`${provider} login failed: ${error.message}`, 'error');
  }
}

/**
 * Set up password visibility toggle
 */
function setupPasswordToggle() {
  const toggles = document.querySelectorAll('.password-toggle');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordInput = this.parentElement.querySelector('input');
      const icon = this.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

/**
 * Set up password strength meter
 */
function setupPasswordStrength() {
  const passwordInput = document.getElementById('password');
  const strengthMeter = document.querySelector('.strength-meter-fill');
  const strengthText = document.getElementById('strength-text');
  
  if (passwordInput && strengthMeter && strengthText) {
    passwordInput.addEventListener('input', function() {
      const strength = calculatePasswordStrength(this.value);
      
      strengthMeter.style.width = `${strength.percentage}%`;
      strengthMeter.setAttribute('data-strength', strength.score);
      strengthText.textContent = strength.text;
    });
  }
}

/**
 * Calculate password strength
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength details
 */
function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, text: 'Weak', percentage: 0 };
  }
  
  let score = 0;
  
  // Length check (up to 3 points)
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Character type checks
  if (/[A-Z]/.test(password)) score++;  // Uppercase
  if (/[a-z]/.test(password)) score++;  // Lowercase
  if (/[0-9]/.test(password)) score++;  // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score++;  // Special chars
  
  // Calculate percentage (max score is 7)
  const percentage = Math.min(100, Math.round((score / 7) * 100));
  
  // Map score to strength category
  let text = 'Weak';
  if (score >= 6) text = 'Very Strong';
  else if (score >= 5) text = 'Strong';
  else if (score >= 4) text = 'Good';
  else if (score >= 3) text = 'Fair';
  
  return { score, text, percentage };
}

/**
 * Handle auth state change
 * @param {string} event - Auth event
 * @param {Object} session - User session
 */
function handleAuthStateChange(event, session) {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session) {
    currentUser = session.user;
    notifyAuthStateChange(event, session);
    updateUIForAuthenticatedUser();
  } 
  else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    currentUser = null;
    notifyAuthStateChange(event, null);
    updateUIForUnauthenticatedUser();
  }
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  // Update navigation
  const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
  const logoutLinks = document.querySelectorAll('#logout-btn, #mobile-logout-btn');
  const authLinks = document.querySelectorAll('.auth-only');
  const guestLinks = document.querySelectorAll('.guest-only');
  
  // Show/hide appropriate UI elements
  authLinks.forEach(el => el.style.display = 'block');
  guestLinks.forEach(el => el.style.display = 'none');
  loginLinks.forEach(el => el.style.display = 'none');
  logoutLinks.forEach(el => el.style.display = 'block');
  
  // Update profile info if user data is available
  if (currentUser) {
    const usernameElements = document.querySelectorAll('.profile-username, #profile-username');
    const emailElements = document.querySelectorAll('.profile-email, #profile-email');
    const avatarElements = document.querySelectorAll('.avatar, #profile-avatar');
    
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User';
    const email = currentUser.email || '';
    const avatarUrl = currentUser.user_metadata?.avatar_url || 'img/avatars/default.jpg';
    
    usernameElements.forEach(el => {
      if (el) el.textContent = username;
    });
    
    emailElements.forEach(el => {
      if (el) el.textContent = email;
    });
    
    avatarElements.forEach(el => {
      if (el) el.src = avatarUrl;
    });
  }
}

/**
 * Update UI for unauthenticated user (guest)
 */
function updateUIForUnauthenticatedUser() {
  // Update navigation
  const loginLinks = document.querySelectorAll('a[href="login.html"], a[href="register.html"]');
  const logoutLinks = document.querySelectorAll('#logout-btn, #mobile-logout-btn');
  const authLinks = document.querySelectorAll('.auth-only');
  const guestLinks = document.querySelectorAll('.guest-only');
  
  // Show/hide appropriate UI elements
  authLinks.forEach(el => el.style.display = 'none');
  guestLinks.forEach(el => el.style.display = 'block');
  loginLinks.forEach(el => el.style.display = 'block');
  logoutLinks.forEach(el => el.style.display = 'none');
  
  // Redirect from protected pages
  const isProtectedPage = document.body.classList.contains('protected-page');
  if (isProtectedPage && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
  }
}

/**
 * Logout the current user
 */
async function logoutUser() {
  try {
    const { error } = await supabaseAuth.signOut();
    
    if (error) throw error;
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Logout failed: ' + error.message, 'error');
  }
}

/**
 * Get the current authenticated user
 * @returns {Object|null} User object or null if not authenticated
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Register a callback for auth state changes
 * @param {Function} callback - Function to call on auth state change
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChange(callback) {
  if (typeof callback !== 'function') return () => {};
  
  authStateChangeCallbacks.push(callback);
  
  // Execute callback with current state
  if (currentUser) {
    callback('SIGNED_IN', { user: currentUser });
  } else {
    callback('SIGNED_OUT', null);
  }
  
  // Return unsubscribe function
  return () => {
    const index = authStateChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      authStateChangeCallbacks.splice(index, 1);
    }
  };
}

/**
 * Notify all registered callbacks of auth state change
 * @param {string} event - Auth event
 * @param {Object} session - User session
 */
function notifyAuthStateChange(event, session) {
  authStateChangeCallbacks.forEach(callback => {
    try {
      callback(event, session);
    } catch (err) {
      console.error('Error in auth state change callback:', err);
    }
  });
}

/**
 * Show form error message
 * @param {string} elementId - Error element ID
 * @param {string} message - Error message
 */
function showFormError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add error class to the related input
    const inputField = errorElement.closest('.form-group')?.querySelector('input');
    if (inputField) {
      inputField.classList.add('is-invalid');
    }
  }
}

/**
 * Clear all form errors
 * @param {HTMLFormElement} form - Form element
 */
function clearFormErrors(form) {
  if (!form) return;
  
  const errorElements = form.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  
  const invalidInputs = form.querySelectorAll('.is-invalid');
  invalidInputs.forEach(input => {
    input.classList.remove('is-invalid');
  });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export auth functions
export {
  initAuth,
  getCurrentUser,
  logoutUser,
  onAuthStateChange
};

