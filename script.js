// ====================================================================
// Linux Mint Cinnamon Portfolio - Enhanced JavaScript
// Designer: Anjisha Pun
// Senior Developer Optimized - Phase 1
// ====================================================================

/* ==================== CONFIGURATION ==================== */
const CONFIG = {
    github: {
        username: 'anjisha616',
        excludedRepos: ['cafe-clone', 'netflix-clone', 'starbucks-clone'],
        apiBaseUrl: 'https://api.github.com',
        cacheTimeout: 5 * 60 * 1000 // 5 minutes
    },
    widgets: {
        cpuUpdateInterval: 1000,
        ramUpdateInterval: 2000,
        cpuDataPoints: 80
    },
    animations: {
        bootScreenDuration: 2500,
        windowOpenDelay: 100,
        toastDuration: 4000
    },
    window: {
        defaultWidth: 600,
        defaultHeight: 500,
        minWidth: 400,
        minHeight: 300,
        snapThreshold: 20
    },
    storage: {
        prefix: 'portfolio_'
    }
};

/* ==================== STATE MANAGEMENT ==================== */
const State = {
    windows: [],
    nextZIndex: 100,
    activeWindow: null,
    cache: new Map(),
    
    // Window methods
    addWindow(windowData) {
        this.windows.push(windowData);
        this.emit('windowsChanged');
    },
    
    removeWindow(windowData) {
        this.windows = this.windows.filter(w => w !== windowData);
        if (this.activeWindow === windowData.element) {
            this.activeWindow = null;
        }
        this.emit('windowsChanged');
    },
    
    setActiveWindow(element) {
        this.activeWindow = element;
        this.emit('activeWindowChanged', element);
    },
    
    getNextZIndex() {
        return this.nextZIndex++;
    },
    
    // Cache methods
    setCache(key, value, ttl = CONFIG.github.cacheTimeout) {
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    },
    
    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    },
    
    // Event system
    listeners: {},
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(...args));
        }
    }
};

/* ==================== UTILITY FUNCTIONS ==================== */
const Utils = {
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Sanitize HTML to prevent XSS
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Local storage wrapper with error handling
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(CONFIG.storage.prefix + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(CONFIG.storage.prefix + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage error:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(CONFIG.storage.prefix + key);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    },
    
    // Announce to screen readers
    announceToScreenReader(message) {
        const announcer = document.getElementById('srAnnouncements');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => announcer.textContent = '', 1000);
        }
    }
};

/* ==================== TOAST NOTIFICATIONS ==================== */
const Toast = {
    show(message, type = 'info', duration = CONFIG.animations.toastDuration) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${Utils.sanitizeHTML(message)}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        Utils.announceToScreenReader(message);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

/* ==================== GITHUB API SERVICE ==================== */
const GitHubService = {
    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                
                if (response.status === 403) {
                    throw new Error('GitHub API rate limit exceeded. Please try again later.');
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    },
    
    async getUser() {
        const cacheKey = 'github_user';
        const cached = State.getCache(cacheKey);
        if (cached) return cached;
        
        const url = `${CONFIG.github.apiBaseUrl}/users/${CONFIG.github.username}`;
        const data = await this.fetchWithRetry(url);
        State.setCache(cacheKey, data);
        return data;
    },
    
    async getRepositories() {
        const cacheKey = 'github_repos';
        const cached = State.getCache(cacheKey);
        if (cached) return cached;
        
        const url = `${CONFIG.github.apiBaseUrl}/users/${CONFIG.github.username}/repos?sort=updated&per_page=100`;
        const data = await this.fetchWithRetry(url);
        
        const filtered = data
            .filter(repo => 
                !CONFIG.github.excludedRepos.includes(repo.name.toLowerCase()) && 
                !repo.fork
            )
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6);
        
        State.setCache(cacheKey, filtered);
        return filtered;
    }
};

/* ==================== INITIALIZATION ==================== */
document.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
    initClock();
    initWidgets();
    initMenu();
    initPanel();
    initKeyboardShortcuts();
    loadUserPreferences();
    
    console.log('%c🐧 Linux Mint Portfolio', 'font-size: 20px; color: #87CEEB; font-weight: bold');
    console.log('%cDesigned by Anjisha Pun', 'color: #888');
    console.log('%cEnhanced by Senior Developer', 'color: #7cb342');
});

