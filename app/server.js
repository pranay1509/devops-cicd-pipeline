const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Setup paths for file database
const DB_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DB_DIR, 'tasks.json');
const STATS_FILE = path.join(DB_DIR, 'stats.json');

// Ensure data folder and basic databases exist on startup
function ensureDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TASKS_FILE)) {
    const demoTasks = [
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
    fs.writeFileSync(TASKS_FILE, JSON.stringify(demoTasks, null, 2));
    console.log('Created tasks.json with demo data.');
  }
  
  if (!fs.existsSync(STATS_FILE)) {
    const defaultStats = {
      createdToday: 0,
      completedToday: 0,
      lastStatReset: new Date().toDateString()
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(defaultStats, null, 2));
    console.log('Created stats.json database.');
  }
}

// Database helper functions
function readTasks() {
  try {
    ensureDatabase();
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading tasks database file:', err);
    return [];
  }
}

function writeTasks(tasks) {
  try {
    ensureDatabase();
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing tasks database file:', err);
    return false;
  }
}

function readStats() {
  try {
    ensureDatabase();
    const data = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading stats database file:', err);
    return {
      createdToday: 0,
      completedToday: 0,
      lastStatReset: new Date().toDateString()
    };
  }
}

function writeStats(stats) {
  try {
    ensureDatabase();
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing stats database file:', err);
    return false;
  }
}

// Ensure database files are initialized immediately
ensureDatabase();

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

// 1. Get all tasks
app.get('/api/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// 2. Add a new task
app.post('/api/tasks', (req, res) => {
  const { title, desc, category, priority, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const tasks = readTasks();
  const newTask = {
    id: 'task-' + Date.now(),
    title,
    desc: desc || '',
    category: category || 'personal',
    priority: priority || 'medium',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  if (writeTasks(tasks)) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// 3. Update an existing task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Merge updates from body
  tasks[index] = { ...tasks[index], ...req.body };
  
  if (writeTasks(tasks)) {
    res.json(tasks[index]);
  } else {
    res.status(500).json({ error: 'Failed to update database' });
  }
});

// 4. Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const filteredTasks = tasks.filter(t => t.id !== id);

  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (writeTasks(filteredTasks)) {
    res.json({ success: true, id });
  } else {
    res.status(500).json({ error: 'Failed to delete from database' });
  }
});

// 5. Get daily stats
app.get('/api/stats', (req, res) => {
  const stats = readStats();
  res.json(stats);
});

// 6. Update stats
app.post('/api/stats', (req, res) => {
  const stats = readStats();
  const updatedStats = { ...stats, ...req.body };
  
  if (writeStats(updatedStats)) {
    res.json(updatedStats);
  } else {
    res.status(500).json({ error: 'Failed to update stats database' });
  }
});

// Serve frontend static assets
app.use(express.static(path.join(__dirname)));

// Fallback for SPA routing to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`QuantumTask Backend Server is Active!`);
  console.log(`Serving on: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
