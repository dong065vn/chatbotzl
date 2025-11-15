import express, { Request, Response } from 'express';
import { config } from './config';
import { zaloController } from './controllers/zalo.controller';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Zalo Lunar Calendar Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Zalo webhook endpoint
app.post('/zalo', (req: Request, res: Response) => {
  zaloController.handleWebhook(req, res);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log('🚀 Zalo Lunar Calendar Bot started!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/zalo`);
  console.log('✅ Ready to receive Zalo events!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