/* ==================== BOOT SEQUENCE ==================== */
function initBootSequence() {
    const bootScreen = document.getElementById('bootScreen');
    
    setTimeout(() => {
        bootScreen.style.display = 'none';
        Utils.announceToScreenReader('System loaded successfully');
    }, CONFIG.animations.bootScreenDuration);
}

/* ==================== CLOCK ==================== */
function initClock() {
    const clockEl = document.getElementById('clock');
    
    function update() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });
        const date = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        const timeEl = clockEl.querySelector('.clock-time');
        const dateEl = clockEl.querySelector('.clock-date');
        
        if (timeEl) timeEl.textContent = time;
        if (dateEl) dateEl.textContent = date;
    }
    
    update();
    setInterval(update, 1000);
}

/* ==================== CPU & RAM WIDGETS ==================== */
function initWidgets() {
    const cpuCanvas = document.getElementById('cpuGraph');
    const cpuCtx = cpuCanvas.getContext('2d');
    const cpuData = new Array(CONFIG.widgets.cpuDataPoints).fill(0);
    
    function drawCPUGraph() {
        const width = cpuCanvas.width;
        const height = cpuCanvas.height;
        
        // Clear canvas
        cpuCtx.clearRect(0, 0, width, height);
        
        // Draw grid
        cpuCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        cpuCtx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            cpuCtx.beginPath();
            cpuCtx.moveTo(0, y);
            cpuCtx.lineTo(width, y);
            cpuCtx.stroke();
        }
        
        // Draw CPU line
        cpuCtx.strokeStyle = '#87CEEB';
        cpuCtx.lineWidth = 2;
        cpuCtx.beginPath();
        
        cpuData.forEach((value, i) => {
            const x = (i / cpuData.length) * width;
            const y = height - (value / 100) * height;
            
            if (i === 0) {
                cpuCtx.moveTo(x, y);
            } else {
                cpuCtx.lineTo(x, y);
            }
        });
        
        cpuCtx.stroke();
        
        // Fill area under curve
        cpuCtx.lineTo(width, height);
        cpuCtx.lineTo(0, height);
        cpuCtx.closePath();
        cpuCtx.fillStyle = 'rgba(135, 206, 235, 0.15)';
        cpuCtx.fill();
    }
    
    function updateCPU() {
        const newValue = Math.random() * 15 + 2; // 2-17%
        cpuData.push(newValue);
        cpuData.shift();
        
        const cpuPercent = document.getElementById('cpuPercent');
        if (cpuPercent) {
            cpuPercent.textContent = Math.round(newValue) + '%';
        }
        
        drawCPUGraph();
    }
    
    function updateRAM() {
        const usage = 75 + Math.random() * 10; // 75-85%
        const used = (usage / 100 * 7.4).toFixed(1);
        
        const ramPercent = document.getElementById('ramPercent');
        const ramBar = document.getElementById('ramBar');
        const ramUsed = document.getElementById('ramUsed');
        
        if (ramPercent) ramPercent.textContent = Math.round(usage) + '%';
        if (ramBar) ramBar.style.width = usage + '%';
        if (ramUsed) ramUsed.textContent = used;
    }
    
    // Initial draw
    drawCPUGraph();
    
    // Update intervals
    setInterval(updateCPU, CONFIG.widgets.cpuUpdateInterval);
    setInterval(updateRAM, CONFIG.widgets.ramUpdateInterval);
}

