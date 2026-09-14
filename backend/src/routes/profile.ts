import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { AuthRequest, authMiddleware } from '../auth.js';

const router = Router();

const updateStatsSchema = z.object({
  physique: z.number().min(0).max(100).optional(),
  intelligence: z.number().min(0).max(100).optional(),
  spirituality: z.number().min(0).max(100).optional(),
  sociality: z.number().min(0).max(100).optional(),
  success: z.number().min(0).max(100).optional(),
  ego: z.number().min(0).max(100).optional(),
});

const onboardingSchema = z.object({
  physique: z.number().min(0).max(100),
  intelligence: z.number().min(0).max(100),
  spirituality: z.number().min(0).max(100),
  sociality: z.number().min(0).max(100),
  success: z.number().min(0).max(100),
  ego: z.number().min(0).max(100),
});

// Get profile
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const profile = db
      .prepare('SELECT * FROM profiles WHERE user_id = ?')
      .get(req.user!.userId) as any;

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({
      displayName: profile.display_name,
      physique: profile.physique,
      intelligence: profile.intelligence,
      spirituality: profile.spirituality,
      sociality: profile.sociality,
      success: profile.success,
      ego: profile.ego,
      onboarded: profile.onboarded === 1,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stats
router.put('/profile/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const stats = updateStatsSchema.parse(req.body);
    const userId = req.user!.userId;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (stats.physique !== undefined) {
      updates.push('physique = ?');
      values.push(stats.physique);
    }
    if (stats.intelligence !== undefined) {
      updates.push('intelligence = ?');
      values.push(stats.intelligence);
    }
    if (stats.spirituality !== undefined) {
      updates.push('spirituality = ?');
      values.push(stats.spirituality);
    }
    if (stats.sociality !== undefined) {
      updates.push('sociality = ?');
      values.push(stats.sociality);
    }
    if (stats.success !== undefined) {
      updates.push('success = ?');
      values.push(stats.success);
    }
    if (stats.ego !== undefined) {
      updates.push('ego = ?');
      values.push(stats.ego);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(userId);

    const query = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`;
    db.prepare(query).run(...values);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Onboarding submit
router.post(
  '/profile/onboarding',
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    try {
      const stats = onboardingSchema.parse(req.body);
      const userId = req.user!.userId;

      db.prepare(
        `UPDATE profiles SET 
         physique = ?, intelligence = ?, spirituality = ?,
         sociality = ?, success = ?, ego = ?, onboarded = 1
         WHERE user_id = ?`
      ).run(
        stats.physique,
        stats.intelligence,
        stats.spirituality,
        stats.sociality,
        stats.success,
        stats.ego,
        userId
      );

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Server error' });
      }
    }
  }
);

export default router;
