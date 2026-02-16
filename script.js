// Linux Mint Cinnamon Portfolio - Main Script
// Anjisha Pun

const GITHUB_USERNAME = 'anjisha616';
const EXCLUDED_REPOS = ['cafe-clone', 'netflix-clone', 'starbucks-clone'];

const state = {
    windows: [],
    nextZIndex: 100,
    activeWindow: null
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
    initClock();
    initWidgets();
    initMenu();
    initPanel();
});

// ==================== BOOT SEQUENCE ====================

function initBootSequence() {
    setTimeout(() => {
        document.getElementById('bootScreen').style.display = 'none';
    }, 2000);
}

// ==================== CLOCK ====================

function initClock() {
    const clockEl = document.getElementById('clock');
    
    function update() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        clockEl.querySelector('.clock-time').textContent = time;
        clockEl.querySelector('.clock-date').textContent = date;
    }
    
    update();
    setInterval(update, 1000);
}

// ==================== CPU & RAM WIDGETS ====================

function initWidgets() {
    // CPU Graph
    const cpuCanvas = document.getElementById('cpuGraph');
    const cpuCtx = cpuCanvas.getContext('2d');
    const cpuData = new Array(80).fill(0);
    
    function drawCPUGraph() {
        cpuCtx.clearRect(0, 0, cpuCanvas.width, cpuCanvas.height);
        
        // Draw grid
        cpuCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        cpuCtx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = (cpuCanvas.height / 4) * i;
            cpuCtx.beginPath();
            cpuCtx.moveTo(0, y);
            cpuCtx.lineTo(cpuCanvas.width, y);
            cpuCtx.stroke();
        }
        
        // Draw CPU line
        cpuCtx.strokeStyle = '#87CEEB';
        cpuCtx.lineWidth = 2;
        cpuCtx.beginPath();
        
        cpuData.forEach((value, i) => {
            const x = (i / cpuData.length) * cpuCanvas.width;
            const y = cpuCanvas.height - (value / 100) * cpuCanvas.height;
            
            if (i === 0) {
                cpuCtx.moveTo(x, y);
            } else {
                cpuCtx.lineTo(x, y);
            }
        });
        
        cpuCtx.stroke();
        
        // Fill area under curve
        cpuCtx.lineTo(cpuCanvas.width, cpuCanvas.height);
        cpuCtx.lineTo(0, cpuCanvas.height);
        cpuCtx.closePath();
        cpuCtx.fillStyle = 'rgba(135, 206, 235, 0.2)';
        cpuCtx.fill();
    }
    
    function updateCPU() {
        // Simulate CPU usage
        const newValue = Math.random() * 10 + 1; // 1-11%
        cpuData.push(newValue);
        cpuData.shift();
        
        document.getElementById('cpuPercent').textContent = Math.round(newValue) + '%';
        drawCPUGraph();
    }
    
    // RAM Usage
    function updateRAM() {
        const usage = 75 + Math.random() * 10; // 75-85%
        const used = (usage / 100 * 7.4).toFixed(1);
        
        document.getElementById('ramPercent').textContent = Math.round(usage) + '%';
        document.getElementById('ramBar').style.width = usage + '%';
        document.getElementById('ramUsed').textContent = used;
    }
    
    // Update intervals
    setInterval(updateCPU, 1000);
    setInterval(updateRAM, 2000);
    drawCPUGraph();
}

// ==================== MAIN MENU ====================

function initMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mainMenu = document.getElementById('mainMenu');
    const menuApps = document.querySelectorAll('.menu-app[data-app]');
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mainMenu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        mainMenu.classList.remove('active');
        menuBtn.classList.remove('active');
    });
    
    mainMenu.addEventListener('click', (e) => e.stopPropagation());
    
    menuApps.forEach(app => {
        app.addEventListener('click', () => {
            openWindow(app.dataset.app);
            mainMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });
    
    // Menu search
    document.getElementById('menuSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        menuApps.forEach(app => {
            const name = app.querySelector('.app-name').textContent.toLowerCase();
            app.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });
    
    // Download resume
    document.getElementById('downloadResume').addEventListener('click', () => {
        alert('Add your resume download link here!');
    });
}

// ==================== PANEL ====================

function initPanel() {
    // Window buttons update happens in updateWindowButtons()
}

function updateWindowButtons() {
    const container = document.getElementById('windowButtons');
    container.innerHTML = '';
    
    state.windows.forEach(win => {
        const btn = document.createElement('button');
        btn.className = 'window-button';
        btn.textContent = win.title;
        
        if (!win.minimized && win.element === state.activeWindow) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            if (win.minimized) {
                win.element.style.display = '';
                win.minimized = false;
                focusWindow(win.element);
            } else if (win.element === state.activeWindow) {
                win.element.style.display = 'none';
                win.minimized = true;
                state.activeWindow = null;
            } else {
                focusWindow(win.element);
            }
            updateWindowButtons();
        });
        
        container.appendChild(btn);
    });
}

// ==================== WINDOW MANAGEMENT ====================