/* ==================== MAIN MENU ==================== */
function initMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mainMenu = document.getElementById('mainMenu');
    const menuApps = document.querySelectorAll('.menu-app[data-app]');
    const menuSearch = document.getElementById('menuSearch');
    
    // Toggle menu
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = mainMenu.classList.toggle('active');
        menuBtn.classList.toggle('active', isActive);
        menuBtn.setAttribute('aria-expanded', isActive);
        
        if (isActive) {
            menuSearch.focus();
        }
    });
    
    // Close menu on outside click
    document.addEventListener('click', () => {
        mainMenu.classList.remove('active');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
    });
    
    // Prevent menu close on menu click
    mainMenu.addEventListener('click', (e) => e.stopPropagation());
    
    // Open applications
    menuApps.forEach(app => {
        app.addEventListener('click', () => {
            const appName = app.dataset.app;
            openWindow(appName);
            mainMenu.classList.remove('active');
            menuBtn.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Menu search with debounce
    const debouncedSearch = Utils.debounce((query) => {
        const lowerQuery = query.toLowerCase();
        menuApps.forEach(app => {
            const name = app.querySelector('.app-name').textContent.toLowerCase();
            app.style.display = name.includes(lowerQuery) ? 'flex' : 'none';
        });
    }, 300);
    
    menuSearch.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Download resume
    const downloadResume = document.getElementById('downloadResume');
    if (downloadResume) {
        downloadResume.addEventListener('click', () => {
            Toast.info('Resume download feature - Add your resume URL here!');
            // window.open('YOUR_RESUME_URL', '_blank');
        });
    }
    
    // Lock and power buttons
    const lockScreen = document.getElementById('lockScreen');
    const powerMenu = document.getElementById('powerMenu');
    
    if (lockScreen) {
        lockScreen.addEventListener('click', () => {
            Toast.info('Lock screen feature - Demo mode');
        });
    }
    
    if (powerMenu) {
        powerMenu.addEventListener('click', () => {
            if (confirm('Are you sure you want to close this portfolio?')) {
                window.close();
            }
        });
    }
}

/* ==================== PANEL ==================== */
function initPanel() {
    // Dock apps (optional functionality)
    const dockApps = document.querySelectorAll('.dock-app');
    dockApps.forEach(app => {
        app.addEventListener('click', () => {
            Toast.info(`${app.title} - Demo mode`);
        });
    });
    
    // System tray icons
    const trayIcons = document.querySelectorAll('.tray-icon');
    trayIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            Toast.info(`${icon.title} - Demo mode`);
        });
    });
    
    // Listen for window changes
    State.on('windowsChanged', updateWindowButtons);
}

function updateWindowButtons() {
    const container = document.getElementById('windowButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    State.windows.forEach(win => {
        const btn = document.createElement('button');
        btn.className = 'window-button';
        btn.textContent = win.title;
        btn.setAttribute('aria-label', `Switch to ${win.title}`);
        
        if (!win.minimized && win.element === State.activeWindow) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            if (win.minimized) {
                win.element.style.display = '';
                win.element.classList.remove('minimizing');
                win.minimized = false;
                focusWindow(win.element);
            } else if (win.element === State.activeWindow) {
                win.element.classList.add('minimizing');
                setTimeout(() => {
                    win.element.style.display = 'none';
                    win.element.classList.remove('minimizing');
                }, 300);
                win.minimized = true;
                State.activeWindow = null;
            } else {
                focusWindow(win.element);
            }
            updateWindowButtons();
        });
        
        container.appendChild(btn);
    });
}

/* ==================== KEYBOARD SHORTCUTS ==================== */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + F4 - Close active window
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            if (State.activeWindow) {
                const closeBtn = State.activeWindow.querySelector('.close');
                if (closeBtn) closeBtn.click();
            }
        }
        
        // Ctrl + Q - Close active window
        if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            if (State.activeWindow) {
                const closeBtn = State.activeWindow.querySelector('.close');
                if (closeBtn) closeBtn.click();
            }
        }
        
        // Alt + M - Toggle menu
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            document.getElementById('menuBtn').click();
        }
        
        // Escape - Close menu or minimize active window
        if (e.key === 'Escape') {
            const mainMenu = document.getElementById('mainMenu');
            if (mainMenu.classList.contains('active')) {
                document.getElementById('menuBtn').click();
            } else if (State.activeWindow) {
                const minimizeBtn = State.activeWindow.querySelector('.minimize');
                if (minimizeBtn) minimizeBtn.click();
            }
        }
    });
}

