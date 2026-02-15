// ============================================
// LINUX MINT PORTFOLIO - MAIN JAVASCRIPT
// ============================================

const GITHUB_USERNAME = 'anjisha616';
const EXCLUDED_REPOS = ['cafe-clone', 'netflix-clone', 'starbucks-clone'];

// State Management
const state = {
    windows: [],
    activeWindow: null,
    nextZIndex: 100,
    windowPositions: {
        about: { x: 100, y: 80 },
        skills: { x: 150, y: 100 },
        projects: { x: 200, y: 120 },
        github: { x: 120, y: 90 },
        contact: { x: 180, y: 110 },
        experience: { x: 140, y: 95 }
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
    initClock();
    initMenu();
    initDesktopIcons();
    initTaskbar();
    initContextMenu();
    initTheme();
    initKonamiCode();
    
    // Auto-open About window after boot
    setTimeout(() => {
        openWindow('about');
    }, 3500);
});

// ============================================
// BOOT SEQUENCE
// ============================================

function initBootSequence() {
    const bootScreen = document.getElementById('bootScreen');
    
    setTimeout(() => {
        bootScreen.style.display = 'none';
    }, 3000);
}

// ============================================
// CLOCK
// ============================================

function initClock() {
    const clockElement = document.getElementById('clock');
    
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}`;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// ============================================
// MENU
// ============================================

function initMenu() {
    const menuButton = document.getElementById('menuButton');
    const appMenu = document.getElementById('appMenu');
    const menuItems = document.querySelectorAll('.menu-item[data-app]');
    
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        appMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
        appMenu.classList.remove('active');
    });
    
    appMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const app = item.dataset.app;
            openWindow(app);
            appMenu.classList.remove('active');
        });
    });
    
    // Download Resume
    document.getElementById('downloadResume').addEventListener('click', () => {
        alert('Resume download feature - Add your resume link here!');
        appMenu.classList.remove('active');
    });
    
    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        appMenu.classList.remove('active');
    });
}

// ============================================
// DESKTOP ICONS
// ============================================

function initDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    let selectedIcon = null;
    let clickTimer = null;
    
    icons.forEach(icon => {
        // Single click - select
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Clear previous selection
            if (selectedIcon && selectedIcon !== icon) {
                selectedIcon.classList.remove('selected');
            }
            
            icon.classList.add('selected');
            selectedIcon = icon;
            
            // Double click detection
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                const app = icon.dataset.app;
                openWindow(app);
            } else {
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                }, 300);
            }
        });
    });
    
    // Deselect when clicking desktop
    document.getElementById('desktop').addEventListener('click', () => {
        if (selectedIcon) {
            selectedIcon.classList.remove('selected');
            selectedIcon = null;
        }
    });
}

// ============================================
// WINDOW MANAGEMENT
// ============================================

function openWindow(appName) {
    // Check if window already exists
    const existingWindow = state.windows.find(w => w.app === appName);
    if (existingWindow) {
        // Restore if minimized and focus
        if (existingWindow.minimized) {
            restoreWindow(existingWindow.element);
        }
        focusWindow(existingWindow.element);
        return;
    }
    
    // Create new window
    const template = document.getElementById('windowTemplate');
    const windowElement = template.content.cloneNode(true).querySelector('.window');
    
    // Set window properties
    windowElement.dataset.app = appName;
    
    // Set icon and title
    const iconMap = {
        about: '📁',
        experience: '💼',
        skills: '⚙️',
        projects: '🗂️',
        github: '📊',
        contact: '📧',
        resume: '📄'
    };
    
    const titleMap = {
        about: 'About_Me.txt',
        experience: 'Experience.md',
        skills: 'System Monitor - Skills',
        projects: 'Files - Projects',
        github: 'Terminal - GitHub Stats',
        contact: 'Thunderbird - Contact',
        resume: 'Resume.pdf'
    };
    
    windowElement.querySelector('.window-icon').textContent = iconMap[appName] || '📄';
    windowElement.querySelector('.window-title').textContent = titleMap[appName] || appName;
    
    // Load content
    const content = windowElement.querySelector('.window-content');
    content.innerHTML = getWindowContent(appName);
    
    // Position window
    const pos = state.windowPositions[appName] || { x: 100, y: 80 };
    windowElement.style.left = pos.x + 'px';
    windowElement.style.top = pos.y + 'px';
    windowElement.style.zIndex = state.nextZIndex++;
    
    // Add to container
    document.getElementById('windowsContainer').appendChild(windowElement);
    
    // Store window state
    const windowState = {
        app: appName,
        element: windowElement,
        minimized: false,
        maximized: false
    };
    state.windows.push(windowState);
    
    // Initialize window controls
    initWindowControls(windowElement, windowState);
    
    // Make window draggable
    makeWindowDraggable(windowElement);
    
    // Focus window
    focusWindow(windowElement);
    
    // Add to taskbar
    updateWindowList();
    
    // Load dynamic content if needed
    if (appName === 'projects') {
        loadProjects();
    } else if (appName === 'github') {
        loadGitHubStats();
    }
}

function getWindowContent(appName) {
    const content = {
        about: `
            <h2>Anjisha Pun</h2>
            <h3>UI/UX Designer & Frontend Developer</h3>
            <p><strong>Location:</strong> 📍 Butwal, Nepal</p>
            
            <h3>About</h3>
            <p>UI/UX designer and frontend developer specializing in crafting intuitive, visually compelling digital experiences. Proficient in HTML, CSS, and JavaScript, with growing expertise in React and Next.js. Combines design thinking with technical implementation, backed by knowledge in Django and Python for full-stack perspective.</p>
            
            <h3>Links</h3>
            <p>
                🔗 <a href="https://github.com/anjisha616" target="_blank">GitHub: anjisha616</a><br>
                🔗 <a href="https://www.linkedin.com/in/anjisha-pun-aaa1a6349/" target="_blank">LinkedIn Profile</a><br>
                📧 <a href="mailto:punangisha@gmail.com">punangisha@gmail.com</a>
            </p>
        `,
        
        experience: `
            <h2>Experience</h2>
            
            <div style="background: rgba(143, 168, 118, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid var(--mint-primary);">
                <h3>🚧 Currently Seeking Opportunities</h3>
                <p>Building portfolio and honing skills in UI/UX design and frontend development.</p>
                <p>Ready to bring creative solutions and technical expertise to your team!</p>
            </div>
            
            <h3>Education</h3>
            <p><strong>Focus Areas:</strong></p>
            <ul>
                <li>UI/UX Design Principles</li>
                <li>Frontend Web Development</li>
                <li>Design Systems & Component Libraries</li>
                <li>Responsive Web Design</li>
            </ul>
        `,
        
        skills: `
            <h2>Skills & Expertise</h2>
            <div class="skills-grid">
                <div class="skill-category">
                    <h4>🎨 Design Tools</h4>
                    <div class="skill-item">
                        <span class="skill-name">Figma</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 85%">85%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">Canva</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 75%">75%</div>
                        </div>
                    </div>
                </div>
                
                <div class="skill-category">
                    <h4>💻 Frontend</h4>
                    <div class="skill-item">
                        <span class="skill-name">HTML/CSS</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 90%">90%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">JavaScript</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 80%">80%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">React</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 55%">55% (learning)</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">Next.js</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 45%">45% (learning)</div>
                        </div>
                    </div>
                </div>
                
                <div class="skill-category">
                    <h4>🔧 Backend</h4>
                    <div class="skill-item">
                        <span class="skill-name">Django</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 60%">60%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">Python</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 60%">60%</div>
                        </div>
                    </div>
                </div>
                
                <div class="skill-category">
                    <h4>🌟 Non-Technical</h4>
                    <div class="skill-item">
                        <span class="skill-name">Communication</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 85%">85%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">Presentation</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 85%">85%</div>
                        </div>
                    </div>
                    <div class="skill-item">
                        <span class="skill-name">Music</span>
                        <div class="skill-bar">
                            <div class="skill-bar-fill" style="width: 70%">70%</div>
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
            <div class="terminal-content">
                <div><span class="terminal-prompt">anjisha@portfolio:~$</span> github-stats --user ${GITHUB_USERNAME}</div>
                <div id="githubStatsContent">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Fetching GitHub statistics...</p>
                    </div>
                </div>
            </div>
        `,
        
        contact: `
            <h2>Get In Touch</h2>
            <div class="contact-grid">
                <div class="contact-info">
                    <h3>📧 Contact Information</h3>
                    <div class="contact-item">
                        <span>📧</span>
                        <a href="mailto:punangisha@gmail.com">punangisha@gmail.com</a>
                    </div>
                    <div class="contact-item">
                        <span>💼</span>
                        <a href="https://www.linkedin.com/in/anjisha-pun-aaa1a6349/" target="_blank">LinkedIn Profile</a>
                    </div>
                    <div class="contact-item">
                        <span>💻</span>
                        <a href="https://github.com/anjisha616" target="_blank">GitHub Profile</a>
                    </div>
                </div>
                
                <form class="contact-form" id="contactForm">
                    <h3>📨 Send a Message</h3>
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label>Your Email</label>
                        <input type="email" placeholder="john@example.com" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea rows="5" placeholder="Your message here..." required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">📤 Send Message</button>
                </form>
            </div>
        `,
        
        resume: `
            <h2>Resume</h2>
            <p>Download my resume to learn more about my skills and experience.</p>
            <button class="submit-btn" onclick="alert('Add your resume download link here!')">📥 Download Resume (PDF)</button>
        `
    };
    
    return content[appName] || '<p>Content not found</p>';
}

// ============================================
// WINDOW CONTROLS
// ============================================

function initWindowControls(windowElement, windowState) {
    const minimizeBtn = windowElement.querySelector('.minimize');
    const maximizeBtn = windowElement.querySelector('.maximize');
    const closeBtn = windowElement.querySelector('.close');
    
    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(windowElement, windowState);
    });
    
    maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMaximize(windowElement, windowState);
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(windowElement, windowState);
    });
    
    // Click to focus
    windowElement.addEventListener('mousedown', () => {
        focusWindow(windowElement);
    });
}

function minimizeWindow(windowElement, windowState) {
    windowElement.classList.add('minimized');
    windowState.minimized = true;
    setTimeout(() => {
        windowElement.style.display = 'none';
    }, 300);
    updateWindowList();
}

function restoreWindow(windowElement) {
    windowElement.style.display = 'flex';
    setTimeout(() => {
        windowElement.classList.remove('minimized');
        windowElement.style.opacity = '1';
        windowElement.style.transform = 'scale(1)';
    }, 10);
    
    const windowState = state.windows.find(w => w.element === windowElement);
    if (windowState) {
        windowState.minimized = false;
    }
    updateWindowList();
}

function toggleMaximize(windowElement, windowState) {
    windowState.maximized = !windowState.maximized;
    windowElement.classList.toggle('maximized');
}

function closeWindow(windowElement, windowState) {
    windowElement.style.opacity = '0';
    windowElement.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        windowElement.remove();
        state.windows = state.windows.filter(w => w !== windowState);
        updateWindowList();
    }, 200);
}

function focusWindow(windowElement) {
    // Remove active from all windows
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    
    // Add active to clicked window
    windowElement.classList.add('active');
    windowElement.style.zIndex = state.nextZIndex++;
    
    // Update state
    state.activeWindow = windowElement;
}

// ============================================
// WINDOW DRAGGING
// ============================================

function makeWindowDraggable(windowElement) {
    const header = windowElement.querySelector('.window-header');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-controls')) return;
        if (windowElement.classList.contains('maximized')) return;
        
        isDragging = true;
        initialX = e.clientX - windowElement.offsetLeft;
        initialY = e.clientY - windowElement.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });
    
    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        // Keep window in bounds
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        
        windowElement.style.left = currentX + 'px';
        windowElement.style.top = currentY + 'px';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

// ============================================
// WINDOW LIST (TOP PANEL)
// ============================================

function updateWindowList() {
    const windowList = document.getElementById('windowList');
    windowList.innerHTML = '';
    
    state.windows.forEach(windowState => {
        if (!windowState.minimized) {
            const btn = document.createElement('button');
            btn.className = 'window-list-item';
            btn.textContent = windowState.element.querySelector('.window-title').textContent;
            
            if (windowState.element === state.activeWindow) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => {
                focusWindow(windowState.element);
            });
            
            windowList.appendChild(btn);
        }
    });
}

// ============================================
// TASKBAR
// ============================================

function initTaskbar() {
    const showDesktopBtn = document.getElementById('showDesktop');
    
    showDesktopBtn.addEventListener('click', () => {
        const allMinimized = state.windows.every(w => w.minimized);
        
        if (allMinimized) {
            // Restore all
            state.windows.forEach(w => {
                if (w.minimized) {
                    restoreWindow(w.element);
                }
            });
        } else {
            // Minimize all
            state.windows.forEach(w => {
                if (!w.minimized) {
                    minimizeWindow(w.element, w);
                }
            });
        }
    });
}

// ============================================
// CONTEXT MENU
// ============================================

function initContextMenu() {
    const desktop = document.getElementById('desktop');
    const contextMenu = document.getElementById('contextMenu');
    
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.classList.add('active');
    });
    
    document.addEventListener('click', () => {
        contextMenu.classList.remove('active');
    });
    
    // Context menu actions
    contextMenu.querySelectorAll('.context-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            
            if (action === 'refresh') {
                location.reload();
            } else if (action === 'arrange') {
                // Arrange icons (could implement grid snapping)
                alert('Icons arranged!');
            } else if (action === 'about') {
                openWindow('about');
            }
        });
    });
}

// ============================================
// GITHUB API - LOAD PROJECTS
// ============================================

async function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        const repos = await response.json();
        
        // Filter and sort
        const filteredRepos = repos.filter(repo => 
            !EXCLUDED_REPOS.includes(repo.name.toLowerCase()) && !repo.fork
        ).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
        
        // Clear loading
        projectsGrid.innerHTML = '';
        
        // Add GitHub repos
        filteredRepos.forEach(repo => {
            const card = createProjectCard(repo, 'github');
            projectsGrid.appendChild(card);
        });
        
        // Add Figma projects
        addFigmaProjects(projectsGrid);
        
        // Init filters
        initProjectFilters();
        
    } catch (error) {
        projectsGrid.innerHTML = '<p style="color: red;">Failed to load projects. Please try again later.</p>';
    }
}

function createProjectCard(repo, source) {
    const card = document.createElement('div');
    card.className = `project-card ${source}`;
    card.dataset.source = source;
    
    if (source === 'github') {
        card.innerHTML = `
            <div class="project-icon">🗂️</div>
            <div class="project-name">${repo.name}</div>
            <div class="project-desc">${repo.description || 'No description'}</div>
            <div class="project-meta">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🔄 ${repo.forks_count}</span>
                <span>${repo.language || 'Code'}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.open(repo.html_url, '_blank');
        });
    } else if (source === 'figma') {
        card.innerHTML = `
            <div class="project-icon">🎨</div>
            <div class="project-name">${repo.name}</div>
            <div class="project-desc">${repo.description}</div>
            <div class="project-meta">
                <span>Figma Design</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.open(repo.url, '_blank');
        });
    }
    
    return card;
}

function addFigmaProjects(container) {
    const figmaProjects = [
        {
            name: 'UI Component Library',
            description: 'Comprehensive design system with reusable components',
            url: 'https://www.figma.com/files/team/1375711861175707486/project/237173255'
        },
        {
            name: 'Mobile App Designs',
            description: 'Collection of mobile UI/UX designs',
            url: 'https://www.figma.com/files/team/1375711861175707486/project/237173255'
        },
        {
            name: 'Landing Pages',
            description: 'Modern landing page concepts',
            url: 'https://www.figma.com/files/team/1375711861175707486/project/237173255'
        }
    ];
    
    figmaProjects.forEach(project => {
        const card = createProjectCard(project, 'figma');
        container.appendChild(card);
    });
}

function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.source === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// GITHUB API - LOAD STATS
// ============================================

async function loadGitHubStats() {
    const statsContent = document.getElementById('githubStatsContent');
    
    try {
        const userResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
        const userData = await userResponse.json();
        
        const eventsResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`);
        const events = await eventsResponse.json();
        
        const pushEvents = events.filter(e => e.type === 'PushEvent');
        const totalCommits = pushEvents.reduce((sum, e) => sum + (e.payload.commits?.length || 0), 0);
        
        const reposResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
        const repos = await reposResponse.json();
        
        const languages = {};
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        
        const topLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        statsContent.innerHTML = `
            <div class="terminal-output">
                <p>📊 GITHUB STATISTICS</p>
                <p>═══════════════════════════════════════════════</p>
                <p>Total Repositories:     ${userData.public_repos}</p>
                <p>Total Commits (recent): ${totalCommits}</p>
                <p>Followers:              ${userData.followers}</p>
                <p>Following:              ${userData.following}</p>
                <p></p>
                <p>💻 TOP LANGUAGES</p>
                <p>═══════════════════════════════════════════════</p>
                ${topLanguages.map(([lang, count]) => `<p>${lang.padEnd(20)} ${count} repos</p>`).join('')}
                <p></p>
                <p>📈 CONTRIBUTION GRAPH</p>
                <p>═══════════════════════════════════════════════</p>
            </div>
            <img src="https://ghchart.rshah.org/${GITHUB_USERNAME}" alt="Contribution Graph" style="width: 100%; border-radius: 4px; margin-top: 10px;">
            <p style="margin-top: 20px; text-align: center;">
                <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" style="color: var(--mint-primary);">
                    View Full GitHub Profile →
                </a>
            </p>
        `;
        
    } catch (error) {
        statsContent.innerHTML = '<p style="color: red;">Failed to load GitHub stats.</p>';
    }
}

