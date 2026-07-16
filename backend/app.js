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

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// ─── trust proxy ────────────────────────────────────────────────────────────
// SECURITE : en production, l'app tourne généralement derrière un reverse-proxy
// (nginx, load balancer). Sans "trust proxy", req.ip renvoie l'IP du proxy pour
// TOUTES les requêtes — ça rend inefficaces le rate-limit et le honeypot par IP
// (déjà en place sur /connexion et /inscription), et fausse les logs d'audit
// (toutes les actions semblent provenir de la même IP). "1" = on fait confiance
// au premier hop uniquement (le reverse-proxy immédiat), pas à toute la chaîne.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// ─── CORS ──────────────────────────────────────────────────────────────────
// SECURITE : cors() sans option reflète Access-Control-Allow-Origin: * pour
// TOUTE origine — n'importe quel site tiers peut alors faire des requêtes
// cross-origin vers cette API depuis le navigateur d'un utilisateur. On
// restreint donc aux origines de confiance (notre frontend), configurables
// via la variable d'env CORS_ORIGINS (liste séparée par des virgules).
// Le JWT étant transmis en header Authorization (pas en cookie), le risque
// principal ici n'est pas le CSRF classique, mais l'abus de l'API depuis un
// site tiers avec le token d'un utilisateur (XSS ailleurs, extension malveillante,
// etc.) — verrouiller les origines réduit cette surface.
const origines = (process.env.CORS_ORIGINS || process.env.APP_BASE_URL || 'http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Pas d'en-tête Origin = appel serveur-à-serveur / outil (curl, Postman, webhook)
    // → autorisé, car ce n'est de toute façon pas ce que CORS protège (CORS régule
    // les requêtes émises par un navigateur, pas les clients HTTP directs).
    if (!origin || origines.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Origine refusée : ${origin}`);
    return callback(new Error('Origine non autorisée par CORS.'));
  },
}));
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

app.get('/', (_req, res) => {
  res.json({ message: 'Afrika Influence API is running' });
});

app.use(errorHandler);

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection error:', err.message));

export default app;