/* ==================== WINDOW MANAGEMENT ==================== */
function openWindow(appName) {
    // Check if already open
    const existing = State.windows.find(w => w.app === appName);
    if (existing) {
        if (existing.minimized) {
            existing.element.style.display = '';
            existing.minimized = false;
        }
        focusWindow(existing.element);
        return;
    }
    
    const template = document.getElementById('windowTemplate');
    const win = template.content.cloneNode(true).querySelector('.window');
    
    // Set properties
    win.dataset.app = appName;
    
    const iconMap = {
        about: '👤',
        skills: '⚙️',
        projects: '📁',
        github: '📊',
        contact: '✉️'
    };
    
    const titleMap = {
        about: 'About - Anjisha Pun',
        skills: 'System Monitor - Skills',
        projects: 'Files - Projects',
        github: 'Terminal - GitHub Stats',
        contact: 'Mail - Contact'
    };
    
    win.querySelector('.window-icon').textContent = iconMap[appName] || '📄';
    win.querySelector('.window-name').textContent = titleMap[appName] || appName;
    win.setAttribute('aria-label', titleMap[appName]);
    
    // Load content
    const body = win.querySelector('.window-body');
    body.innerHTML = getWindowContent(appName);
    
    // Position
    const positions = {
        about: { x: 100, y: 80 },
        skills: { x: 150, y: 100 },
        projects: { x: 200, y: 120 },
        github: { x: 120, y: 90 },
        contact: { x: 180, y: 110 }
    };
    
    const pos = positions[appName] || { x: 150, y: 100 };
    win.style.left = pos.x + 'px';
    win.style.top = pos.y + 'px';
    win.style.width = CONFIG.window.defaultWidth + 'px';
    win.style.height = CONFIG.window.defaultHeight + 'px';
    win.style.zIndex = State.getNextZIndex();
    
    // Add to DOM
    document.getElementById('windowsContainer').appendChild(win);
    
    // Store state
    const winState = {
        app: appName,
        title: titleMap[appName],
        element: win,
        minimized: false,
        maximized: false
    };
    State.addWindow(winState);
    
    // Init controls
    initWindowControls(win, winState);
    makeDraggable(win);
    makeResizable(win);
    focusWindow(win);
    
    // Load dynamic content
    if (appName === 'projects') loadProjects();
    if (appName === 'github') loadGitHub();
    if (appName === 'contact') initContactForm();
    
    Utils.announceToScreenReader(`${titleMap[appName]} window opened`);
}

function getWindowContent(app) {
    const content = {
        about: `
            <div class="about-section">
                <div class="about-header">
                    <h2>Anjisha Pun</h2>
                    <p class="about-role">UI/UX Designer & Frontend Developer</p>
                    <p class="about-location">📍 Butwal, Nepal</p>
                </div>
                <hr class="about-divider">
                <div class="about-bio">
                    <p>UI/UX designer and frontend developer specializing in crafting intuitive, visually compelling digital experiences. Proficient in HTML, CSS, and JavaScript, with growing expertise in React and Next.js. Combines design thinking with technical implementation, backed by knowledge in Django and Python for full-stack perspective.</p>
                </div>
                <div class="about-status">
                    <span class="status-dot"></span>
                    <div class="status-text">
                        <span class="status-label">STATUS</span>
                        <span class="status-value">Open to opportunities</span>
                    </div>
                </div>
            </div>
        `,
        
        skills: `
            <div class="skills-section">
                <h2>Technical Skills</h2>
                <hr class="about-divider">
                <div class="skills-list">
                    <div class="skill-category">
                        <h4>Frontend</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">HTML/CSS</span>
                            <span class="skill-tag">JavaScript</span>
                            <span class="skill-tag">React</span>
                            <span class="skill-tag">Next.js</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Backend</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">Python</span>
                            <span class="skill-tag">Django</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Design</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">Figma</span>
                            <span class="skill-tag">Canva</span>
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Beyond the Code</h4>
                        <div class="skill-tags">
                            <span class="skill-tag">Communication</span>
                            <span class="skill-tag">Presentation</span>
                            <span class="skill-tag">Musician</span>
                        </div>
                    </div>
                </div>
            </div>
        `,
        
        projects: `
            <h2>Projects</h2>
            <div class="projects-toolbar">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="github">GitHub</button>
                <button class="filter-btn" data-filter="figma">Figma</button>
            </div>
            <div class="projects-grid" id="projectsGrid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading projects...</p>
                </div>
            </div>
        `,
        
        github: `
            <h2>GitHub Statistics</h2>
            <div id="githubContent">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading GitHub data...</p>
                </div>
            </div>
        `,
        
        contact: `
            <div class="contact-section">
                <h2>Get In Touch</h2>
                <hr class="about-divider">
                <div class="contact-links">
                    <p><strong>Email:</strong> <a href="mailto:punangisha@gmail.com">punangisha@gmail.com</a></p>
                    <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/anjisha-pun-aaa1a6349/" target="_blank" rel="noopener noreferrer">View Profile</a></p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/anjisha616" target="_blank" rel="noopener noreferrer">@anjisha616</a></p>
                </div>
                <h3>Send Message</h3>
                <form id="contactForm" class="contact-form">
                    <input type="text" name="name" placeholder="Your Name" required aria-label="Your name">
                    <input type="email" name="email" placeholder="Your Email" required aria-label="Your email">
                    <textarea name="message" placeholder="Message" rows="5" required aria-label="Your message"></textarea>
                    <button type="submit">Send Message</button>
                </form>
            </div>
        `
    };
    
    return content[app] || '<p>Content not found</p>';
}

