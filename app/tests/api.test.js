const path = require('path');
const fs = require('fs');

// Isolate database files during testing by pointing process.env.DB_DIR to a test directory
const testDbDir = path.join(__dirname, 'temp-data');
process.env.DB_DIR = testDbDir;

const request = require('supertest');
const app = require('../app');

describe('QuantumTask REST API Tests', () => {
  beforeAll(() => {
    // Ensure test directory is clean before starting
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Cleanup test directory after completion
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  describe('GET /api/tasks', () => {
    it('should retrieve all tasks including default demo tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('completed');
    });
  });

  describe('POST /api/tasks', () => {
    it('should fail with 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ desc: 'Description without title' })
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Title is required');
    });

    it('should successfully create a new task with defaults when given a title', async () => {
      const taskData = { title: 'Test Task' };
      const res = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(taskData.title);
      expect(res.body.completed).toBe(false);
      expect(res.body.category).toBe('personal');
      expect(res.body.priority).toBe('medium');
    });

    it('should successfully create a task with custom fields', async () => {
      const taskData = {
        title: 'Custom Task',
        desc: 'Testing description',
        category: 'work',
        priority: 'high',
        dueDate: '2026-12-31'
      };
      const res = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(taskData.title);
      expect(res.body.desc).toBe(taskData.desc);
      expect(res.body.category).toBe(taskData.category);
      expect(res.body.priority).toBe(taskData.priority);
      expect(res.body.dueDate).toBe(taskData.dueDate);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should return 404 for updating a non-existent task', async () => {
      const res = await request(app)
        .put('/api/tasks/non-existent-id')
        .send({ title: 'New Title' })
        .expect(404);

      expect(res.body).toHaveProperty('error', 'Task not found');
    });

    it('should successfully update an existing task', async () => {
      // Get the existing list of tasks first
      const listRes = await request(app).get('/api/tasks');
      const targetTask = listRes.body[0];

      const updates = {
        title: 'Updated Task Title',
        completed: true
      };

      const res = await request(app)
        .put(`/api/tasks/${targetTask.id}`)
        .send(updates)
        .expect(200);

      expect(res.body.id).toBe(targetTask.id);
      expect(res.body.title).toBe(updates.title);
      expect(res.body.completed).toBe(updates.completed);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should return 404 for deleting a non-existent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/non-existent-id')
        .expect(404);

      expect(res.body).toHaveProperty('error', 'Task not found');
    });

    it('should successfully delete an existing task', async () => {
      const listRes = await request(app).get('/api/tasks');
      const targetTask = listRes.body[0];

      const res = await request(app)
        .delete(`/api/tasks/${targetTask.id}`)
        .expect(200);

      expect(res.body).toEqual({ success: true, id: targetTask.id });

      // Verify that it is no longer in the list
      const afterListRes = await request(app).get('/api/tasks');
      const exists = afterListRes.body.some(t => t.id === targetTask.id);
      expect(exists).toBe(false);
    });
  });

  describe('GET /api/stats', () => {
    it('should retrieve application stats', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(res.body).toHaveProperty('createdToday');
      expect(res.body).toHaveProperty('completedToday');
      expect(res.body).toHaveProperty('lastStatReset');
    });
  });

  describe('POST /api/stats', () => {
    it('should successfully update application stats', async () => {
      const statUpdates = {
        createdToday: 10,
        completedToday: 5
      };

      const res = await request(app)
        .post('/api/stats')
        .send(statUpdates)
        .expect(200);

      expect(res.body.createdToday).toBe(statUpdates.createdToday);
      expect(res.body.completedToday).toBe(statUpdates.completedToday);

      // Verify via GET
      const getRes = await request(app).get('/api/stats');
      expect(getRes.body.createdToday).toBe(statUpdates.createdToday);
      expect(getRes.body.completedToday).toBe(statUpdates.completedToday);
    });
  });
});
