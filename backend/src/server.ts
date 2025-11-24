import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import csvRoutes from './routes/csv.routes';
import webhookRoutes from './routes/webhook.routes';
import { initDatabase } from './services/initDatabase';

const app: Express = express();
const PORT = 3000;

// Middleware - Allow Railway frontend domain
app.use(cors({
  origin: [
    'https://frontend-service-production-fa7d.up.railway.app',
    'http://localhost:5173',
    /\.railway\.app$/,
    /\.replit\.dev$/
  ],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// CSV routes
app.use('/api', csvRoutes);

// Webhook routes
app.use('/api/webhook', webhookRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook/trigger-clean`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