/* ==================== WINDOW CONTROLS ==================== */
function initWindowControls(win, winState) {
    const minimizeBtn = win.querySelector('.minimize');
    const maximizeBtn = win.querySelector('.maximize');
    const closeBtn = win.querySelector('.close');
    
    minimizeBtn.addEventListener('click', () => {
        win.classList.add('minimizing');
        setTimeout(() => {
            win.style.display = 'none';
            win.classList.remove('minimizing');
        }, 300);
        winState.minimized = true;
        State.activeWindow = null;
        updateWindowButtons();
        Utils.announceToScreenReader(`${winState.title} minimized`);
    });
    
    maximizeBtn.addEventListener('click', () => {
        winState.maximized = !winState.maximized;
        win.classList.toggle('maximized');
        updateWidgetsVisibility();
        Utils.announceToScreenReader(
            `${winState.title} ${winState.maximized ? 'maximized' : 'restored'}`
        );
    });
    
    closeBtn.addEventListener('click', () => {
        win.style.opacity = '0';
        win.style.transform = 'scale(0.95)';
        setTimeout(() => {
            win.remove();
            State.removeWindow(winState);
            updateWidgetsVisibility();
        }, 200);
        Utils.announceToScreenReader(`${winState.title} closed`);
    });
    
    win.addEventListener('mousedown', () => focusWindow(win));
}

function updateWidgetsVisibility() {
    const widgets = document.querySelector('.desktop-widgets');
    const anyMaximized = document.querySelector('.window.maximized') !== null;
    
    if (widgets) {
        if (anyMaximized) {
            widgets.classList.add('hidden');
        } else {
            widgets.classList.remove('hidden');
        }
    }
}

function focusWindow(win) {
    // Remove focus from all windows
    document.querySelectorAll('.window').forEach(w => {
        w.classList.remove('focused');
    });
    
    // Focus new window
    win.classList.add('focused');
    win.style.zIndex = State.getNextZIndex();
    State.setActiveWindow(win);
    
    // Set focus to first focusable element
    const firstFocusable = win.querySelector('button, a, input, textarea, select');
    if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
    }
}

