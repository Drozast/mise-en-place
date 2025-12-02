import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database/db.js';
import authRouter from './routes/auth.js';
import ingredientsRouter from './routes/ingredients.js';
import recipesRouter from './routes/recipes.js';
import shiftsRouter from './routes/shifts.js';
import salesRouter from './routes/sales.js';
import alertsRouter from './routes/alerts.js';
import reportsRouter from './routes/reports.js';
import gamificationRouter from './routes/gamification.js';
import rewardsRouter from './routes/rewards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure CORS based on environment
const corsOrigin = process.env.CORS_ORIGIN || process.env.NODE_ENV === 'production'
  ? '*'
  : 'http://localhost:3000';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({
  origin: corsOrigin
}));
app.use(express.json());

// Make io available in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/rewards', rewardsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Initialize database
db.initialize();

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos inicializada`);
});

export { io };
