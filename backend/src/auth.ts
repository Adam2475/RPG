import { createRequire } from 'node:module';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const require = createRequire(import.meta.url);
const bcrypt: typeof import('bcrypt') = require('bcrypt');
const jwt: typeof import('jsonwebtoken') = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface AuthPayload {
  userId: number;
  email: string;
  isAdmin?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string, isAdmin = false): string {
  return jwt.sign({ userId, email, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as
    | { is_admin: number }
    | undefined;

  if (!user || user.is_admin !== 1) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