function openWindow(appName) {
    // Check if already open
    const existing = state.windows.find(w => w.app === appName);
    if (existing) {
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
    
    // Load content
    win.querySelector('.window-body').innerHTML = getWindowContent(appName);
    
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
    win.style.zIndex = state.nextZIndex++;
    
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
    state.windows.push(winState);
    
    // Init controls
    initWindowControls(win, winState);
    makeDraggable(win);
    focusWindow(win);
    updateWindowButtons();
    
    // Load dynamic content
    if (appName === 'projects') loadProjects();
    if (appName === 'github') loadGitHub();
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
                <div class="loading"><div class="spinner"></div><p>Loading projects...</p></div>
            </div>
        `,
        
        github: `
            <h2>GitHub Statistics</h2>
            <div id="githubContent">
                <div class="loading"><div class="spinner"></div><p>Loading GitHub data...</p></div>
            </div>
        `,
        
        contact: `
            <div class="contact-section">
                <h2>Get In Touch</h2>
                <hr class="about-divider">
                <div class="contact-links">
                    <p><strong>Email:</strong> <a href="mailto:punangisha@gmail.com">punangisha@gmail.com</a></p>
                    <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/anjisha-pun-aaa1a6349/" target="_blank">View Profile</a></p>
                    <p><strong>GitHub:</strong> <a href="https://github.com/anjisha616" target="_blank">@anjisha616</a></p>
                </div>
                <h3>Send Message</h3>
                <form id="contactForm" class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Message" rows="5" required></textarea>
                    <button type="submit">Send</button>
                </form>
            </div>
        `
    };
    
    return content[app] || '<p>Content not found</p>';
}

// Window controls
function initWindowControls(win, winState) {
    win.querySelector('.minimize').addEventListener('click', () => {
        win.style.display = 'none';
        winState.minimized = true;
        updateWindowButtons();
    });
    
    win.querySelector('.maximize').addEventListener('click', () => {
        winState.maximized = !winState.maximized;
        win.classList.toggle('maximized');
        updateWidgetsVisibility();
    });
    
    win.querySelector('.close').addEventListener('click', () => {
        win.style.opacity = '0';
        setTimeout(() => {
            win.remove();
            state.windows = state.windows.filter(w => w !== winState);
            updateWindowButtons();
            updateWidgetsVisibility();
        }, 200);
    });
    
    win.addEventListener('mousedown', () => focusWindow(win));
}

function updateWidgetsVisibility() {
    const widgets = document.querySelector('.desktop-widgets');
    const anyMaximized = document.querySelector('.window.maximized') !== null;
    widgets.style.display = anyMaximized ? 'none' : 'flex';
}

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.style.border = 'none');
    win.style.border = '2px solid var(--accent)';
    win.style.zIndex = state.nextZIndex++;
    state.activeWindow = win;
    updateWindowButtons();
}

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
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });
    
    function drag(e) {
        if (!isDragging) return;
        win.style.left = (e.clientX - offsetX) + 'px';
        win.style.top = Math.max(0, e.clientY - offsetY) + 'px';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

// ==================== GITHUB API ====================

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        const repos = await res.json();
        
        const filtered = repos.filter(r => !EXCLUDED_REPOS.includes(r.name.toLowerCase()) && !r.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6);
        
        grid.innerHTML = '';
        
        filtered.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card github';
            card.dataset.source = 'github';
            card.innerHTML = `
                <div class="project-icon">📁</div>
                <div class="project-name">${repo.name}</div>
                <div class="project-desc">${repo.description || 'No description'}</div>
                <div class="project-meta">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🔄 ${repo.forks_count}</span>
                    <span>${repo.language || 'Code'}</span>
                </div>
            `;
            card.addEventListener('click', () => window.open(repo.html_url, '_blank'));
            grid.appendChild(card);
        });
        
        // Add Figma projects
        const figma = [
            { name: 'UI Components', desc: 'Design system library' },
            { name: 'Mobile Apps', desc: 'App UI designs' },
            { name: 'Landing Pages', desc: 'Web design concepts' }
        ];
        
        figma.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card figma';
            card.dataset.source = 'figma';
            card.innerHTML = `
                <div class="project-icon">🎨</div>
                <div class="project-name">${p.name}</div>
                <div class="project-desc">${p.desc}</div>
                <div class="project-meta"><span>Figma Design</span></div>
            `;
            card.addEventListener('click', () => window.open('https://www.figma.com/files/team/1375711861175707486/project/237173255', '_blank'));
            grid.appendChild(card);
        });
        
        // Init filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                document.querySelectorAll('.project-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.source === filter) ? 'block' : 'none';
                });
            });
        });
        
    } catch (err) {
        grid.innerHTML = '<p style="color: red;">Failed to load projects</p>';
    }
}

async function loadGitHub() {
    const content = document.getElementById('githubContent');
    
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
        const user = await res.json();
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                <div style="background: rgba(135, 206, 235, 0.1); padding: 20px; border-radius: 10px; border-left: 4px solid var(--accent);">
                    <h3>Repositories</h3>
                    <p style="font-size: 2rem; font-weight: bold; color: var(--accent);">${user.public_repos}</p>
                </div>
                <div style="background: rgba(135, 206, 235, 0.1); padding: 20px; border-radius: 10px; border-left: 4px solid var(--accent);">
                    <h3>Followers</h3>
                    <p style="font-size: 2rem; font-weight: bold; color: var(--accent);">${user.followers}</p>
                </div>
            </div>
            <h3>Contribution Graph</h3>
            <img src="https://ghchart.rshah.org/${GITHUB_USERNAME}" style="width: 100%; border-radius: 8px; margin-top: 10px;">
            <p style="text-align: center; margin-top: 20px;">
                <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" style="color: var(--accent);">View Full Profile →</a>
            </p>
        `;
    } catch (err) {
        content.innerHTML = '<p style="color: red;">Failed to load GitHub data</p>';
    }
}

// Contact form
document.addEventListener('submit', (e) => {
    if (e.target.id === 'contactForm') {
        e.preventDefault();
        alert('Message sent! (Demo - implement backend)');
        e.target.reset();
    }
});

console.log('%c🐧 Linux Mint Portfolio', 'font-size: 20px; color: #87CEEB; font-weight: bold');
console.log('%cDesigned by Anjisha Pun', 'color: #888');