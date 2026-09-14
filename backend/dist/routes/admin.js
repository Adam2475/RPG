import { Router } from 'express';
import { db } from '../db.js';
import { adminMiddleware, authMiddleware } from '../auth.js';
const router = Router();
router.get('/database', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const tables = db
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
            .all();
        const result = tables.map(({ name }) => {
            const identifier = name.replace(/"/g, '""');
            const columns = db.prepare(`PRAGMA table_info("${identifier}")`).all()
                .filter(column => column.name !== 'password_hash');
            const rows = db.prepare(`SELECT * FROM "${identifier}" LIMIT 500`).all();
            for (const row of rows) {
                delete row.password_hash;
            }
            return { name, columns, rows };
        });
        res.json({ tables: result });
    }
    catch (error) {
        console.error('Admin database error:', error);
        res.status(500).json({ error: 'Unable to read database' });
    }
});
export default router;
