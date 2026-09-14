import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { AuthRequest, authMiddleware } from '../auth.js';

const router = Router();

const createTaskSchema = z.object({
  name: z.string().min(1),
  xp: z.number().min(1),
  stat: z.enum(['physique', 'intelligence', 'spirituality', 'sociality', 'success', 'ego']),
  period: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly']),
});

// Get all tasks for the user
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tasks = db
      .prepare('SELECT id, name, xp, stat, period, completed, created_at, completed_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as any[];

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      name: task.name,
      xp: task.xp,
      stat: task.stat,
      period: task.period,
      completed: task.completed === 1,
      createdAt: new Date(task.created_at).getTime(),
      completedAt: task.completed_at ? new Date(task.completed_at).getTime() : null,
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, xp, stat, period } = createTaskSchema.parse(req.body);
    const userId = req.user!.userId;

    const result = db
      .prepare(
        'INSERT INTO tasks (user_id, name, xp, stat, period) VALUES (?, ?, ?, ?, ?) RETURNING id, created_at'
      )
      .get(userId, name, xp, stat, period) as any;

    res.json({
      id: result.id,
      name,
      xp,
      stat,
      period,
      completed: false,
      createdAt: new Date(result.created_at).getTime(),
      completedAt: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Delete a task
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const task = db
      .prepare('SELECT user_id FROM tasks WHERE id = ?')
      .get(taskId) as any;

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark task as complete/incomplete
router.patch('/:id/complete', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const { completed } = z.object({ completed: z.boolean() }).parse(req.body);

    const task = db
      .prepare('SELECT user_id, completed FROM tasks WHERE id = ?')
      .get(taskId) as any;

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.user_id !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (completed) {
      db.prepare('UPDATE tasks SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(taskId);
    } else {
      db.prepare('UPDATE tasks SET completed = 0, completed_at = NULL WHERE id = ?').run(taskId);
    }

    res.json({ success: true, completed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

export default router;
