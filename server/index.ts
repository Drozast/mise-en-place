import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db } from './database/db.js';
import authRouter from './routes/auth.js';
import ingredientsRouter from './routes/ingredients.js';
import recipesRouter from './routes/recipes.js';
import shiftsRouter from './routes/shifts.js';
import salesRouter from './routes/sales.js';
import alertsRouter from './routes/alerts.js';
import reportsRouter from './routes/reports.js';
import gamificationRouter from './routes/gamification.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
