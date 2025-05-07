/**
 * Animations module for TrashClick
 * Contains reusable animation functions and effects
 */

/**
 * Animate a sequence of elements with a staggered delay
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} animationClass - CSS class that defines the animation
 * @param {number} delay - Delay between animations in milliseconds
 * @param {Function} callback - Optional callback after all animations complete
 */
function animateSequence(elements, animationClass, delay = 100, callback) {
  if (!elements || elements.length === 0) return;
  
  const elementArray = Array.from(elements);
  let animationEnd = false;
  let completedCount = 0;
  
  // Set up animation end tracking
  const trackAnimationEnd = (e) => {
    // Only track the specific animation we're applying
    if (e.target.dataset.trackingAnimation !== animationClass) return;
    
    // Remove animation class after it completes
    e.target.classList.remove(animationClass);
    e.target.removeAttribute('data-tracking-animation');
    
    completedCount++;
    
    // Call callback when all animations are complete
    if (callback && completedCount >= elementArray.length) {
      callback();
    }
  };
  
  // Add animation with staggered delay
  elementArray.forEach((element, index) => {
    // Skip if element is not valid
    if (!element || !(element instanceof Element)) return;
    
    // Add tracking attribute
    element.dataset.trackingAnimation = animationClass;
    
    // Listen for animation end
    element.addEventListener('animationend', trackAnimationEnd, { once: true });
    
    // Start animation after delay
    setTimeout(() => {
      element.classList.add(animationClass);
    }, index * delay);
  });
}

/**
 * Animate counter from start to end value
 * @param {HTMLElement} element - Element to update with counter value
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} formatter - Optional formatter function for the displayed value
 * @param {Function} callback - Optional callback after animation completes
 */
function animateCounter(element, start, end, duration = 2000, formatter = null, callback = null) {
  if (!element) return;
  
  // Set default formatter if none provided
  formatter = formatter || ((value) => Math.round(value).toLocaleString());
  
  // Calculate increment per frame
  const startTime = performance.now();
  const difference = end - start;
  
  // Animation function
  function updateCounter(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Use easing function for smooth animation
    const easedProgress = easeOutQuad(progress);
    const currentValue = start + difference * easedProgress;
    
    // Update element text
    element.textContent = formatter(currentValue);
    
    // Continue animation or finish
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      // Ensure final value is exact
      element.textContent = formatter(end);
      
      // Call callback if provided
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }
  
  // Start animation
  requestAnimationFrame(updateCounter);
}

/**
 * Animate progress bar from 0 to target percentage
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {number} targetPercent - Target percentage (0-100)
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} callback - Optional callback after animation completes
 */
function animateProgressBar(progressBar, targetPercent, duration = 1000, callback = null) {
  if (!progressBar) return;
  
  // Ensure target is between 0-100
  targetPercent = Math.max(0, Math.min(100, targetPercent));
  
  // Set initial width if not already set
  if (!progressBar.style.width) {
    progressBar.style.width = '0%';
  }
  
  // Get starting width
  const startWidth = parseFloat(progressBar.style.width) || 0;
  const difference = targetPercent - startWidth;
  
  // Animation variables
  const startTime = performance.now();
  
  // Animation function
  function updateProgress(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Use easing function for smooth animation
    const easedProgress = easeOutQuad(progress);
    const currentWidth = startWidth + difference * easedProgress;
    
    // Update width
    progressBar.style.width = `${currentWidth}%`;
    
    // Continue animation or finish
    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      // Ensure final width is exact
      progressBar.style.width = `${targetPercent}%`;
      
      // Call callback if provided
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }
  
  // Start animation
  requestAnimationFrame(updateProgress);
}

/**
 * Animate element entrance with fade and translation
 * @param {HTMLElement} element - Element to animate
 * @param {string} direction - Direction ('up', 'down', 'left', 'right')
 * @param {number} distance - Distance to translate in pixels
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} delay - Delay before animation starts in milliseconds
 */
function animateEntrance(element, direction = 'up', distance = 20, duration = 500, delay = 0) {
  if (!element) return;
  
  // Save original styles
  const originalTransition = element.style.transition;
  const originalOpacity = element.style.opacity;
  const originalTransform = element.style.transform;
  
  // Prepare animation
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
  
  // Set initial transform based on direction
  switch (direction) {
    case 'up':
      element.style.transform = `translateY(${distance}px)`;
      break;
    case 'down':
      element.style.transform = `translateY(-${distance}px)`;
      break;
    case 'left':
      element.style.transform = `translateX(${distance}px)`;
      break;
    case 'right':
      element.style.transform = `translateX(-${distance}px)`;
      break;
  }
  
  // Force reflow to ensure initial state is applied
  element.offsetHeight;
  
  // Start animation after delay
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'translate(0, 0)';
    
    // Reset styles after animation
    setTimeout(() => {
      if (originalTransition) {
        element.style.transition = originalTransition;
      } else {
        element.style.removeProperty('transition');
      }
    }, duration);
  }, delay);
}

