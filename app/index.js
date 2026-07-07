/* ==========================================================================
   QUANTUMTASK CORE APPLICATION LOGIC (WITH BACKEND SYNC)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  
  let state = {
    tasks: [],
    activeCategory: 'all',
    activePriority: 'all',
    searchQuery: '',
    sortBy: 'date-new',
    soundEnabled: localStorage.getItem('quantum_sound') !== 'false',
    theme: localStorage.getItem('quantum_theme') || 'dark',
    stats: {
      createdToday: 0,
      completedToday: 0,
      lastStatReset: new Date().toDateString()
    }
  };

  // Connection status flag
  let isBackendConnected = true;

  // Quotes Database
  const quotes = [
    "The secret of getting ahead is getting started. — Mark Twain",
    "Focus on being productive instead of busy. — Tim Ferriss",
    "Action is the foundational key to all success. — Pablo Picasso",
    "Don't wish it were easier. Wish you were better. — Jim Rohn",
    "Done is better than perfect. — Sheryl Sandberg",
    "Your mind is for having ideas, not holding them. — David Allen",
    "Great things are done by a series of small things brought together. — Vincent Van Gogh",
    "Make each day your masterpiece. — John Wooden",
    "You miss 100% of the shots you don't take. — Wayne Gretzky"
  ];

  // Demo tasks fallback
  function getDemoTasks() {
    return [
      {
        id: 'demo-1',
        title: 'Explore QuantumTask capabilities',
        desc: 'Hover over this card to see the 3D tilt effect in action! Try checking/unchecking items too.',
        category: 'ideas',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        title: 'Review codebase structures',
        desc: 'Examine stylesheet rules, layouts, and DOM event wiring patterns.',
        category: 'work',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0], // today
        completed: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'demo-3',
        title: 'Buy fresh items for cooking',
        desc: 'Include organic greens, sourdough bread, and coffee beans.',
        category: 'shopping',
        priority: 'low',
        dueDate: '',
        completed: false,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }

  // ==========================================================================
  // REST API WORKER
  // ==========================================================================
  
  async function apiCall(endpoint, method = 'GET', body = null) {
    if (!isBackendConnected && endpoint !== '/stats') {
      throw new Error('Offline mode active');
    }
    
    try {
      const url = `/api${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`Server returned code ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (isBackendConnected) {
        isBackendConnected = false;
        console.warn('Lost connection to backend server. Switching to LocalStorage.');
        showToast('Connection to backend lost. Offline mode active.', 'info');
      }
      throw err;
    }
  }

  // Check and reset daily stats if date changed
  function checkDailyStatsReset() {
    const today = new Date().toDateString();
    if (state.stats.lastStatReset !== today) {
      state.stats.createdToday = 0;
      state.stats.completedToday = 0;
      state.stats.lastStatReset = today;
      
      if (isBackendConnected) {
        apiCall('/stats', 'POST', state.stats).catch(() => {});
      } else {
        localStorage.setItem('quantum_stat_created', 0);
        localStorage.setItem('quantum_stat_completed', 0);
        localStorage.setItem('quantum_stat_reset', today);
      }
    }
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem('quantum_tasks', JSON.stringify(state.tasks));
  }

  function saveStatsToLocalStorage() {
    localStorage.setItem('quantum_stat_created', state.stats.createdToday);
    localStorage.setItem('quantum_stat_completed', state.stats.completedToday);
    localStorage.setItem('quantum_stat_reset', state.stats.lastStatReset);
  }

  // ==========================================================================
  // AUDIO SYNTHESIZER (WEB AUDIO API)
  // ==========================================================================
  
  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
    }
    
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    
    playPop() {
      if (!state.soundEnabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }
    
    playChime() {
      if (!state.soundEnabled) return;
      this.init();
      
      const playNote = (freq, startTime, duration, vol = 0.06) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = this.ctx.currentTime;
      playNote(523.25, now, 0.12);        // C5
      playNote(659.25, now + 0.06, 0.12); // E5
      playNote(783.99, now + 0.12, 0.12); // G5
      playNote(1046.50, now + 0.18, 0.3, 0.08); // C6
    }
    
    playDelete() {
      if (!state.soundEnabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sawtooth';
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);
      
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.14);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    }
    
    playClick() {
      if (!state.soundEnabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    }
  }
  
  const sound = new SoundSynthesizer();

  // ==========================================================================
  // CONFETTI CANVAS ENGINE
  // ==========================================================================
  
  class ConfettiEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;
      this.colors = ['#8b5cf6', '#d946ef', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#0ea5e9'];
      
      window.addEventListener('resize', () => this.resize());
      this.resize();
    }
    
    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    spawn(x, y) {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
          vy: Math.sin(angle) * speed - (2 + Math.random() * 5),
          size: 4 + Math.random() * 7,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          alpha: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle',
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.25,
          gravity: 0.18 + Math.random() * 0.15,
          decay: 0.012 + Math.random() * 0.012
        });
      }
      
      if (!this.animationId) {
        this.loop();
      }
    }
    
    loop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        
        if (p.alpha <= 0 || p.x < 0 || p.x > this.canvas.width || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.fillStyle = p.color;
        
        if (p.shape === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        
        this.ctx.restore();
      }
      
      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.loop());
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animationId = null;
      }
    }
  }
  
  const confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));

  // ==========================================================================
  // DOM ELEMENT CACHE
  // ==========================================================================
  
  const elements = {
    todoForm: document.getElementById('todo-form'),
    taskTitle: document.getElementById('task-title'),
    taskDesc: document.getElementById('task-desc'),
    taskCategorySelect: document.getElementById('task-category-select'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskDuedate: document.getElementById('task-duedate'),
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    priorityFilters: document.querySelectorAll('.priority-filter-btn'),
    sortSelect: document.getElementById('sort-select'),
    soundToggle: document.getElementById('sound-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    categories: document.querySelectorAll('.category-item'),
    progressCircle: document.getElementById('progress-circle'),
    progressText: document.getElementById('progress-text'),
    greeting: document.getElementById('greeting'),
    currentDate: document.getElementById('current-date'),
    statCreatedToday: document.getElementById('stat-created-today'),
    statDoneToday: document.getElementById('stat-done-today'),
    quoteBox: document.getElementById('quote-box'),
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // COMPONENT ANIMATIONS & EFFECTS (TILT & MAGNETIC)
  // ==========================================================================
  
  function apply3DTilt(element) {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      
      const rotY = ((x / w) - 0.5) * 12;
      const rotX = -(((y / h) - 0.5) * 10);
      
      element.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`;
      
      const glow = element.querySelector('.card-glow');
      if (glow) {
        glow.style.setProperty('--mouse-x', `${(x / w) * 100}%`);
        glow.style.setProperty('--mouse-y', `${(y / h) * 100}%`);
      }
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  }

  function applyMagneticEffect(element) {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      element.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translate(0px, 0px)';
    });
  }

  // ==========================================================================
  // VIEW TRANSITIONS ROUTER
  // ==========================================================================
  
  function updateDOMState(callback) {
    if (document.startViewTransition) {
      document.startViewTransition(callback);
    } else {
      callback();
    }
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '';
    if (type === 'success') {
      icon = `<svg class="toast-success-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>`;
    } else {
      icon = `<svg class="toast-info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>`;
    }
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slide-in-toast 0.3s ease reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2700);
  }

  // ==========================================================================
  // CORE API SYNCHRONIZATIONS
  // ==========================================================================
  
  async function loadInitialData() {
    try {
      showToast('Synchronizing with server...', 'info');
      const serverTasks = await apiCall('/tasks');
      const serverStats = await apiCall('/stats');
      
      state.tasks = serverTasks;
      state.stats = serverStats;
      isBackendConnected = true;
      showToast('Backend online. Data loaded successfully.', 'success');
    } catch (err) {
      // Fallback: LocalStorage database
      isBackendConnected = false;
      state.tasks = JSON.parse(localStorage.getItem('quantum_tasks')) || getDemoTasks();
      state.stats = {
        createdToday: parseInt(localStorage.getItem('quantum_stat_created')) || 0,
        completedToday: parseInt(localStorage.getItem('quantum_stat_completed')) || 0,
        lastStatReset: localStorage.getItem('quantum_stat_reset') || new Date().toDateString()
      };
      saveTasksToLocalStorage();
      saveStatsToLocalStorage();
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    
    const title = elements.taskTitle.value.trim();
    const desc = elements.taskDesc.value.trim();
    const category = elements.taskCategorySelect.value;
    const priority = elements.taskPrioritySelect.value;
    const dueDate = elements.taskDuedate.value;
    
    if (!title) return;
    
    const payload = { title, desc, category, priority, dueDate };
    
    checkDailyStatsReset();
    state.stats.createdToday++;
    
    if (isBackendConnected) {
      try {
        const addedTask = await apiCall('/tasks', 'POST', payload);
        state.tasks.unshift(addedTask);
        await apiCall('/stats', 'POST', { createdToday: state.stats.createdToday });
        showToast('Task saved to database', 'success');
      } catch (err) {
        // Switch to local recovery
        fallbackAddTask(payload);
      }
    } else {
      fallbackAddTask(payload);
    }
    
    sound.playPop();
    elements.todoForm.reset();
    elements.taskPrioritySelect.value = 'medium';
    updateStatsDisplay();
    
    updateDOMState(() => {
      render();
    });
  }

  function fallbackAddTask(payload) {
    const newTask = {
      id: 'task-' + Date.now(),
      ...payload,
      completed: false,
      createdAt: new Date().toISOString()
    };
    state.tasks.unshift(newTask);
    saveTasksToLocalStorage();
    saveStatsToLocalStorage();
  }

  async function toggleTaskComplete(id, checkboxEl) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    const originalState = task.completed;
    task.completed = !task.completed;
    
    checkDailyStatsReset();
    if (task.completed) {
      state.stats.completedToday++;
    } else if (state.stats.completedToday > 0) {
      state.stats.completedToday--;
    }
    
    if (isBackendConnected) {
      try {
        await apiCall(`/tasks/${id}`, 'PUT', { completed: task.completed });
        await apiCall('/stats', 'POST', { completedToday: state.stats.completedToday });
      } catch (err) {
        // Fallback local write
        saveTasksToLocalStorage();
        saveStatsToLocalStorage();
      }
    } else {
      saveTasksToLocalStorage();
      saveStatsToLocalStorage();
    }
    
    // Animate UI triggers
    if (task.completed) {
      const rect = checkboxEl.getBoundingClientRect();
      confetti.spawn(rect.left + rect.width / 2, rect.top + rect.height / 2);
      sound.playChime();
      showToast('Task completed!', 'success');
      checkFullCompletionCelebration();
    } else {
      sound.playClick();
    }
    
    updateStatsDisplay();
    updateDOMState(() => {
      render();
    });
  }

  async function deleteTask(id) {
    const index = state.tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    
    state.tasks.splice(index, 1);
    
    if (isBackendConnected) {
      try {
        await apiCall(`/tasks/${id}`, 'DELETE');
      } catch (err) {
        saveTasksToLocalStorage();
      }
    } else {
      saveTasksToLocalStorage();
    }
    
    sound.playDelete();
    showToast('Task deleted');
    
    updateDOMState(() => {
      render();
    });
  }

  async function updateTaskTitle(task, newTitle) {
    task.title = newTitle;
    
    if (isBackendConnected) {
      try {
        await apiCall(`/tasks/${task.id}`, 'PUT', { title: newTitle });
        showToast('Task updated');
      } catch (err) {
        saveTasksToLocalStorage();
      }
    } else {
      saveTasksToLocalStorage();
    }
    
    sound.playClick();
    render();
  }

  function checkFullCompletionCelebration() {
    const visibleTasks = getFilteredTasks();
    if (visibleTasks.length > 0 && visibleTasks.every(t => t.completed)) {
      setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        confetti.spawn(w * 0.2, h * 0.8);
        confetti.spawn(w * 0.5, h * 0.8);
        confetti.spawn(w * 0.8, h * 0.8);
        showToast('All tasks completed! Fantastic! 🏆', 'success');
      }, 300);
    }
  }

  // ==========================================================================
  // INLINE EDITING TRIGGER
  // ==========================================================================
  
  function enableInlineEditing(task, titleSpan, itemEl) {
    if (task.completed) return;
    
    const currentTitle = task.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-task-input';
    input.value = currentTitle;
    input.maxLength = 80;
    
    titleSpan.replaceWith(input);
    input.focus();
    
    itemEl.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    
    function saveEdit() {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== currentTitle) {
        updateTaskTitle(task, newTitle);
      } else {
        render(); // cancel edit and restore view
      }
    }
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        render();
      }
    });
    
    input.addEventListener('blur', () => {
      saveEdit();
    });
  }

  // Filtering calculations
  function getFilteredTasks() {
    return state.tasks.filter(task => {
      if (state.activeCategory !== 'all' && task.category !== state.activeCategory) {
        return false;
      }
      if (state.activePriority !== 'all' && task.priority !== state.activePriority) {
        return false;
      }
      if (state.searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(state.searchQuery);
        const descMatch = task.desc.toLowerCase().includes(state.searchQuery);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }
      return true;
    });
  }

  function getSortedTasks(taskList) {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    return [...taskList].sort((a, b) => {
      switch (state.sortBy) {
        case 'date-new':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-old':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority-desc':
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        case 'priority-asc':
          return priorityWeight[a.priority] - priorityWeight[b.priority];
        case 'due-date':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        default:
          return 0;
      }
    });
  }

  // ==========================================================================
  // RENDER DYNAMICS
  // ==========================================================================
  
  function render() {
    updateCategoryCounts();
    updateProgressRing();
    
    const filtered = getFilteredTasks();
    const sorted = getSortedTasks(filtered);
    
    elements.taskList.innerHTML = '';
    
    if (sorted.length === 0) {
      elements.emptyState.classList.remove('hidden');
    } else {
      elements.emptyState.classList.add('hidden');
      
      sorted.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.style.viewTransitionName = `task-${task.id}`;
        
        const cardGlow = document.createElement('div');
        cardGlow.className = 'card-glow';
        li.appendChild(cardGlow);
        
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-column';
        
        const label = document.createElement('label');
        label.className = 'checkbox-container';
        label.title = task.completed ? 'Mark Incomplete' : 'Mark Complete';
        
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.checked = task.completed;
        
        const customCheck = document.createElement('span');
        customCheck.className = 'custom-checkbox';
        customCheck.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        
        label.appendChild(checkboxInput);
        label.appendChild(customCheck);
        checkboxWrapper.appendChild(label);
        li.appendChild(checkboxWrapper);
        
        const info = document.createElement('div');
        info.className = 'task-item-info';
        
        const header = document.createElement('div');
        header.className = 'task-item-header';
        
        const title = document.createElement('span');
        title.className = 'task-item-title';
        title.textContent = task.title;
        title.title = "Double-click to edit title";
        header.appendChild(title);
        
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `badge badge-priority-${task.priority}`;
        priorityBadge.textContent = task.priority;
        header.appendChild(priorityBadge);
        
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'badge badge-category';
        categoryBadge.textContent = task.category;
        header.appendChild(categoryBadge);
        
        info.appendChild(header);
        
        if (task.desc) {
          const desc = document.createElement('p');
          desc.className = 'task-item-desc';
          desc.textContent = task.desc;
          info.appendChild(desc);
        }
        
        if (task.dueDate) {
          const meta = document.createElement('div');
          meta.className = 'task-item-meta';
          
          const dueBadge = document.createElement('span');
          const todayStr = new Date().toISOString().split('T')[0];
          const isOverdue = task.dueDate < todayStr && !task.completed;
          
          dueBadge.className = `badge-duedate ${isOverdue ? 'overdue' : ''}`;
          
          const calendarIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
          
          const formattedDate = formatFriendlyDate(task.dueDate);
          dueBadge.innerHTML = `${calendarIcon} <span>${isOverdue ? 'Overdue: ' : 'Due: '}${formattedDate}</span>`;
          
          meta.appendChild(dueBadge);
          info.appendChild(meta);
        }
        
        li.appendChild(info);
        
        const actions = document.createElement('div');
        actions.className = 'task-item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete Task';
        deleteBtn.ariaLabel = 'Delete Task';
        deleteBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path class="trash-lid" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        `;
        
        actions.appendChild(deleteBtn);
        li.appendChild(actions);
        elements.taskList.appendChild(li);
        
        // EVENT BINDINGS
        checkboxInput.addEventListener('change', () => {
          toggleTaskComplete(task.id, checkboxInput);
        });
        
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task.id);
        });
        
        title.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          enableInlineEditing(task, title, li);
        });
        
        title.addEventListener('touchend', (e) => {
          e.stopPropagation();
          enableInlineEditing(task, title, li);
        });
        
        apply3DTilt(li);
      });
    }
  }

  function formatFriendlyDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(dateStr + 'T00:00:00');
    
    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const options = { month: 'short', day: 'numeric' };
      return targetDate.toLocaleDateString('en-US', options);
    }
  }

  function updateCategoryCounts() {
    const counts = { all: 0, work: 0, personal: 0, shopping: 0, health: 0, ideas: 0 };
    
    state.tasks.forEach(task => {
      counts.all++;
      if (counts[task.category] !== undefined) {
        counts[task.category]++;
      }
    });

    Object.keys(counts).forEach(cat => {
      const el = document.getElementById(`count-${cat}`);
      if (el) {
        if (el.textContent !== String(counts[cat])) {
          el.textContent = counts[cat];
          el.style.transform = 'scale(1.2)';
          setTimeout(() => el.style.transform = 'scale(1)', 150);
        }
      }
    });
  }

  function updateProgressRing() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    elements.progressText.textContent = `${percentage}%`;
    const circumference = 138.23;
    const offset = circumference - (percentage / 100) * circumference;
    
    elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.progressCircle.style.strokeDashoffset = offset;
  }

  function updateStatsDisplay() {
    elements.statCreatedToday.textContent = state.stats.createdToday;
    elements.statDoneToday.textContent = state.stats.completedToday;
  }

  function setTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('quantum_theme', themeName);
    
    const sunIcon = elements.themeToggle.querySelector('.icon-sun');
    const moonIcon = elements.themeToggle.querySelector('.icon-moon');
    
    if (themeName === 'light') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  function updateSoundIcons() {
    const speakerOn = elements.soundToggle.querySelector('.icon-speaker-on');
    const speakerOff = elements.soundToggle.querySelector('.icon-speaker-off');
    
    if (state.soundEnabled) {
      speakerOn.classList.remove('hidden');
      speakerOff.classList.add('hidden');
    } else {
      speakerOn.classList.add('hidden');
      speakerOff.classList.remove('hidden');
    }
  }

  // ==========================================================================
  // EVENT WIRINGS
  // ==========================================================================
  
  elements.todoForm.addEventListener('submit', handleAddTask);
  
  elements.soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('quantum_sound', state.soundEnabled);
    updateSoundIcons();
    sound.playClick();
    showToast(state.soundEnabled ? 'Audio feedback enabled' : 'Audio feedback muted');
  });
  
  elements.themeToggle.addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    sound.playClick();
    
    updateDOMState(() => {
      setTheme(newTheme);
      showToast(`Switched to ${newTheme} mode`);
    });
  });
  
  elements.categories.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.getAttribute('data-category');
      if (state.activeCategory === category) return;
      
      sound.playClick();
      elements.categories.forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      state.activeCategory = category;
      
      updateDOMState(() => {
        render();
      });
    });
  });
  
  elements.searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    state.searchQuery = query;
    
    if (query) {
      elements.clearSearch.classList.remove('hidden');
    } else {
      elements.clearSearch.classList.add('hidden');
    }
    render();
  });
  
  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.classList.add('hidden');
    sound.playClick();
    render();
  });
  
  elements.priorityFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const priority = btn.getAttribute('data-priority');
      if (state.activePriority === priority) return;
      
      sound.playClick();
      elements.priorityFilters.forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      state.activePriority = priority;
      
      updateDOMState(() => {
        render();
      });
    });
  });
  
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    sound.playClick();
    updateDOMState(() => {
      render();
    });
  });
  
  // ==========================================================================
  // INITIALIZATION RUNTIME
  // ==========================================================================
  
  async function initApp() {
    const hour = new Date().getHours();
    let greeting = "Hello, Creator";
    if (hour < 12) greeting = "Good Morning, Creator";
    else if (hour < 18) greeting = "Good Afternoon, Creator";
    else greeting = "Good Evening, Creator";
    
    elements.greeting.textContent = greeting;
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    
    const randQuote = quotes[Math.floor(Math.random() * quotes.length)];
    elements.quoteBox.textContent = randQuote;
    
    updateSoundIcons();
    setTheme(state.theme);
    
    document.querySelectorAll('.magnetic').forEach(applyMagneticEffect);
    apply3DTilt(document.querySelector('.motivation-card'));
    
    // Load and sync tasks from Express API or LocalStorage
    await loadInitialData();
    
    checkDailyStatsReset();
    updateStatsDisplay();
    
    render();
  }

  initApp();
  
});