/* ==================== DRAGGABLE WINDOWS ==================== */
function makeDraggable(win) {
    const titlebar = win.querySelector('.window-titlebar');
    let isDragging = false;
    let offsetX, offsetY;
    
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-controls')) return;
        if (win.classList.contains('maximized')) return;
        
        isDragging = true;
        offsetX = e.clientX - win.offsetLeft;
        offsetY = e.clientY - win.offsetTop;
        
        win.style.cursor = 'move';
        titlebar.style.cursor = 'move';
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });
    
    const drag = Utils.throttle((e) => {
        if (!isDragging) return;
        
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;
        
        // Keep window within viewport
        const maxX = window.innerWidth - win.offsetWidth;
        const maxY = window.innerHeight - win.offsetHeight - 48; // 48px for panel
        
        newX = Utils.clamp(newX, 0, maxX);
        newY = Utils.clamp(newY, 0, maxY);
        
        win.style.left = newX + 'px';
        win.style.top = newY + 'px';
        
        // Window snapping
        if (newX < CONFIG.window.snapThreshold) {
            win.style.left = '0px';
        }
        if (newY < CONFIG.window.snapThreshold) {
            win.style.top = '0px';
        }
        if (newX > maxX - CONFIG.window.snapThreshold) {
            win.style.left = maxX + 'px';
        }
    }, 16); // ~60fps
    
    function stopDrag() {
        isDragging = false;
        win.style.cursor = '';
        titlebar.style.cursor = 'move';
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

/* ==================== RESIZABLE WINDOWS ==================== */
function makeResizable(win) {
    const handles = win.querySelectorAll('.resize-handle');
    
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            if (win.classList.contains('maximized')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const direction = handle.dataset.direction;
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = win.offsetWidth;
            const startHeight = win.offsetHeight;
            const startLeft = win.offsetLeft;
            const startTop = win.offsetTop;
            
            const resize = Utils.throttle((e) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (direction.includes('e')) {
                    newWidth = Math.max(CONFIG.window.minWidth, startWidth + deltaX);
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(CONFIG.window.minWidth, startWidth - deltaX);
                    if (newWidth > CONFIG.window.minWidth) {
                        newLeft = startLeft + deltaX;
                    }
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(CONFIG.window.minHeight, startHeight + deltaY);
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(CONFIG.window.minHeight, startHeight - deltaY);
                    if (newHeight > CONFIG.window.minHeight) {
                        newTop = startTop + deltaY;
                    }
                }
                
                win.style.width = newWidth + 'px';
                win.style.height = newHeight + 'px';
                win.style.left = newLeft + 'px';
                win.style.top = newTop + 'px';
            }, 16); // ~60fps
            
            function stopResize() {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
            }
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
    });
}

/* ==================== GITHUB DATA ==================== */
async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    try {
        const repos = await GitHubService.getRepositories();
        
        grid.innerHTML = '';
        
        repos.forEach((repo, index) => {
            const card = document.createElement('div');
            card.className = 'project-card github';
            card.dataset.source = 'github';
            card.style.animationDelay = `${index * 0.05}s`;
            card.innerHTML = `
                <div class="project-icon">📁</div>
                <div class="project-name">${Utils.sanitizeHTML(repo.name)}</div>
                <div class="project-desc">${Utils.sanitizeHTML(repo.description || 'No description')}</div>
                <div class="project-meta">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🔄 ${repo.forks_count}</span>
                    <span>${Utils.sanitizeHTML(repo.language || 'Code')}</span>
                </div>
            `;
            card.addEventListener('click', () => {
                window.open(repo.html_url, '_blank', 'noopener,noreferrer');
            });
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(repo.html_url, '_blank', 'noopener,noreferrer');
                }
            });
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open ${repo.name} project on GitHub`);
            grid.appendChild(card);
        });
        
        // Add Figma projects
        const figmaProjects = [
            { name: 'UI Components', desc: 'Design system library' },
            { name: 'Mobile Apps', desc: 'App UI designs' },
            { name: 'Landing Pages', desc: 'Web design concepts' }
        ];
        
        figmaProjects.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'project-card figma';
            card.dataset.source = 'figma';
            card.style.animationDelay = `${(repos.length + index) * 0.05}s`;
            card.innerHTML = `
                <div class="project-icon">🎨</div>
                <div class="project-name">${p.name}</div>
                <div class="project-desc">${p.desc}</div>
                <div class="project-meta"><span>Figma Design</span></div>
            `;
            card.addEventListener('click', () => {
                window.open('https://www.figma.com/files/team/1375711861175707486/project/237173255', '_blank', 'noopener,noreferrer');
            });
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open ${p.name} Figma project`);
            grid.appendChild(card);
        });
        
        // Init filters
        initProjectFilters();
        
    } catch (err) {
        console.error('Failed to load projects:', err);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--danger);">Failed to load projects</p>
                <p style="color: var(--text-muted); margin-top: 10px;">${err.message}</p>
                <button onclick="loadProjects()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent); border: none; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
        Toast.error('Failed to load projects. Please try again.');
    }
}

