import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { sequelize } from './models/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Routes P1
import authRoutes from './routes/auth.routes.js';
import moderateurRoutes from './routes/moderateur.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notifRoutes from './routes/notification.routes.js';

// Routes P2
import entrepriseRouter from './routes/entreprise.routes.js';
import campagneRouter from './routes/campagne.routes.js';
import avisRouter from './routes/avis.routes.js';
import paiementRouter from './routes/paiement.routes.js';

// Routes P3
import createurRoutes from './routes/createur.routes.js';
import offreRoutes from './routes/offre.routes.js';
import collaborationRoutes from './routes/collaboration.routes.js';
import messageRoutes from './routes/message.routes.js';
import favoriRoutes from './routes/favori.routes.js';
import signalementRoutes from './routes/signalement.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Rate limit global : désactivé en développement pour éviter les blocages
if (process.env.NODE_ENV !== 'production') {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
} else {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
}


app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes P1
app.use('/api/auth', authRoutes);
app.use('/api/moderateur', moderateurRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notifRoutes);

// Routes P2
app.use('/api/entreprises', entrepriseRouter);
app.use('/api/campagnes', campagneRouter);
app.use('/api/avis', avisRouter);
app.use('/api/paiements', paiementRouter);

// Routes P3
app.use('/api/createurs', createurRoutes);
app.use('/api/offres', offreRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favoris', favoriRoutes);
app.use('/api/signalements', signalementRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Afrika Influence API is running' });
});

app.use(errorHandler);

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection error:', err.message));

export default app;