/**
 * Pulse animation effect
 * @param {HTMLElement} element - Element to animate
 * @param {number} scale - Maximum scale factor
 * @param {number} duration - Animation duration in milliseconds
 */
function animatePulse(element, scale = 1.05, duration = 600) {
  if (!element) return;
  
  // Save original styles
  const originalTransition = element.style.transition;
  const originalTransform = element.style.transform;
  
  // Prepare animation
  element.style.transition = `transform ${duration / 2}ms ease-in-out`;
  
  // Scale up
  element.style.transform = `scale(${scale})`;
  
  // Scale back after half duration
  setTimeout(() => {
    element.style.transform = originalTransform || 'scale(1)';
    
    // Reset styles after animation
    setTimeout(() => {
      if (originalTransition) {
        element.style.transition = originalTransition;
      } else {
        element.style.removeProperty('transition');
      }
    }, duration / 2);
  }, duration / 2);
}

/**
 * Shake animation effect (for errors/invalid inputs)
 * @param {HTMLElement} element - Element to animate
 * @param {number} distance - Shake distance in pixels
 * @param {number} duration - Animation duration in milliseconds
 */
function animateShake(element, distance = 5, duration = 500) {
  if (!element) return;
  
  // Number of shakes (must be odd number)
  const shakes = 5;
  
  // Save original styles
  const originalTransition = element.style.transition;
  const originalTransform = element.style.transform;
  
  // Remove transition to make shaking immediate
  element.style.transition = 'none';
  element.style.transform = 'translateX(0)';
  
  // Force reflow to ensure initial state is applied
  element.offsetHeight;
  
  // Add shake transition
  element.style.transition = `transform ${duration}ms ease-in-out`;
  
  // Create keyframes for shake animation
  const keyframes = Array(shakes + 1).fill().map((_, i) => {
    const isEven = i % 2 === 0;
    const isFinal = i === shakes;
    const direction = isFinal ? 0 : (isEven ? distance : -distance);
    return { transform: `translateX(${direction}px)` };
  });
  
  // Run animation
  const animation = element.animate(keyframes, {
    duration: duration,
    easing: 'ease-in-out'
  });
  
  // Clean up after animation
  animation.onfinish = () => {
    element.style.transform = originalTransform || '';
    element.style.transition = originalTransition || '';
  };
}

/**
 * Fade in animation
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} callback - Optional callback after animation completes
 */
