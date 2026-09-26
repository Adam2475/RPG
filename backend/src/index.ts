import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import tasksRoutes from './routes/tasks.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Life RPG backend listening on ${HOST}:${PORT}`);
});
