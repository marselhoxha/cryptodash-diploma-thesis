// About page initialization
document.addEventListener('DOMContentLoaded', () => {
  initAboutPage();
  initScrollAnimations();
  initCounterAnimations();
});

async function initAboutPage() {
  try {
    const promises = [
      updateStatistics(),
      loadDataPoints()
    ];
    
    // Only add ticker if dashboard is available
    if (typeof dashboard !== 'undefined' && dashboard.startLiveTicker) {
      promises.push(dashboard.startLiveTicker());
    }
    
    await Promise.all(promises);

    console.log('✅ About page initialized');
  } catch (error) {
    console.error('❌ About page error:', error);
    // Ensure page still works even if there are errors
    console.log('📝 Continuing with fallback data');
  }
}

async function updateStatistics() {
  const totalCoinsElement = document.getElementById('totalCoins');
  
  try {
    // Check if cryptoAPI is available
    if (typeof cryptoAPI !== 'undefined' && cryptoAPI.getTopCryptos) {
      const cryptos = await cryptoAPI.getTopCryptos(100);
      if (totalCoinsElement && cryptos && cryptos.length) {
        animateCounter(totalCoinsElement, cryptos.length, '+');
        return;
      }
    }
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
  
  // Fallback: use default value
  if (totalCoinsElement) {
    animateCounter(totalCoinsElement, 100, '+');
  }
}

async function loadDataPoints() {
  try {
    // Simulate data points calculation
    const dataPointsElement = document.getElementById('dataPoints');
    if (dataPointsElement) {
      // Calculate approximate data points (coins × timeframes × data types)
      animateCounter(dataPointsElement, 1000000, 'M+');
    }
  } catch (error) {
    console.error('Error loading data points:', error);
  }
}

// FAQ Toggle functionality
function toggleFAQ(questionElement) {
  const faqItem = questionElement.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Open clicked item if it wasn't already active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// Scroll animations
function initScrollAnimations() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // If user prefers reduced motion, just show all elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    // Observe all scroll-reveal elements
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el);
    });
  } catch (error) {
    console.warn('Intersection Observer not supported, showing all elements');
    // Fallback: show all elements immediately
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      el.classList.add('revealed');
    });
  }
}

// Counter animations
function initCounterAnimations() {
  const counters = document.querySelectorAll('.hero-stat-number');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        if (!counter.dataset.animated) {
          animateCounterElement(counter);
          counter.dataset.animated = 'true';
        }
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });
}

function animateCounter(element, targetValue, suffix = '') {
  const duration = 2000; // 2 seconds
  const start = 0;
  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(start + (targetValue - start) * easeOutCubic);
    
    element.textContent = formatNumber(currentValue) + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = formatNumber(targetValue) + suffix;
    }
  }
  
  requestAnimationFrame(updateCounter);
}

function animateCounterElement(element) {
  const text = element.textContent;
  const number = parseInt(text.replace(/\D/g, ''));
  const suffix = text.replace(/[\d,]/g, '');
  
  if (!isNaN(number)) {
    animateCounter(element, number, suffix);
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Theme toggle functionality
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
  
  // Add visual feedback
  const button = document.querySelector('.theme-toggle');
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 150);
}

// Load saved theme on page load - Default to dark theme
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  
  // Ensure dark theme is default
  if (!savedTheme) {
    localStorage.setItem('theme', 'dark');
  }
  
  // Only apply light theme if explicitly saved
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    // Ensure dark theme by removing any light-theme class
    document.body.classList.remove('light-theme');
  }
});

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
  if (e.target.matches('a[href^="#"]')) {
    e.preventDefault();
    const target = document.querySelector(e.target.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
});

// Contact button interactions
document.addEventListener('DOMContentLoaded', () => {
  const contactButtons = document.querySelectorAll('.contact-btn');
  
  contactButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Add ripple effect
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = (e.clientX - button.offsetLeft) + 'px';
      ripple.style.top = (e.clientY - button.offsetTop) + 'px';
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
      
      // Show notification
      showNotification('Feature coming soon! 🚀');
    });
  });
});

// Feature card hover effects
document.addEventListener('DOMContentLoaded', () => {
  const featureCards = document.querySelectorAll('.feature-card');
  
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
});

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-color);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 500;
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Tech stack item hover effects
document.addEventListener('DOMContentLoaded', () => {
  const techItems = document.querySelectorAll('.tech-item');
  
  techItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-3px) scale(1.05)';
      item.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0) scale(1)';
      item.style.boxShadow = 'none';
    });
  });
});

// Team member card interactions
document.addEventListener('DOMContentLoaded', () => {
  const teamMembers = document.querySelectorAll('.team-member');
  
  teamMembers.forEach(member => {
    member.addEventListener('mouseenter', () => {
      const avatar = member.querySelector('.team-avatar');
      avatar.style.transform = 'scale(1.1) rotate(5deg)';
    });
    
    member.addEventListener('mouseleave', () => {
      const avatar = member.querySelector('.team-avatar');
      avatar.style.transform = 'scale(1) rotate(0deg)';
    });
  });
});

// Roadmap item animations
document.addEventListener('DOMContentLoaded', () => {
  const roadmapItems = document.querySelectorAll('.roadmap-item');
  
  const roadmapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
      }
    });
  }, { threshold: 0.3 });

  roadmapItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-50px)';
    item.style.transition = `all 0.6s ease ${index * 0.2}s`;
    roadmapObserver.observe(item);
  });
});

// Hero logo glow effect enhancement
document.addEventListener('DOMContentLoaded', () => {
  const heroLogo = document.querySelector('.hero-logo');
  
  if (heroLogo) {
    let glowIntensity = 0.3;
    let increasing = true;
    
    setInterval(() => {
      if (increasing) {
        glowIntensity += 0.01;
        if (glowIntensity >= 0.6) increasing = false;
      } else {
        glowIntensity -= 0.01;
        if (glowIntensity <= 0.3) increasing = true;
      }
      
      heroLogo.style.textShadow = `0 0 30px rgba(59, 130, 246, ${glowIntensity})`;
    }, 50);
  }
});

// Add floating particles effect to hero section
document.addEventListener('DOMContentLoaded', () => {
  const heroSection = document.querySelector('.about-hero');
  
  if (heroSection) {
    createFloatingParticles(heroSection);
  }
});

function createFloatingParticles(container) {
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
    `;
    
    // Random starting position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    container.appendChild(particle);
    
    // Animate particle
    animateParticle(particle);
  }
}

function animateParticle(particle) {
  const duration = 10000 + Math.random() * 10000; // 10-20 seconds
  const startX = parseFloat(particle.style.left);
  const startY = parseFloat(particle.style.top);
  const endX = Math.random() * 100;
  const endY = Math.random() * 100;
  
  particle.animate([
    { 
      left: startX + '%', 
      top: startY + '%',
      opacity: 0 
    },
    { 
      opacity: 0.6 
    },
    { 
      left: endX + '%', 
      top: endY + '%',
      opacity: 0 
    }
  ], {
    duration: duration,
    easing: 'ease-in-out'
  }).onfinish = () => {
    // Reset position and animate again
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    animateParticle(particle);
  };
} 