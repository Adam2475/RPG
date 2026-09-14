import { createRequire } from 'node:module';
import { db } from './db.js';
const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function generateToken(userId, email, isAdmin = false) {
    return jwt.sign({ userId, email, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}
export function adminMiddleware(req, res, next) {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId);
    if (!user || user.is_admin !== 1) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
