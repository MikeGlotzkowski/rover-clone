import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Routes (to be imported)
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import providerRoutes from './routes/providers.js';
import bookingRoutes from './routes/bookings.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/providers', providerRoutes);
app.use('/bookings', bookingRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🐕 Rover API running on http://localhost:${PORT}`);
});

export { prisma };
