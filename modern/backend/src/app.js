import express from 'express';
import session from 'express-session';
import { errorHandler } from './http.js';
import { serializeBySession } from './sessionLock.js';
import { authRouter } from './routes/auth.js';
import { cartRouter } from './routes/cart.js';
import { ordersRouter } from './routes/orders.js';
import { dishesRouter } from './routes/dishes.js';

// Builds the Express app around an injected pool, so tests can use a throwaway database
export function createApp({ pool, sessionSecret }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '50kb' }));
  app.use(serializeBySession);
  app.use(session({
    name: 'foodhub.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  }));

  app.use('/api/dishes', dishesRouter(pool));
  app.use('/api/auth', authRouter(pool));
  app.use('/api/cart', cartRouter(pool));
  app.use('/api/orders', ordersRouter(pool));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
