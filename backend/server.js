import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDatabase } from './dbInit.js';

const requestedPort = Number(process.env.PORT) || 3001;
const fallbackPort = requestedPort === 3001 ? 3002 : 3001;

const startServer = (port, allowFallback = true) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && allowFallback) {
      console.warn(`Port ${port} is already in use, trying ${fallbackPort} instead.`);
      startServer(fallbackPort, false);
      return;
    }

    throw error;
  });
};

async function bootstrapAndStart() {
  // Initialise la base avant de démarrer l’API (évite "table inexistante")
  try {
    await initDatabase();
  } catch (e) {
    console.error('❌ DB init failed:', e?.message || e);
    process.exit(1);
  }

  startServer(requestedPort);
}

bootstrapAndStart();

