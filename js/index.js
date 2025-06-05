/* Index Page Specific JavaScript */

// Home page specific initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize only home page components
  initHomePage();
});

async function initHomePage() {
  try {
    // Initialize hero stats and ticker
    await Promise.all([
      dashboard.renderHeroStats(),
      dashboard.startLiveTicker(),
      renderTopCryptosPreview()
    ]);
    
    // Initialize advanced hero animations
    initHeroAnimations();
  } catch (error) {
    console.error('Error initializing home page:', error);
  }
}

function initHeroAnimations() {
  // Create floating particles dynamically
  createFloatingParticles();
  
  // Add mouse follow effect
  addMouseFollowEffect();
  
  // Initialize dynamic price bubbles
  animatePriceBubbles();
  
  // Add intersection observer for stats animation
  observeStatsAnimation();
  
  // Add responsive handlers
  addResponsiveHandlers();
}

function addResponsiveHandlers() {
  let resizeTimeout;
  
  // Handle window resize with debouncing
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      handleResponsiveChanges();
    }, 250);
  });
  
  // Handle orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      handleResponsiveChanges();
    }, 100);
  });
}

function handleResponsiveChanges() {
  // Recreate particles with new responsive count
  const particlesContainer = document.querySelector('.floating-particles');
  if (particlesContainer) {
    const existingParticles = particlesContainer.querySelectorAll('.dynamic-particle');
    existingParticles.forEach(particle => particle.remove());
    createFloatingParticles();
  }
  
  // Update animation performance based on screen size
  updateAnimationPerformance();
  
  // Reset orb positions
  const orbs = document.querySelectorAll('.gradient-orb');
  orbs.forEach(orb => {
    orb.style.transform = 'translate(0px, 0px)';
  });
}

function updateAnimationPerformance() {
  const isMobile = window.innerWidth <= 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (isMobile || prefersReducedMotion) {
    // Reduce animation complexity on mobile
    document.documentElement.style.setProperty('--animation-play-state', 
      prefersReducedMotion ? 'paused' : 'running');
  }
}

function createFloatingParticles() {
  const particlesContainer = document.querySelector('.floating-particles');
  if (!particlesContainer) return;
  
  // Responsive particle count based on screen size
  let particleCount = 15;
  if (window.innerWidth <= 480) {
    particleCount = 8; // Fewer particles on mobile
  } else if (window.innerWidth <= 768) {
    particleCount = 10; // Moderate for tablets
  } else if (window.innerWidth >= 1440) {
    particleCount = 20; // More for large screens
  }
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    particleCount = 0; // No particles for reduced motion
  }
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'dynamic-particle';
    
    // Responsive particle size
    const baseSize = window.innerWidth <= 480 ? 3 : 4;
    const size = Math.random() * baseSize + 2;
    
    // Responsive animation duration
    const baseDuration = window.innerWidth <= 768 ? 8 : 6;
    const duration = Math.random() * 4 + baseDuration;
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? 'var(--accent-color)' : '#007bff'};
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: floatParticles ${duration}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
      will-change: transform;
    `;
    particlesContainer.appendChild(particle);
  }
}

function addMouseFollowEffect() {
  const heroSection = document.querySelector('.hero-banner');
  if (!heroSection) return;
  
  let mouseX = 0, mouseY = 0;
  
  // Only add mouse follow on non-touch devices
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    heroSection.addEventListener('mousemove', (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
      
      // Update gradient orbs position based on mouse
      const orbs = document.querySelectorAll('.gradient-orb');
      orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.1;
        const moveX = (mouseX - 0.5) * 50 * speed;
        const moveY = (mouseY - 0.5) * 50 * speed;
        orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    });
  }
  
  // Add touch interaction for mobile
  if ('ontouchstart' in window) {
    let touchTimeout;
    heroSection.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = heroSection.getBoundingClientRect();
      mouseX = (touch.clientX - rect.left) / rect.width;
      mouseY = (touch.clientY - rect.top) / rect.height;
      
      // Subtle movement on touch
      const orbs = document.querySelectorAll('.gradient-orb');
      orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05; // Reduced speed for touch
        const moveX = (mouseX - 0.5) * 20 * speed;
        const moveY = (mouseY - 0.5) * 20 * speed;
        orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
      
      // Reset position after touch ends
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        orbs.forEach(orb => {
          orb.style.transform = 'translate(0px, 0px)';
        });
      }, 2000);
    });
  }
}

function animatePriceBubbles() {
  const bubbles = document.querySelectorAll('.price-bubble');
  if (!bubbles.length) return;
  
  const cryptoPrices = [
    '$67,234', '$3,245', '$0.52', '$98.45', '$1.23', '$156.78'
  ];
  
  bubbles.forEach((bubble, index) => {
    setInterval(() => {
      const randomPrice = cryptoPrices[Math.floor(Math.random() * cryptoPrices.length)];
      bubble.textContent = randomPrice;
      bubble.style.animation = 'none';
      bubble.offsetHeight; // Trigger reflow
      bubble.style.animation = `bubbleFloat 4s ease-in-out infinite`;
    }, 3000 + index * 1000);
  });
}

function observeStatsAnimation() {
  const stats = document.querySelectorAll('.hero-stat');
  if (!stats.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'scaleIn 0.8s ease-out forwards';
      }
    });
  }, { threshold: 0.5 });
  
  stats.forEach(stat => observer.observe(stat));
}

// Add button click animations
document.addEventListener('DOMContentLoaded', () => {
  const animatedButtons = document.querySelectorAll('.animated-button');
  
  animatedButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = this.querySelector('.btn-ripple');
      if (ripple) {
        ripple.style.animation = 'none';
        ripple.offsetHeight; // Trigger reflow
        ripple.style.animation = 'btnRipple 0.6s ease-out';
      }
    });
  });
});

// Add ripple keyframe dynamically
const addRippleKeyframe = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes btnRipple {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: 300px; height: 300px; opacity: 0; }
    }
  `;
  document.head.appendChild(style);
};

// Initialize ripple animation
addRippleKeyframe();

async function renderTopCryptosPreview() {
  const tbody = document.getElementById('topCryptosPreview');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

  try {
    const cryptos = await cryptoAPI.getTopCryptos(5); // Get top 5
    
    tbody.innerHTML = cryptos.map((crypto, index) => {
      const change24h = crypto.price_change_percentage_24h || 0;
      const changeClass = change24h >= 0 ? 'positive' : 'negative';
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div class="coin-info">
              <img src="${crypto.image}" alt="${crypto.name}" class="coin-icon">
              <div>
                <div class="coin-name">${crypto.name}</div>
                <div class="coin-symbol">${crypto.symbol.toUpperCase()}</div>
              </div>
            </div>
          </td>
          <td>${cryptoAPI.formatPrice(crypto.current_price)}</td>
          <td class="price-change ${changeClass}">
            ${cryptoAPI.formatPercentage(change24h)}
          </td>
          <td>${cryptoAPI.formatLargeNumber(crypto.market_cap)}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error rendering top cryptos preview:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading data</td></tr>';
  }
}

// Utility functions
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Load saved theme - Default to dark theme
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