// ============================================
// THEME
// ============================================

function initTheme() {
    const settingsBtn = document.getElementById('settingsBtn');
    
    settingsBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });
}

// ============================================
// KONAMI CODE EASTER EGG
// ============================================

function initKonamiCode() {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiProgress = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiProgress]) {
            konamiProgress++;
            if (konamiProgress === konamiCode.length) {
                activateKonamiEasterEgg();
                konamiProgress = 0;
            }
        } else {
            konamiProgress = 0;
        }
    });
}

function activateKonamiEasterEgg() {
    // Change theme colors
    document.documentElement.style.setProperty('--mint-primary', '#00ff00');
    document.documentElement.style.setProperty('--mint-dark', '#00cc00');
    
    alert('🐧 KONAMI CODE ACTIVATED! Linux Mint transformed into Ubuntu!');
    
    setTimeout(() => {
        document.documentElement.style.setProperty('--mint-primary', '#8fa876');
        document.documentElement.style.setProperty('--mint-dark', '#5d7a4a');
    }, 10000);
}

// ============================================
// CONTACT FORM
// ============================================

document.addEventListener('submit', (e) => {
    if (e.target.id === 'contactForm') {
        e.preventDefault();
        alert('📧 Message sent successfully! (This is a demo - implement your form backend)');
        e.target.reset();
    }
});

// ============================================
// CONSOLE EASTER EGG
// ============================================

console.log('%c🐧 Linux Mint Portfolio OS', 'font-size: 24px; color: #8fa876; font-weight: bold');
console.log('%cDesigned by Anjisha Pun', 'font-size: 14px; color: #5d7a4a');
console.log('%c\nEaster Eggs:', 'font-size: 12px; color: #8fa876; font-weight: bold');
console.log('%c1. Konami Code: ↑↑↓↓←→←→BA', 'color: #666');
console.log('%c2. Right-click desktop for context menu', 'color: #666');
console.log('%c3. Toggle theme with settings icon', 'color: #666');

console.log('%c\nTech Stack:', 'font-size: 12px; color: #8fa876; font-weight: bold');
console.log('%c- Pure HTML, CSS, JavaScript', 'color: #666');
console.log('%c- GitHub API Integration', 'color: #666');
console.log('%c- Responsive Design', 'color: #666');