
// settings all codes system



// DEFAULT States 
const DEFAULT_STATE = {
    tasks: [],
    lists: [
        { id: "personal", name: "Personal", color: "red" },
        { id: "work", name: "Work", color: "blue" },
        { id: "list1", name: "List 1", color: "yellow" }
    ],
    tags: [
        { id: "tag1", name: "Tag 1", class: "tag-1" },
        { id: "tag2", name: "Tag 2", class: "tag-2" }
    ],
    stickyNotes: [],
    profile: { name: "Guest", email: "", bio: "" },
    user: { isLoggedIn: false },
    settings: {
        theme: 'light',
        accentColor: '#7A9B76',
        language: 'en',
        weekStart: 'sunday',
        reminders: true,
        summary: false,
        compact: false
    }
};


// STORE

class Store {
    constructor() {
        this.state = this.loadState();
        this.currentView = 'today';
        this.currentList = null;
        this.currentTag = null;
        this.searchQuery = '';
        this.selectedTaskId = null;
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
    }

    loadState() {
        const saved = localStorage.getItem('taskflow_state_v3');
        if (!saved) return JSON.parse(JSON.stringify(DEFAULT_STATE));
        const parsed = JSON.parse(saved);
        return {
            ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
            ...parsed,
            settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
            profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
            user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) }
        };
    }

    saveState() {
        localStorage.setItem('taskflow_state_v3', JSON.stringify(this.state));
    }

    addTask(title, dueDate, listId = 'personal') {
        const newTask = {
            id: crypto.randomUUID(),
            title: title || 'New Task',
            completed: false,
            listId,
            tags: [],
            dueDate: dueDate || new Date().toISOString().split('T')[0],
            deadline: '',
            subtasks: []
        };
        this.state.tasks.push(newTask);
        this.saveState();
        return newTask;
    }

    updateTask(id, updates) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) { Object.assign(task, updates); this.saveState(); }
    }

    deleteTask(id) {
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.saveState();
    }

    toggleTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) { task.completed = !task.completed; this.saveState(); }
    }

    clearCompleted() {
        this.state.tasks = this.state.tasks.filter(t => !t.completed);
        this.saveState();
    }

    addSubtask(taskId, title) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks.push({ id: crypto.randomUUID(), title, completed: false });
            this.saveState();
        }
    }

    toggleSubtask(taskId, subId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            const sub = task.subtasks.find(s => s.id === subId);
            if (sub) { sub.completed = !sub.completed; this.saveState(); }
        }
    }

    deleteSubtask(taskId, subId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks = task.subtasks.filter(s => s.id !== subId);
            this.saveState();
        }
    }

    addList(name, color = 'green') {
        this.state.lists.push({ id: crypto.randomUUID(), name, color });
        this.saveState();
    }

    addTag(name) {
        const colors = ['tag-1', 'tag-2'];
        this.state.tags.push({ id: crypto.randomUUID(), name, class: colors[this.state.tags.length % 2] });
        this.saveState();
    }

    addStickyNote(title = 'New Note') {
        const colors = ['yellow', 'blue', 'pink', 'orange', 'green', 'purple'];
        this.state.stickyNotes.push({
            id: crypto.randomUUID(),
            title,
            content: 'Write something...',
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        this.saveState();
    }

    deleteStickyNote(id) {
        this.state.stickyNotes = this.state.stickyNotes.filter(n => n.id !== id);
        this.saveState();
    }

    updateStickyNote(id, field, value) {
        const note = this.state.stickyNotes.find(n => n.id === id);
        if (note) { note[field] = value; this.saveState(); }
    }

    login(email, name) {
        this.state.user.isLoggedIn = true;
        this.state.profile.email = email;
        if (name) this.state.profile.name = name;
        this.saveState();
    }

    logout() {
        this.state.user.isLoggedIn = false;
        this.state.profile.name = 'Guest';
        this.state.profile.email = '';
        this.state.profile.bio = '';
        this.saveState();
    }

    resetAll() {
        const settings = this.state.settings;
        const user = this.state.user;
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.state.settings = settings;
        this.state.user = user;
        this.saveState();
    }

    exportData() { return JSON.stringify(this.state, null, 2); }

    importData(json) { this.state = json; this.saveState(); }
}


// UI codes

class UI {
    constructor(store) {
        this.store = store;
        this.el = {
            viewContainer: document.getElementById('view-container'),
            pageTitle: document.getElementById('page-title'),
            searchInput: document.getElementById('search-input'),
            listsNav: document.getElementById('lists-nav'),
            tagsNav: document.getElementById('tags-nav'),
            detailPanel: document.getElementById('task-details'),
            detailTitle: document.getElementById('detail-title'),
            detailList: document.getElementById('detail-list'),
            detailDate: document.getElementById('detail-date'),
            detailDeadline: document.getElementById('detail-deadline'),
            detailTags: document.getElementById('detail-tags'),
            subtaskList: document.getElementById('subtask-list'),
            modalOverlay: document.getElementById('modal-overlay'),
            settingsModal: document.getElementById('settings-modal'),
            profileModal: document.getElementById('profile-modal'),
            loginModal: document.getElementById('login-modal'),
            profileMenu: document.getElementById('profile-menu'),
            hamburgerMenu: document.getElementById('hamburger-menu'),
            sidebar: document.getElementById('sidebar'),
            backdrop: document.getElementById('mobile-backdrop'),
            bottomNav: document.getElementById('bottom-nav')
        };
    }

    render() {
        this.applySettings();
        this.renderSidebar();
        this.renderMainView();
        this.updateBadges();
        this.updateProfileUI();
        this.updateBottomNav();
    }

    applySettings() {
        const s = this.store.state.settings;
        document.body.classList.toggle('dark-mode', s.theme === 'dark');
        document.body.classList.toggle('compact-mode', s.compact);
        document.documentElement.style.setProperty('--primary', s.accentColor);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.content = s.theme === 'dark' ? '#1E2621' : '#7A9B76';
    }

    updateProfileUI() {
        const p = this.store.state.profile;
        const logged = this.store.state.user.isLoggedIn;
        const initial = (p.name || 'G').charAt(0).toUpperCase();

        document.getElementById('header-avatar').textContent = initial;
        document.getElementById('menu-avatar').textContent = initial;
        document.getElementById('menu-name').textContent = p.name || 'Guest';
        document.getElementById('menu-email').textContent = p.email || 'Not signed in';
        document.getElementById('profile-avatar').textContent = initial;

        document.getElementById('menu-login').style.display = logged ? 'none' : 'flex';
        document.getElementById('menu-logout').style.display = logged ? 'flex' : 'none';
    }

    updateBottomNav() {
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === this.store.currentView);
        });
    }

    renderSidebar() {
        this.el.listsNav.innerHTML = this.store.state.lists.map(list => `
            <li class="list-item" data-list-id="${list.id}">
                <span class="dot ${list.color}"></span> ${list.name} 
                <span class="badge">${this.store.state.tasks.filter(t => t.listId === list.id && !t.completed).length}</span>
            </li>
        `).join('');

        this.el.tagsNav.innerHTML = this.store.state.tags.map(tag => `
            <span class="tag ${tag.class}" data-tag-id="${tag.id}">${tag.name}</span>
        `).join('');
    }

    updateBadges() {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = this.store.state.tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
        const upcomingCount = this.store.state.tasks.filter(t => t.dueDate > todayStr && !t.completed).length;
        const deadlineCount = this.store.state.tasks.filter(t => t.deadline && !t.completed).length;
        document.getElementById('badge-today').textContent = todayCount;
        document.getElementById('badge-upcoming').textContent = upcomingCount;
        document.getElementById('badge-deadline').textContent = deadlineCount;
    }

    getFilteredTasks() {
        let tasks = [...this.store.state.tasks];
        const todayStr = new Date().toISOString().split('T')[0];

        if (this.store.currentView === 'today') {
            tasks = tasks.filter(t => t.dueDate === todayStr);
        } else if (this.store.currentView === 'upcoming') {
            tasks = tasks.filter(t => t.dueDate > todayStr);
        } else if (this.store.currentView === 'deadline') {
            tasks = tasks.filter(t => t.deadline);
        }

        if (this.store.currentList) tasks = tasks.filter(t => t.listId === this.store.currentList);
        if (this.store.currentTag) tasks = tasks.filter(t => t.tags.includes(this.store.currentTag));
        if (this.store.searchQuery) {
            const q = this.store.searchQuery.toLowerCase();
            tasks = tasks.filter(t => t.title.toLowerCase().includes(q));
        }
        return tasks;
    }

    renderMainView() {
        const filtered = this.getFilteredTasks();

        if (this.store.currentView === 'today') {
            this.el.pageTitle.innerHTML = `Today <span class="count">${filtered.filter(t => !t.completed).length}</span>`;
            this.renderTaskList(filtered, 'today');
        } else if (this.store.currentView === 'upcoming') {
            this.el.pageTitle.innerHTML = `Upcoming <span class="count">${filtered.length}</span>`;
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTasks = filtered.filter(t => t.dueDate <= todayStr);
            const tomorrowTasks = filtered.filter(t => t.dueDate === tomorrowStr);
            const laterTasks = filtered.filter(t => t.dueDate > tomorrowStr);
            const isMobile = window.innerWidth <= 768;

            this.el.viewContainer.innerHTML = `
                <div style="display:grid; grid-template-columns: ${isMobile ? '1fr' : '1fr 1fr'}; gap: ${isMobile ? '24px' : '30px'};">
                    <div>
                        <h3 style="margin-bottom:15px; font-size:13px; color:var(--text-muted); letter-spacing:1px;">TODAY</h3>
                        ${this.renderTaskHTML(todayTasks)}
                        <h3 style="margin: 24px 0 15px 0; font-size:13px; color:var(--text-muted); letter-spacing:1px;">TOMORROW</h3>
                        ${this.renderTaskHTML(tomorrowTasks)}
                    </div>
                    <div>
                        <h3 style="margin-bottom:15px; font-size:13px; color:var(--text-muted); letter-spacing:1px;">THIS WEEK</h3>
                        ${this.renderTaskHTML(laterTasks)}
                    </div>
                </div>
            `;
        } else if (this.store.currentView === 'deadline') {
            this.el.pageTitle.innerHTML = `⏰ Deadline <span class="count">${filtered.length}</span>`;
            const sorted = [...filtered].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
            this.renderTaskList(sorted, 'deadline');
        } else if (this.store.currentView === 'calendar') {
            this.el.pageTitle.innerHTML = `Calendar`;
            this.renderCalendar();
        } else if (this.store.currentView === 'journey') {
            this.el.pageTitle.innerHTML = `Journey`;
            this.renderJourney();
        }

        this.updateBottomNav();
    }

    emptyStateHTML(type) {
        const messages = {
            today: { icon: '🌿', title: 'No tasks for today', desc: 'Enjoy your day or add a new task.' },
            deadline: { icon: '⏰', title: 'No deadlines yet', desc: 'Add a deadline to your tasks to track them here.' },
            default: { icon: '📝', title: 'Nothing here', desc: 'Start by adding a new task.' }
        };
        const m = messages[type] || messages.default;
        return `
            <div class="empty-state">
                <div class="icon">${m.icon}</div>
                <h3>${m.title}</h3>
                <p>${m.desc}</p>
            </div>
        `;
    }

    renderTaskHTML(tasks) {
        if (tasks.length === 0) return `<div style="color:var(--text-muted); padding: 12px 0; font-size:13px;">— No tasks —</div>`;
        return tasks.map(task => {
            const list = this.store.state.lists.find(l => l.id === task.listId) || {name: 'Unknown', color: 'blue'};
            let deadlineHTML = '';
            if (task.deadline) {
                const dl = new Date(task.deadline);
                const now = new Date();
                const isOverdue = dl < now && !task.completed;
                const cls = isOverdue ? 'deadline-badge' : 'deadline-badge ok';
                const label = isOverdue ? '⚠ Overdue' : '⏰ ' + dl.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                deadlineHTML = `<span class="${cls}">${label}</span>`;
            }
            return `
            <div class="task-item ${task.completed ? 'completed' : ''}" onclick="app.openTaskDetails('${task.id}')">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask(event, '${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        📅 ${task.dueDate}
                        ${task.subtasks.length > 0 ? `📝 ${task.subtasks.filter(s => !s.completed).length} Subtasks` : ''}
                        ${task.tags.map(tId => {
                            const tag = this.store.state.tags.find(t => t.id === tId);
                            return tag ? `<span class="tag ${tag.class}">${tag.name}</span>` : '';
                        }).join('')}
                        ${deadlineHTML}
                        <span class="dot ${list.color}" style="width:6px;height:6px;display:inline-block;"></span> ${list.name}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    renderTaskList(tasks, type = 'today') {
        const emptyType = type === 'today' ? 'today' : (type === 'deadline' ? 'deadline' : 'default');
        this.el.viewContainer.innerHTML = `
            <div class="task-list-container">
                <div class="add-task-btn" onclick="app.addNewTask()">+ Add New Task</div>
                ${tasks.length === 0 ? this.emptyStateHTML(emptyType) : this.renderTaskHTML(tasks)}
            </div>
        `;
    }

    renderCalendar() {
        const { currentYear, currentMonth } = this.store;
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const isMobile = window.innerWidth <= 768;
        const dayNames = isMobile
            ? ['S','M','T','W','T','F','S']
            : ['SUN','MON','TUE','WED','THU','FRI','SAT'];

        let daysHTML = '';
        for (let i = 0; i < firstDay; i++) daysHTML += `<div class="calendar-day empty"></div>`;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayTasks = this.store.state.tasks.filter(t => t.dueDate === dateStr);
            const hasTask = dayTasks.length > 0;

            daysHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}" onclick="app.addTaskOnDate('${dateStr}')">
                    <span class="day-num">${i}</span>
                    ${dayTasks.slice(0, 3).map(t => `<div class="calendar-event ${t.completed ? 'done' : ''}" title="${t.title}">${t.title}</div>`).join('')}
                    ${dayTasks.length > 3 ? `<div style="font-size:10px; color:var(--text-muted);">+${dayTasks.length - 3}</div>` : ''}
                </div>
            `;
        }

        this.el.viewContainer.innerHTML = `
            <div class="calendar-controls">
                <div class="calendar-nav">
                    <button onclick="app.prevMonth()">‹</button>
                    <span class="calendar-title">${monthNames[currentMonth]} ${currentYear}</span>
                    <button onclick="app.nextMonth()">›</button>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-outline" onclick="app.goToToday()">Today</button>
                    <button class="btn-pro" onclick="app.addTaskOnDate('${todayStr}')">+ Task</button>
                </div>
            </div>
            <div class="calendar-grid">
                ${dayNames.map(d => `<div class="calendar-header">${d}</div>`).join('')}
                ${daysHTML}
            </div>
        `;
    }

    renderJourney() {
        this.el.viewContainer.innerHTML = `
            <div class="journey-grid">
                ${this.store.state.stickyNotes.map(note => `
                    <div class="sticky-note ${note.color}">
                        <button class="note-delete" onclick="app.deleteStickyNote('${note.id}')" title="Delete">✕</button>
                        <h3 contenteditable="true" 
                            onblur="app.updateNote('${note.id}', 'title', this.textContent)">${note.title}</h3>
                        <p contenteditable="true" 
                           onblur="app.updateNote('${note.id}', 'content', this.innerText)">${note.content}</p>
                    </div>
                `).join('')}
                <div class="sticky-note gray" onclick="app.addStickyNote()">+</div>
            </div>
        `;
    }

    openDetails(taskId) {
        const task = this.store.state.tasks.find(t => t.id === taskId);
        if (!task) return;
        this.store.selectedTaskId = taskId;

        this.el.detailTitle.value = task.title;
        this.el.detailDate.value = task.dueDate;
        this.el.detailDeadline.value = task.deadline || '';
        this.el.detailList.innerHTML = this.store.state.lists.map(l =>
            `<option value="${l.id}" ${l.id === task.listId ? 'selected' : ''}>${l.name}</option>`
        ).join('');

        this.el.detailTags.innerHTML = this.store.state.tags.map(t =>
            `<span class="tag ${t.class}" style="opacity: ${task.tags.includes(t.id) ? 1 : 0.4};" onclick="app.toggleTaskTag('${task.id}', '${t.id}')">${t.name}</span>`
        ).join('');

        this.renderSubtasks(task);
        this.el.detailPanel.classList.add('show');

        if (window.innerWidth <= 768) {
            this.el.backdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    renderSubtasks(task) {
        this.el.subtaskList.innerHTML = task.subtasks.map(sub => `
            <div class="subtask-item">
                <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="app.toggleSubtask('${task.id}', '${sub.id}')">
                <span style="${sub.completed ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${sub.title}</span>
                <span class="delete-sub" onclick="app.deleteSubtask('${task.id}', '${sub.id}')">✕</span>
            </div>
        `).join('');
    }

    closeDetails() {
        this.el.detailPanel.classList.remove('show');
        this.store.selectedTaskId = null;
        if (window.innerWidth <= 768) {
            this.el.backdrop.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showModal(title, callback, defaultValue = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-input').value = defaultValue;
        this.el.modalOverlay.classList.add('show');
        setTimeout(() => document.getElementById('modal-input').focus(), 100);

        const confirmBtn = document.getElementById('modal-confirm');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
            const val = document.getElementById('modal-input').value.trim();
            if (val) { callback(val); this.el.modalOverlay.classList.remove('show'); }
        });

        const cancelBtn = document.getElementById('modal-cancel');
        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.replaceWith(newCancel);
        newCancel.addEventListener('click', () => this.el.modalOverlay.classList.remove('show'));
    }

    showSettings() {
        const s = this.store.state.settings;
        document.getElementById('setting-language').value = s.language;
        document.getElementById('setting-week-start').value = s.weekStart;
        document.getElementById('setting-dark-mode').checked = s.theme === 'dark';
        document.getElementById('setting-accent').value = s.accentColor;
        document.getElementById('setting-compact').checked = s.compact;
        document.getElementById('setting-reminders').checked = s.reminders;
        document.getElementById('setting-summary').checked = s.summary;
        this.el.settingsModal.classList.add('show');
    }

    showProfile() {
        const p = this.store.state.profile;
        document.getElementById('profile-name').value = p.name === 'Guest' ? '' : p.name;
        document.getElementById('profile-email').value = p.email;
        document.getElementById('profile-bio').value = p.bio;
        this.el.profileModal.classList.add('show');
    }

    showLogin() {
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        this.el.loginModal.classList.add('show');
        setTimeout(() => document.getElementById('login-email').focus(), 100);
    }

    openMobileSidebar() {
        this.el.sidebar.classList.add('mobile-open');
        this.el.backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeMobileSidebar() {
        this.el.sidebar.classList.remove('mobile-open');
        if (!this.el.detailPanel.classList.contains('show')) {
            this.el.backdrop.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
}


// APP Controller codes

class App {
    constructor() {
        this.store = new Store();
        this.ui = new UI(this.store);
        this.init();
    }

    init() {
        this.ui.render();
        this.bindEvents();
    }

    // -- Navigations
    bindEvents() { 
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.store.currentView = e.currentTarget.dataset.view;
                this.store.currentList = null;
                this.store.currentTag = null;
                this.store.searchQuery = '';
                this.ui.renderMainView();
                if (window.innerWidth <= 768) this.ui.closeMobileSidebar();
            });
        });

        // -- Bottom Navi Mobile
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.store.currentView = view;
                this.store.currentList = null;
                this.store.currentTag = null;
                this.store.searchQuery = '';

                // Active state is synchronize also at sidebar
                document.querySelectorAll('.nav-item').forEach(n => {
                    n.classList.toggle('active', n.dataset.view === view);
                });

                this.ui.renderMainView();
                this.ui.updateBottomNav();
            });
        });

        // ---- Collapsible groups ----
        document.querySelectorAll('.group-title.collapsible').forEach(title => {
            title.addEventListener('click', () => {
                const target = document.querySelector(`[data-section="${title.dataset.target}"]`);
                if (target) {
                    target.classList.toggle('collapsed');
                    title.classList.toggle('collapsed');
                }
            });
        });

        // ---- List filter ---
        this.ui.el.listsNav.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-list-id]');
            if (li) {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                this.store.currentView = 'today';
                this.store.currentList = li.dataset.listId;
                this.store.currentTag = null;
                this.ui.renderMainView();
                if (window.innerWidth <= 768) this.ui.closeMobileSidebar();
            }
        });

        // ---- Tags filter --
        this.ui.el.tagsNav.addEventListener('click', (e) => {
            const tag = e.target.closest('.tag');
            if (tag) {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                this.store.currentView = 'today';
                this.store.currentTag = tag.dataset.tagId;
                this.store.currentList = null;
                this.ui.renderMainView();
                if (window.innerWidth <= 768) this.ui.closeMobileSidebar();
            }
        });

        // ---- Search (hidden, ready for future) ----
        this.ui.el.searchInput.addEventListener('input', (e) => {
            this.store.searchQuery = e.target.value;
            this.ui.renderMainView();
        });

        // ---- Add list/tag ---
        document.getElementById('btn-add-list').addEventListener('click', () => {
            this.ui.showModal('Add New List', (name) => {
                this.store.addList(name);
                this.ui.renderSidebar();
            });
        });
        document.getElementById('btn-add-tag').addEventListener('click', () => {
            this.ui.showModal('Add New Tag', (name) => {
                this.store.addTag(name);
                this.ui.renderSidebar();
            });
        });

        // ---- Topbar --
        document.getElementById('btn-add-event').addEventListener('click', () => this.addNewTask());
        document.getElementById('btn-clear-done').addEventListener('click', () => {
            if (confirm('Clear all completed tasks?')) {
                this.store.clearCompleted();
                this.ui.render();
            }
        });
        document.getElementById('btn-mobile-add').addEventListener('click', () => this.addNewTask());

        // ---- Mobile menu button ----
        document.getElementById('btn-mobile-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            this.ui.openMobileSidebar();
        });
        document.getElementById('btn-close-sidebar').addEventListener('click', () => {
            this.ui.closeMobileSidebar();
        });

        // ---- Backdrop click ---
        this.ui.el.backdrop.addEventListener('click', () => {
            this.ui.closeMobileSidebar();
        });

        // ---- Profile & Hamburger toggles --
        document.getElementById('btn-profile').addEventListener('click', (e) => {
            e.stopPropagation();
            this.ui.el.profileMenu.classList.toggle('show');
            this.ui.el.hamburgerMenu.classList.remove('show');
        });
        document.getElementById('btn-hamburger').addEventListener('click', (e) => {
            e.stopPropagation();
            this.ui.el.hamburgerMenu.classList.toggle('show');
            this.ui.el.profileMenu.classList.remove('show');
        });

        // ---- Profile dropdown -
        this.ui.el.profileMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;
            const action = item.dataset.action;
            this.ui.el.profileMenu.classList.remove('show');

            if (action === 'profile') this.ui.showProfile();
            else if (action === 'settings') this.ui.showSettings();
            else if (action === 'toggle-theme') this.toggleTheme();
            else if (action === 'login') this.ui.showLogin();
            else if (action === 'logout') this.logout();
        });

        // --- Hamburger dropdown ----
        this.ui.el.hamburgerMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;
            const action = item.dataset.action;
            this.ui.el.hamburgerMenu.classList.remove('show');

            if (action === 'tasks') document.querySelector('[data-target="tasks-section"]').click();
            else if (action === 'lists') document.querySelector('[data-target="lists-section"]').click();
            else if (action === 'profile') this.ui.showProfile();
        });

        // ---- Close dropdowns on outside click ---
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-wrapper')) this.ui.el.profileMenu.classList.remove('show');
            if (!e.target.closest('.brand')) this.ui.el.hamburgerMenu.classList.remove('show');
        });

        // ---- Sidebar bottom --
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.ui.showSettings();
            if (window.innerWidth <= 768) this.ui.closeMobileSidebar();
        });
        document.getElementById('btn-signout-side').addEventListener('click', () => {
            if (this.store.state.user.isLoggedIn) this.logout();
            else this.ui.showLogin();
            if (window.innerWidth <= 768) this.ui.closeMobileSidebar();
        });

        // ----(( Task details ))----
        document.getElementById('close-details').addEventListener('click', () => this.ui.closeDetails());
        document.getElementById('btn-back-details').addEventListener('click', () => this.ui.closeDetails());
        document.getElementById('btn-save-task').addEventListener('click', () => this.saveTaskDetails());
        document.getElementById('btn-delete-task').addEventListener('click', () => {
            if (this.store.selectedTaskId && confirm('Delete this task?')) {
                this.store.deleteTask(this.store.selectedTaskId);
                this.ui.render();
                this.ui.closeDetails();
            }
        });
        document.getElementById('btn-add-subtask').addEventListener('click', () => {
            if (this.store.selectedTaskId) {
                this.ui.showModal('Add Subtask', (title) => {
                    this.store.addSubtask(this.store.selectedTaskId, title);
                    const task = this.store.state.tasks.find(t => t.id === this.store.selectedTaskId);
                    this.ui.renderSubtasks(task);
                });
            }
        });

        // ---- Settings modal ---
        document.getElementById('settings-close').addEventListener('click', () => this.ui.el.settingsModal.classList.remove('show'));
        this.ui.el.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.ui.el.settingsModal) this.ui.el.settingsModal.classList.remove('show');
        });

        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector(`[data-pane="${tab.dataset.tab}"]`).classList.add('active');
            });
        });

        // ---- Settings values --
        document.getElementById('setting-dark-mode').addEventListener('change', (e) => {
            this.store.state.settings.theme = e.target.checked ? 'dark' : 'light';
            this.store.saveState();
            this.ui.applySettings();
        });
        document.getElementById('setting-accent').addEventListener('input', (e) => {
            this.store.state.settings.accentColor = e.target.value;
            this.store.saveState();
            this.ui.applySettings();
        });
        document.getElementById('setting-compact').addEventListener('change', (e) => {
            this.store.state.settings.compact = e.target.checked;
            this.store.saveState();
            this.ui.applySettings();
        });
        document.getElementById('setting-language').addEventListener('change', (e) => {
            this.store.state.settings.language = e.target.value;
            this.store.saveState();
        });
        document.getElementById('setting-week-start').addEventListener('change', (e) => {
            this.store.state.settings.weekStart = e.target.value;
            this.store.saveState();
        });
        document.getElementById('setting-reminders').addEventListener('change', (e) => {
            this.store.state.settings.reminders = e.target.checked;
            this.store.saveState();
        });
        document.getElementById('setting-summary').addEventListener('change', (e) => {
            this.store.state.settings.summary = e.target.checked;
            this.store.saveState();
        });

        // ---- Export/Import/Reset -
        document.getElementById('btn-export').addEventListener('click', () => this.exportData());
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => this.importData(e));
        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('Reset all data? This cannot be undone.')) {
                this.store.resetAll();
                this.ui.render();
                this.ui.el.settingsModal.classList.remove('show');
            }
        });

        // ---- Profile modal ----
        document.getElementById('profile-cancel').addEventListener('click', () => this.ui.el.profileModal.classList.remove('show'));
        document.getElementById('profile-save').addEventListener('click', () => {
            const name = document.getElementById('profile-name').value.trim() || 'Guest';
            this.store.state.profile = {
                name,
                email: document.getElementById('profile-email').value,
                bio: document.getElementById('profile-bio').value
            };
            this.store.saveState();
            this.ui.updateProfileUI();
            this.ui.el.profileModal.classList.remove('show');
        });
        this.ui.el.profileModal.addEventListener('click', (e) => {
            if (e.target === this.ui.el.profileModal) this.ui.el.profileModal.classList.remove('show');
        });

        // ---- Login card ---
        document.getElementById('login-cancel').addEventListener('click', () => this.ui.el.loginModal.classList.remove('show'));
        document.getElementById('login-submit').addEventListener('click', () => {
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            if (!email || !pass) { alert('Please fill email and password.'); return; }
            const name = email.split('@')[0];
            this.store.login(email, name.charAt(0).toUpperCase() + name.slice(1));
            this.ui.updateProfileUI();
            this.ui.el.loginModal.classList.remove('show');
        });
        this.ui.el.loginModal.addEventListener('click', (e) => {
            if (e.target === this.ui.el.loginModal) this.ui.el.loginModal.classList.remove('show');
        });

        // ---- Escape closes everything ---
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                ['modalOverlay','settingsModal','profileModal','loginModal'].forEach(k => this.ui.el[k].classList.remove('show'));
                this.ui.el.profileMenu.classList.remove('show');
                this.ui.el.hamburgerMenu.classList.remove('show');
                this.ui.closeMobileSidebar();
                this.ui.closeDetails();
            }
        });

        // ---- Window resize handler ---
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.ui.closeMobileSidebar();
                document.body.style.overflow = '';
            }
            // Re-render untuk update layout (misal, grid calendar)
            if (this.store.currentView === 'calendar' || this.store.currentView === 'upcoming') {
                this.ui.renderMainView();
            }
        });

        // ---- gestured swipe for sidebar mobile (Bonus) --
        let touchStartX = 0;
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (window.innerWidth > 768) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = Math.abs(touchEndY - touchStartY);

            // Swipe from left edge to open sidebar
            if (touchStartX < 30 && diffX > 80 && diffY < 60) {
                this.ui.openMobileSidebar();
            }
            // Swipe from right side of sidebar to close
            if (touchStartX < 300 && diffX < -80 && diffY < 60 && this.ui.el.sidebar.classList.contains('mobile-open')) {
                this.ui.closeMobileSidebar();
            }
        }, { passive: true });
    }

    // ====== ACTIONS ===-
    addNewTask() {
        const date = new Date().toISOString().split('T')[0];
        const newTask = this.store.addTask('New Task', date, this.store.currentList || 'personal');
        this.ui.render();
        this.openTaskDetails(newTask.id);
    }

    addTaskOnDate(dateStr) {
        const newTask = this.store.addTask('New Task', dateStr, this.store.currentList || 'personal');
        this.ui.render();
        this.openTaskDetails(newTask.id);
    }

    toggleTask(event, id) {
        event.stopPropagation();
        this.store.toggleTask(id);
        this.ui.render();
    }

    openTaskDetails(id) { this.ui.openDetails(id); }

    saveTaskDetails() {
        if (!this.store.selectedTaskId) return;
        this.store.updateTask(this.store.selectedTaskId, {
            title: this.ui.el.detailTitle.value,
            dueDate: this.ui.el.detailDate.value,
            deadline: this.ui.el.detailDeadline.value,
            listId: this.ui.el.detailList.value
        });
        this.ui.render();
        this.ui.closeDetails();
    }

    toggleTaskTag(taskId, tagId) {
        const task = this.store.state.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.tags.includes(tagId)) task.tags = task.tags.filter(t => t !== tagId);
            else task.tags.push(tagId);
            this.store.saveState();
            this.ui.openDetails(taskId);
        }
    }

    toggleSubtask(taskId, subId) {
        this.store.toggleSubtask(taskId, subId);
        const task = this.store.state.tasks.find(t => t.id === taskId);
        this.ui.renderSubtasks(task);
    }

    deleteSubtask(taskId, subId) {
        this.store.deleteSubtask(taskId, subId);
        const task = this.store.state.tasks.find(t => t.id === taskId);
        this.ui.renderSubtasks(task);
    }

    prevMonth() {
        this.store.currentMonth--;
        if (this.store.currentMonth < 0) { this.store.currentMonth = 11; this.store.currentYear--; }
        this.ui.renderCalendar();
    }
    nextMonth() {
        this.store.currentMonth++;
        if (this.store.currentMonth > 11) { this.store.currentMonth = 0; this.store.currentYear++; }
        this.ui.renderCalendar();
    }
    goToToday() {
        const now = new Date();
        this.store.currentYear = now.getFullYear();
        this.store.currentMonth = now.getMonth();
        this.ui.renderCalendar();
    }

    addStickyNote() {
        this.ui.showModal('New Journey Note', (title) => {
            this.store.addStickyNote(title);
            this.ui.renderJourney();
        });
    }
    deleteStickyNote(id) {
        if (confirm('Delete this note?')) {
            this.store.deleteStickyNote(id);
            this.ui.renderJourney();
        }
    }
    updateNote(id, field, value) { this.store.updateStickyNote(id, field, value); }

    toggleTheme() {
        const newTheme = this.store.state.settings.theme === 'dark' ? 'light' : 'dark';
        this.store.state.settings.theme = newTheme;
        this.store.saveState();
        this.ui.applySettings();
        const toggle = document.getElementById('setting-dark-mode');
        if (toggle) toggle.checked = newTheme === 'dark';
    }

    logout() {
        if (confirm('Log out from TaskFlow?')) {
            this.store.logout();
            this.ui.updateProfileUI();
            this.ui.render();
        }
    }

    exportData() {
        const data = this.store.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.store.importData(data);
                this.ui.render();
                alert('Data imported successfully!');
                this.ui.el.settingsModal.classList.remove('show');
            } catch (err) {
                alert('Invalid file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}


// BOOT

const app = new App();