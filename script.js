/**
 * Calvin Wanyama Portfolio - JavaScript
 * Handles all interactivity including:
 * - Loading screen
 * - Mobile navigation
 * - Dark mode toggle
 * - Smooth scrolling
 * - Scroll animations
 * - Header sticky behavior
 * - Back to top button
 * - Form handling
 */

function loadGoogleIdScript() {
    if (document.getElementById('google-identity-script')) return;
    const s = document.createElement('script');
    s.id = 'google-identity-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
}

document.addEventListener('DOMContentLoaded', function() {
    // Load Google sign-in script across the site
    loadGoogleIdScript();
    // Initialize all functions
    initLoader();
    initNavigation();
    initDarkMode();
    initScrollAnimations();
    initStickyHeader();
    initBackToTop();
    initSmoothScroll();
    initContactForm();
    renderProjects();          // new function below
    initializeGoogleAuth();

    // handle hidden admin link click to open floating login modal
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        adminLink.addEventListener('click', e => {
            e.preventDefault();
            showAdminModal();
        });
    }
});

// -----------------------------
// Project listing helpers
// -----------------------------

async function renderProjects(filterType = 'all') {
    try {
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error('Could not load projects.json');
        const projects = await response.json();
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = ''; // clear existing

        const filtered = projects.filter(p => filterType === 'all' || p.type === filterType);

        filtered.forEach(p => {
            const card = document.createElement('article');
            card.className = 'project-card';

            const liveLink = p.live ? `<a href="${p.live}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="View live project"><i class="fas fa-external-link-alt"></i></a>` : '';
            const repoLink = p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener noreferrer" class="project-link" aria-label="View source code"><i class="fab fa-github"></i></a>` : '';

            card.innerHTML = `
                <div class="project-image">
                    <div class="project-placeholder">
                        <i class="fas fa-${p.status === 'development' ? 'tools' : 'laptop-code'}"></i>
                    </div>
                    <div class="project-overlay">
                        ${liveLink}
                        ${repoLink}
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${p.name}</h3>
                    <p class="project-description">${p.description}</p>
                    <div class="project-tech">
                        <span class="tech-tag">${p.type}</span>
                        <span class="tech-tag status-${p.status}">${p.status.replace(/^./, s=>s.toUpperCase())}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// filter dropdown logic
const filterSelect = document.getElementById('filterType');
if (filterSelect) {
    filterSelect.addEventListener('change', function() {
        renderProjects(this.value);
    });
}

// on any page we might want contact info
async function loadContactInfo() {
    try {
        const info = await fetch('contact.json').then(r=>r.json());
        document.querySelectorAll('.contact-item a, .contact-item span').forEach(el=>{
            if (el.href && el.href.startsWith('mailto:')) el.href = 'mailto:'+info.email;
        });
        const emailEl = document.querySelector('.contact-item a[href^="mailto"]');
        if (emailEl) emailEl.textContent = info.email;
        const phoneEl = document.querySelector('.contact-item a[href^="tel"]');
        if (phoneEl) phoneEl.textContent = info.phone;
        const whatsappEl = document.querySelector('.contact-item a[href*="wa.link"]');
        if (whatsappEl) whatsappEl.href = info.whatsapp;
        const locationEl = document.querySelector('.contact-item span');
        if (locationEl) locationEl.textContent = info.location;
    } catch (e) {
        console.error('failed to load contact', e);
    }
}

loadContactInfo();

// hidden admin access: type 'admin' or press ctrl+shift+a to attempt quick login
let keyBuffer = '';
let adminMode = 'login'; // login or signup

// modal helper --------------------------------------------------------------
function createAdminModal() {
    if (document.getElementById('admin-modal-overlay')) return; // already added
    const overlay = document.createElement('div');
    overlay.id = 'admin-modal-overlay';
    overlay.className = 'admin-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <button class="modal-close" aria-label="Close">×</button>
        <h2 id="admin-modal-title">Admin Login</h2>
        <p class="modal-info" id="admin-modal-info">Checking admin status...</p>
        <form id="admin-modal-form">
            <input type="password" id="admin-modal-pwd" placeholder="Password" required autofocus />
            <button type="submit" class="btn btn-primary">Login</button>
            <div class="modal-divider">or</div>
            <button type="button" id="google-auth-btn" class="btn btn-google">Continue with Google</button>
        </form>
        <p class="modal-error" id="admin-modal-error">Invalid password</p>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // cancel/close handler
    modal.querySelector('.modal-close').addEventListener('click', hideAdminModal);
    overlay.addEventListener('click', e => {
        if (e.target === overlay) hideAdminModal();
    });

    function renderAuthForm(exists) {
        const form = document.getElementById('admin-modal-form');
        const title = document.getElementById('admin-modal-title');
        const info = document.getElementById('admin-modal-info');
        const error = document.getElementById('admin-modal-error');

        if (error) {
            error.style.display = 'none';
            error.textContent = 'Invalid password';
        }

        if (exists) {
            adminMode = 'login';
            title.textContent = 'Admin Login';
            if (info) info.textContent = 'Enter your existing admin password to continue.';
            form.innerHTML = `
                <input type="password" id="admin-modal-pwd" placeholder="Password" required autofocus />
                <button type="submit" class="btn btn-primary">Login</button>
                <div class="modal-divider">or</div>
                <button type="button" id="google-auth-btn" class="btn btn-google">Continue with Google</button>
                <button type="button" id="admin-switch-mode" class="btn btn-outline">Reset / Change password</button>
            `;
        } else {
            adminMode = 'signup';
            title.textContent = 'Create Admin Password';
            if (info) info.textContent = 'No admin password set currently. Create one and you will be logged in automatically.';
            form.innerHTML = `
                <input type="password" id="admin-modal-pwd" placeholder="Password" required autofocus />
                <input type="password" id="admin-modal-confirm" placeholder="Confirm password" required />
                <button type="submit" class="btn btn-primary">Create</button>
                <div class="modal-divider">or</div>
                <button type="button" id="google-auth-btn" class="btn btn-google">Continue with Google</button>
            `;
        }

        attachModalSubmitHandler();
        attachGoogleButton();

        const switchBtn = document.getElementById('admin-switch-mode');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => renderResetForm());
        }
    }

    function renderResetForm() {
        adminMode = 'reset';
        const form = document.getElementById('admin-modal-form');
        const title = document.getElementById('admin-modal-title');
        const info = document.getElementById('admin-modal-info');
        const error = document.getElementById('admin-modal-error');

        if (error) {
            error.style.display = 'none';
            error.textContent = 'Invalid password';
        }

        title.textContent = 'Reset Admin Password';
        if (info) info.textContent = 'Enter current password and new password to update.';
        form.innerHTML = `
            <input type="password" id="admin-modal-current" placeholder="Current password" required autofocus />
            <input type="password" id="admin-modal-pwd" placeholder="New password" required />
            <input type="password" id="admin-modal-confirm" placeholder="Confirm new password" required />
            <button type="submit" class="btn btn-primary">Reset password</button>
            <div class="modal-divider">or</div>
            <button type="button" id="google-auth-btn" class="btn btn-google">Continue with Google</button>
            <button type="button" id="admin-switch-mode" class="btn btn-outline">Back to login</button>
        `;

        attachModalSubmitHandler();
        attachGoogleButton();

        const switchBtn = document.getElementById('admin-switch-mode');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => renderAuthForm(true));
        }
    }

    function attachGoogleButton() {
        const googleBtn = document.getElementById('google-auth-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                if (window.google) {
                    google.accounts.id.prompt();
                } else {
                    alert('Google Identity Services is not loaded yet. Please reload the page and try again.');
                }
            });
        }
    }

    // default content while checking password endpoint
    renderAuthForm(true);

    fetch('/api/password')
        .then(r => r.ok ? r.json() : {exists: true})
        .then(({exists}) => renderAuthForm(Boolean(exists)))
        .catch(() => renderAuthForm(true));

    // allow escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.style.display==='flex') hideAdminModal();
    });
}

// separate handler attachment so we can change behaviour
function attachModalSubmitHandler() {
    const form = document.getElementById('admin-modal-form');
    form.onsubmit = async e => {
        e.preventDefault();

        const errorEl = document.getElementById('admin-modal-error');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = 'Invalid password';
        }

        if (adminMode === 'login') {
            const pwd = document.getElementById('admin-modal-pwd').value;
            const res = await fetch('/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({pwd})
            });

            if (res.ok) {
                window.location.href = '/admin.html';
                return;
            }

            if (errorEl) {
                errorEl.textContent = 'Wrong password. Please try again or reset if needed.';
                errorEl.style.display = 'block';
            }
            return;
        }

        if (adminMode === 'signup') {
            const pwd = document.getElementById('admin-modal-pwd').value;
            const confirm = document.getElementById('admin-modal-confirm').value;
            if (pwd !== confirm) {
                if (errorEl) {
                    errorEl.textContent = 'Passwords must match';
                    errorEl.style.display = 'block';
                }
                return;
            }

            const res = await fetch('/api/password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({pwd})
            });

            if (res.ok) {
                // After first-time creation, switch to login mode instead of instant admin redirect.
                renderAuthForm(true);
                if (document.getElementById('admin-modal-info')) {
                    document.getElementById('admin-modal-info').textContent = 'Password created! Please login with your new password.';
                }
                return;
            }

            if (res.status === 403) {
                if (errorEl) {
                    errorEl.textContent = 'Password already exists. Use login or reset password.';
                    errorEl.style.display = 'block';
                }
                return;
            }

            if (errorEl) {
                errorEl.textContent = 'Failed to set password. Please try again.';
                errorEl.style.display = 'block';
            }
            return;
        }

        if (adminMode === 'reset') {
            const current = document.getElementById('admin-modal-current').value;
            const pwd = document.getElementById('admin-modal-pwd').value;
            const confirm = document.getElementById('admin-modal-confirm').value;

            if (pwd !== confirm) {
                if (errorEl) {
                    errorEl.textContent = 'New passwords must match';
                    errorEl.style.display = 'block';
                }
                return;
            }

            // verify current password first
            const loginRes = await fetch('/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({pwd: current})
            });

            if (!loginRes.ok) {
                if (errorEl) {
                    errorEl.textContent = 'Current password incorrect.';
                    errorEl.style.display = 'block';
                }
                return;
            }

            const resetRes = await fetch('/api/password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({pwd})
            });

            if (resetRes.ok) {
                window.location.href = '/admin.html';
                return;
            }

            if (errorEl) {
                errorEl.textContent = 'Failed to reset password. Please try again later.';
                errorEl.style.display = 'block';
            }
            return;
        }
    };
}


function showAdminModal() {
    createAdminModal();
    const overlay = document.getElementById('admin-modal-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';

    setTimeout(() => {
        const pwdField = document.getElementById('admin-modal-pwd');
        if (pwdField) pwdField.focus();
    }, 100);
}

function hideAdminModal() {
    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

function initializeGoogleAuth() {
    if (!window.google) {
        console.warn('Google Identity script not loaded yet');
        return;
    }

    fetch('/api/google-config')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to load google config'))
        .then(config => {
            const GOOGLE_CLIENT_ID = config.googleClientId;
            if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_OAUTH_CLIENT_ID')) {
                throw new Error('Google Client ID not configured');
            }

            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async response => {
                    const err = document.getElementById('admin-modal-error');
                    if (!response || !response.credential) {
                        if (err) {
                            err.textContent = 'Google authentication failed. Please try again.';
                            err.style.display = 'block';
                        }
                        return;
                    }

                    try {
                        const res = await fetch('/api/google-login', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({credential: response.credential})
                        });

                        if (res.ok) {
                            window.location.href = '/admin.html';
                            return;
                        }

                        const body = await res.json().catch(() => ({}));
                        if (err) {
                            err.textContent = body.error || 'Google login failed, please try again.';
                            err.style.display = 'block';
                        }
                    } catch (e) {
                        if (err) {
                            err.textContent = 'Server error during Google login. Try again later.';
                            err.style.display = 'block';
                        }
                        console.error('Google login error', e);
                    }
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Optional: this can trigger auto selection if eligible
            google.accounts.id.prompt();
        })
        .catch((err) => {
            console.error('Google initialization failed:', err);
            const errorEl = document.getElementById('admin-modal-error');
            if (errorEl) {
                errorEl.textContent = 'Google identity setup failed. Check your client ID config.';
                errorEl.style.display = 'block';
            }
        });
}

function tryQuickLogin() {
    showAdminModal();
}

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='a') {
        tryQuickLogin();
        return;
    }
    // collect letters and check for admin / amin / login typed as a trigger
    keyBuffer += e.key;
    const lower = keyBuffer.toLowerCase();
    if (lower.endsWith('admin') || lower.endsWith('amin') || lower.endsWith('login')) {
        keyBuffer = '';
        tryQuickLogin();
    }
    if (keyBuffer.length > 12) keyBuffer = keyBuffer.slice(-12);
});

// subtle parallax for hero background shapes
const hero = document.querySelector('.hero');
if (hero) {
    hero.addEventListener('mousemove', e => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        document.querySelectorAll('.hero-bg-shape, .hero-bg-shape-2').forEach(el => {
            el.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    hero.addEventListener('mouseleave', () => {
        document.querySelectorAll('.hero-bg-shape, .hero-bg-shape-2').forEach(el => {
            el.style.transform = '';
        });
    });
}

// CV expand/minimize
const cvSection = document.querySelector('.cv-section');
if (cvSection) {
    const toggle = cvSection.querySelector('.cv-toggle');
    toggle.addEventListener('click', () => {
        const expanded = cvSection.classList.toggle('expanded');
        toggle.innerHTML = expanded ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        toggle.setAttribute('aria-label', expanded ? 'Minimize CV' : 'Expand CV');
    });
}

// 3D tilt on project cards
document.addEventListener('mousemove', e => {
    document.querySelectorAll('.project-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const tiltX = dy / rect.height * 10;
        const tiltY = -dx / rect.width * 10;
        card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });
});

// reset tilt when leaving a card
document.addEventListener('mouseleave', e => {
    if (e.target.classList && e.target.classList.contains('project-card')) {
        e.target.style.transform = '';
    }
});

/**
 * Loading Screen
 * Hides the loader after page load
 */
function initLoader() {
    const loader = document.getElementById('loader');
    
    window.addEventListener('load', function() {
        setTimeout(function() {
            loader.classList.add('hidden');
        }, 1500);
    });
}

/**
 * Mobile Navigation
 * Toggle hamburger menu and mobile nav
 */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Dark Mode Toggle
 * Switch between light and dark themes
 */
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

/**
 * Scroll Animations
 * Animate elements when they come into viewport
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.project-card, .skill-item, .skill-icon-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(function(element) {
        element.classList.add('fade-in');
        observer.observe(element);
    });
}

/**
 * Sticky Header
 * Make header sticky on scroll
 */
function initStickyHeader() {
    const header = document.getElementById('header');
    const heroSection = document.querySelector('.hero');
    
    if (!header || !heroSection) return;
    
    const heroBottom = heroSection.offsetHeight;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/**
 * Back to Top Button
 * Show/hide button based on scroll position
 */
function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    
    if (!backToTop) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Smooth Scroll
 * Enhanced smooth scrolling for anchor links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                updateActiveNavLink(targetId);
            }
        });
    });
    
    // Update active nav link on scroll
    function updateActiveNavLink(targetId) {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(function(link) {
            link.classList.remove('active');
            
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
            }
        });
    }
    
    // Update active nav link based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(function(section) {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                updateActiveNavLink('#' + sectionId);
            }
        });
    });
}

/**
 * Contact Form Handling
 * Form validation and submission feedback
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Basic validation
        if (!validateForm(data)) {
            return;
        }
        
        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Simulate API call (replace with actual endpoint)
        setTimeout(function() {
            // Show success message
            showNotification('Message sent successfully!', 'success');
            
            // Reset form
            form.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
    
    function validateForm(data) {
        // Check required fields
        for (const key in data) {
            if (!data[key].trim()) {
                showNotification('Please fill in all fields', 'error');
                return false;
            }
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        return true;
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + '"></i> ' + message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(function() {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(function() {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

/**
 * Skill Bar Animation
 * Animate skill progress bars when visible
 */
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0';
                setTimeout(function() {
                    entry.target.style.width = width;
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    skillBars.forEach(function(bar) {
        observer.observe(bar);
    });
}

// Initialize skill bars
initSkillBars();

/**
 * Add CSS animations for notifications
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

