import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import kioskRoutes from './routes/kiosk.routes';
import branchRoutes from './routes/branch.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import saleRoutes from './routes/sale.routes';
import paymentRoutes from './routes/payment.routes';
import mapRoutes from './routes/map.routes';
import cashSessionRoutes from './routes/cash-session.routes';

dotenv.config();

// Validar variables de entorno críticas
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no está configurado. La aplicación no puede iniciarse.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter para rutas de autenticación (HIGH-1)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // máximo 10 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  skipSuccessfulRequests: true,
});

// Rate limiter general para toda la API
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 120,                 // 120 requests por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Por favor, esperá un momento.' },
});

// Middlewares globales
app.use(cors({ // CRIT-3: Origen restringido
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet()); // MED-5: Headers de seguridad HTTP
app.use(express.json({ limit: '10kb' })); // MED-1: Límite de tamaño de body
app.use('/api', generalLimiter);

// Rutas
app.use('/api/auth/login', authLimiter);     // HIGH-1: Rate limit en login
app.use('/api/auth/register', authLimiter);  // HIGH-1: Rate limit en register
app.use('/api/auth/forgot-password', authLimiter); // HIGH-1: Rate limit en forgot-password
app.use('/api/auth', authRoutes);
app.use('/api/kiosks', kioskRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/cash-sessions', cashSessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🌟 KioskStar Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
