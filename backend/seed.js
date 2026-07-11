import { sequelize } from './models/index.js';
import { runSeed } from './seeders/dev-p1.js';

async function setupDatabase() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie.');

    console.log('📦 Synchronisation des modèles...');
    await sequelize.sync({ force: false });
    console.log('✅ Modèles synchronisés.');

    console.log('🌱 Exécution des seeders...');
    await runSeed();
    console.log('✅ Seeders terminés.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

setupDatabase();
