import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import tasksRoutes from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/tasks', tasksRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Life RPG backend running on http://localhost:${PORT}`);
});
