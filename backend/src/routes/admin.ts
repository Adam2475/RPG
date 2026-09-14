import { Router, Response } from 'express';
import { db } from '../db.js';
import { adminMiddleware, AuthRequest, authMiddleware } from '../auth.js';

const router = Router();

router.get('/database', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as Array<{ name: string }>;

    const result = tables.map(({ name }) => {
      const identifier = name.replace(/"/g, '""');
      const columns = (db.prepare(`PRAGMA table_info("${identifier}")`).all() as Array<{ name: string }>)
        .filter(column => column.name !== 'password_hash');
      const rows = db.prepare(`SELECT * FROM "${identifier}" LIMIT 500`).all() as Array<Record<string, unknown>>;

      for (const row of rows) {
        delete row.password_hash;
      }

      return { name, columns, rows };
    });

    res.json({ tables: result });
  } catch (error) {
    console.error('Admin database error:', error);
    res.status(500).json({ error: 'Unable to read database' });
  }
});

export default router;