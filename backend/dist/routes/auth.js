import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { hashPassword, verifyPassword, generateToken, } from '../auth.js';
const router = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().min(1),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = registerSchema.parse(req.body);
        // Check if user exists
        const existingUser = db
            .prepare('SELECT id FROM users WHERE email = ?')
            .get(email);
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        // Hash password and create user
        const passwordHash = await hashPassword(password);
        const result = db
            .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id')
            .get(email, passwordHash);
        const userId = result.id;
        // Create default profile
        db.prepare(`INSERT INTO profiles (user_id, display_name, physique, intelligence, 
       spirituality, sociality, success, ego, onboarded) 
       VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0)`).run(userId, displayName);
        const token = generateToken(userId, email);
        res.json({ token, userId, email });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = db
            .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
            .get(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const passwordValid = await verifyPassword(password, user.password_hash);
        if (!passwordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = generateToken(user.id, user.email);
        res.json({ token, userId: user.id, email: user.email });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
        }
        else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});
export default router;
