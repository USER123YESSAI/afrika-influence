import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { sequelize } from './models/index.js';
import { runSeed } from './seeders/dev-p1.js';

const MARKER = './database.seeded.marker';

export async function initDatabase() {
  console.log('🔗 Connexion DB...');
  await sequelize.authenticate();
  console.log('✅ DB connected.');

  console.log('📦 Synchronisation des modèles...');
  await sequelize.sync({ force: false });
  console.log('✅ Tables synchronisées.');

  const alreadySeeded = fs.existsSync(MARKER);
  if (!alreadySeeded) {
    console.log('🌱 Seed initial...');
    try {
      await runSeed();
      fs.writeFileSync(MARKER, new Date().toISOString(), 'utf-8');
      console.log('✅ Seed OK.');
    } catch (e) {
      console.warn('⚠️  Seed failed:', e.message);
    }
  } else {
    console.log('🌱 Seed skipped (déjà effectué).');
  }
}
