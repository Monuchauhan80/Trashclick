// Home page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations when page loads
    animateStatCounters();
    animateFeatureCards();
    initParallaxEffect();

    // Highlight active nav link based on current page
    highlightActiveNavLink();
});

// Animate statistic counters when they come into view
function animateStatCounters() {
    const statElements = document.querySelectorAll('.stat-number');
    
    // Use Intersection Observer to detect when stats are visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statElements.forEach(statElement => {
        observer.observe(statElement);
    });
}

// Helper function to animate counting up to a target number
function animateCounter(element, target) {
    let current = 0;
    const duration = 2000; // ms
    const increment = target / (duration / 16); // Approximately 60fps
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            clearInterval(timer);
            current = target;
        }
        
        // Format with commas for thousands
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Animate feature cards with staggered fade-in
function animateFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const delay = parseInt(card.getAttribute('data-index')) * 150;
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, delay);
                
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        // Set initial state for animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        observer.observe(card);
    });
}

// Create parallax scrolling effect for hero section
function initParallaxEffect() {
    const heroSection = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image img');
    const heroContent = document.querySelector('.hero-content');
    
    if (!heroSection || !heroImage) return;
    
    // Set initial state for hero content animation
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(30px)';
    
    // Animate hero content on page load
    setTimeout(() => {
        heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 300);
    
    // Add parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        if (scrollPosition < heroSection.offsetHeight) {
            const translateY = scrollPosition * 0.2;
            heroImage.style.transform = `translateY(${translateY}px)`;
        }
    });
}

// Highlight active link in navbar based on current page
function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-menu a, .mobile-menu-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
} 