function fadeIn(element, duration = 300, callback = null) {
  if (!element) return;
  
  // Save original styles
  const originalDisplay = element.style.display;
  const originalOpacity = element.style.opacity;
  const originalTransition = element.style.transition;
  
  // Set initial state
  element.style.opacity = '0';
  element.style.display = originalDisplay === 'none' ? 'block' : originalDisplay;
  element.style.transition = `opacity ${duration}ms ease-in-out`;
  
  // Force reflow
  element.offsetHeight;
  
  // Start fade in
  element.style.opacity = '1';
  
  // Clean up and call callback
  setTimeout(() => {
    element.style.transition = originalTransition || '';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, duration);
}

/**
 * Fade out animation
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {boolean} removeFromDOM - Whether to remove element after animation
 * @param {Function} callback - Optional callback after animation completes
 */
function fadeOut(element, duration = 300, removeFromDOM = false, callback = null) {
  if (!element) return;
  
  // Save original styles
  const originalTransition = element.style.transition;
  
  // Set transition
  element.style.transition = `opacity ${duration}ms ease-in-out`;
  
  // Start fade out
  element.style.opacity = '0';
  
  // Clean up after animation
  setTimeout(() => {
    if (removeFromDOM) {
      element.remove();
    } else {
      element.style.display = 'none';
    }
    
    element.style.transition = originalTransition || '';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, duration);
}

/**
 * Slide down animation (open)
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} callback - Optional callback after animation completes
 */
function slideDown(element, duration = 300, callback = null) {
  if (!element) return;
  
  // Save original styles
  const originalHeight = element.style.height;
  const originalTransition = element.style.transition;
  const originalOverflow = element.style.overflow;
  
  // Set initial state
  element.style.display = 'block';
  element.style.height = '0px';
  element.style.overflow = 'hidden';
  element.style.transition = `height ${duration}ms ease-in-out`;
  
  // Get target height
  const targetHeight = element.scrollHeight;
  
  // Force reflow
  element.offsetHeight;
  
  // Start animation
  element.style.height = `${targetHeight}px`;
  
  // Clean up after animation
  setTimeout(() => {
    element.style.height = originalHeight || '';
    element.style.overflow = originalOverflow || '';
    element.style.transition = originalTransition || '';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, duration);
}

/**
 * Slide up animation (close)
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {boolean} removeFromDOM - Whether to remove element after animation
 * @param {Function} callback - Optional callback after animation completes
 */
function slideUp(element, duration = 300, removeFromDOM = false, callback = null) {
  if (!element) return;
  
  // Save original styles
  const originalTransition = element.style.transition;
  const originalOverflow = element.style.overflow;
  
  // Set initial state
  element.style.height = `${element.scrollHeight}px`;
  element.style.overflow = 'hidden';
  element.style.transition = `height ${duration}ms ease-in-out`;
  
  // Force reflow
  element.offsetHeight;
  
  // Start animation
  element.style.height = '0px';
  
  // Clean up after animation
  setTimeout(() => {
    if (removeFromDOM) {
      element.remove();
    } else {
      element.style.display = 'none';
    }
    
    element.style.height = '';
    element.style.overflow = originalOverflow || '';
    element.style.transition = originalTransition || '';
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, duration);
}

/**
 * Easing function: ease-out-quad
 * @param {number} x - Input value (0-1)
 * @returns {number} Eased value
 */
function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

/**
 * Easing function: ease-in-out-quad
 * @param {number} x - Input value (0-1)
 * @returns {number} Eased value
 */
function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * Easing function: ease-in-back
 * @param {number} x - Input value (0-1)
 * @returns {number} Eased value with overshoot
 */
function easeInBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * x * x * x - c1 * x * x;
}

/**
 * Easing function: ease-out-back
 * @param {number} x - Input value (0-1)
 * @returns {number} Eased value with overshoot
 */
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Apply confetti animation (for achievements/celebrations)
 * @param {number} duration - Animation duration in milliseconds
 */
function showConfetti(duration = 3000) {
  // Create canvas for confetti
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);
  
  // Set canvas dimensions
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  canvas.width = width;
  canvas.height = height;
  
  // Get canvas context
  const ctx = canvas.getContext('2d');
  
  // Confetti pieces
  const pieces = [];
  const numPieces = 100;
  
  // Create confetti pieces
  for (let i = 0; i < numPieces; i++) {
    pieces.push({
      x: Math.random() * width, // x-coordinate
      y: Math.random() * height * -1, // y-coordinate (start above screen)
      rotation: Math.random() * 360, // rotation angle
      size: Math.random() * (8 - 3) + 3, // size between 3-8
      color: `hsl(${Math.random() * 360}, 80%, 60%)`, // random color
      velocity: {
        x: Math.random() * 3 - 1.5, // horizontal velocity
        y: Math.random() * 3 + 1.5  // vertical velocity
      },
      rotationSpeed: Math.random() * 10 - 5 // rotation speed
    });
  }
  
  // Animation start time
  const startTime = performance.now();
  
  // Animation loop
  function animate(currentTime) {
    const elapsedTime = currentTime - startTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw and update confetti pieces
    pieces.forEach(piece => {
      // Update position
      piece.y += piece.velocity.y;
      piece.x += piece.velocity.x;
      
      // Update rotation
      piece.rotation += piece.rotationSpeed;
      
      // Apply gravity
      piece.velocity.y += 0.05;
      
      // Draw piece
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      ctx.restore();
      
      // Reset if off-screen
      if (piece.y > height) {
        piece.y = Math.random() * height * -1;
        piece.x = Math.random() * width;
      }
    });
    
    // Continue animation or clean up
    if (elapsedTime < duration) {
      requestAnimationFrame(animate);
    } else {
      // Fade out canvas
      fadeOut(canvas, 500, true);
    }
  }
  
  // Start animation
  requestAnimationFrame(animate);
}

// Export animation functions
export {
  animateSequence,
  animateCounter,
  animateProgressBar,
  animateEntrance,
  animatePulse,
  animateShake,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
  showConfetti,
  easeOutQuad,
  easeInOutQuad,
  easeInBack,
  easeOutBack
};

