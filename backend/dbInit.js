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
      // CORRECTION : e.message seul est souvent le générique "Validation
      // error" côté Sequelize (ex: SequelizeUniqueConstraintError), sans
      // dire QUEL champ pose problème. e.errors contient le détail
      // (champ, message, valeur) — indispensable pour diagnostiquer sans
      // avoir à reproduire le bug à la main.
      console.warn('⚠️  Seed failed:', e.message);
      if (Array.isArray(e.errors) && e.errors.length) {
        e.errors.forEach((err) =>
          console.warn(`   → champ "${err.path}": ${err.message} (valeur: ${JSON.stringify(err.value)})`)
        );
      }
    }
  } else {
    console.log('🌱 Seed skipped (déjà effectué).');
  }
}