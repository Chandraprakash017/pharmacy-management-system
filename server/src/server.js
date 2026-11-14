import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import routes from './routes.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);
app.use((err, _req, res, _next) => {
  console.error(err);
  const duplicate = err.code === 11000;
  res.status(duplicate ? 409 : 400).json({ message: duplicate ? 'A record with this unique value already exists' : (err.message || 'Request failed') });
});

const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
  .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });

export default app;
