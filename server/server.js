import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import connectDB from './config/db.js';

// Load environment variables from the server folder's .env and override existing values
let envPath = new URL('.env', import.meta.url).pathname;
// On Windows this path may begin with a leading slash like '/D:/...'. Normalize it.
if (process.platform === 'win32' && envPath.startsWith('/')) envPath = envPath.replace(/^\/(.:)/, '$1');
console.log('Loading .env from', envPath, 'cwd=', process.cwd());
dotenv.config({ path: envPath, override: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/', (_req, res) => {
  res.json({
    brand: 'AutoPulse AI',
    message: 'Professional predictive vehicle health platform API',
    endpoints: ['/api/health', '/api/dashboard', '/api/metrics'],
  });
});

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AutoPulse AI server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