function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.source === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.4s ease backwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

async function loadGitHub() {
    const content = document.getElementById('githubContent');
    if (!content) return;
    
    try {
        const user = await GitHubService.getUser();
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                <div style="background: var(--accent-light); padding: 24px; border-radius: 12px; border-left: 4px solid var(--accent); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    <h3 style="margin-bottom: 8px; font-size: 1rem; color: var(--text-muted);">Repositories</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--accent); margin: 0;">${user.public_repos}</p>
                </div>
                <div style="background: var(--accent-light); padding: 24px; border-radius: 12px; border-left: 4px solid var(--accent); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    <h3 style="margin-bottom: 8px; font-size: 1rem; color: var(--text-muted);">Followers</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--accent); margin: 0;">${user.followers}</p>
                </div>
                <div style="background: var(--accent-light); padding: 24px; border-radius: 12px; border-left: 4px solid var(--accent); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    <h3 style="margin-bottom: 8px; font-size: 1rem; color: var(--text-muted);">Following</h3>
                    <p style="font-size: 2.5rem; font-weight: bold; color: var(--accent); margin: 0;">${user.following}</p>
                </div>
            </div>
            <h3 style="margin-top: 32px;">Contribution Graph</h3>
            <img src="https://ghchart.rshah.org/${CONFIG.github.username}" 
                 alt="GitHub contribution graph" 
                 style="width: 100%; border-radius: 8px; margin-top: 16px; background: white; padding: 10px;"
                 loading="lazy">
            <p style="text-align: center; margin-top: 24px;">
                <a href="https://github.com/${CONFIG.github.username}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style="color: var(--accent); font-weight: 500; font-size: 1.05rem;">
                    View Full Profile →
                </a>
            </p>
        `;
    } catch (err) {
        console.error('Failed to load GitHub data:', err);
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: var(--danger);">Failed to load GitHub data</p>
                <p style="color: var(--text-muted); margin-top: 10px;">${err.message}</p>
                <button onclick="loadGitHub()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent); border: none; border-radius: 8px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
        Toast.error('Failed to load GitHub data. Please try again.');
    }
}

/* ==================== CONTACT FORM ==================== */
function initContactForm() {
    // Wait for form to be in DOM
    setTimeout(() => {
        const form = document.getElementById('contactForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            
            // Validate
            if (!data.name || !data.email || !data.message) {
                Toast.error('Please fill in all fields');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                Toast.error('Please enter a valid email address');
                return;
            }
            
            // Simulate sending (replace with actual implementation)
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            try {
                // Here you would send to your backend
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                Toast.success('Message sent successfully! I\'ll get back to you soon.');
                form.reset();
                
                // Store in localStorage as backup
                Utils.storage.set('last_contact', {
                    ...data,
                    timestamp: Date.now()
                });
            } catch (error) {
                Toast.error('Failed to send message. Please try again.');
                console.error('Contact form error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }, 100);
}

/* ==================== USER PREFERENCES ==================== */
function loadUserPreferences() {
    // Load saved preferences
    const prefs = Utils.storage.get('user_preferences', {});
    
    // Apply preferences
    if (prefs.reducedMotion) {
        document.documentElement.style.setProperty('--transition-fast', '0.01ms');
        document.documentElement.style.setProperty('--transition-base', '0.01ms');
        document.documentElement.style.setProperty('--transition-slow', '0.01ms');
    }
}

function saveUserPreference(key, value) {
    const prefs = Utils.storage.get('user_preferences', {});
    prefs[key] = value;
    Utils.storage.set('user_preferences', prefs);
}

/* ==================== PERFORMANCE MONITORING ==================== */
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('app-init-complete');
    
    // Log performance metrics
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Performance Metrics:');
                console.log('- DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
                console.log('- Load Complete:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                console.log('- Total Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }
        }, 0);
    });
}

/* ==================== ERROR HANDLING ==================== */
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    Toast.error('An unexpected error occurred');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    Toast.error('A network error occurred');
});

/* ==================== EXPORT FOR DEBUGGING ==================== */
if (typeof window !== 'undefined') {
    window.PortfolioDebug = {
        State,
        Utils,
        Toast,
        GitHubService,
        CONFIG
    };
}