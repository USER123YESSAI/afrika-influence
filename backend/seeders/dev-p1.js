import models, { sequelize } from '../models/index.js';
import bcrypt from 'bcrypt';

const { Utilisateur, Entreprise, Createur } = models;

const SEED = {
  admin:      'admin000-0000-0000-0000-000000000001',
  entreprise: 'bbb00000-0000-0000-0000-000000000001',
  createur:   'aaa00000-0000-0000-0000-000000000001',
};

export async function runSeed() {
  console.log('🌱 Seed P1 : création des comptes de test...');
  const hash = await bcrypt.hash('password123', 12);

  // ── Admin ──────────────────────────────────────────────────────────────────
  await Utilisateur.findOrCreate({
    where: { id: SEED.admin },
    defaults: {
      id: SEED.admin, nom: 'Admin Baobab', email: 'admin@baobab.sn',
      motDePasse: hash, role: 'ADMINISTRATEUR', statut: 'validated',
    },
  });

  // ── Entreprise ─────────────────────────────────────────────────────────────
  const [userEntreprise] = await Utilisateur.findOrCreate({
    where: { id: SEED.entreprise },
    defaults: {
      id: SEED.entreprise, nom: 'MarqueSN Test', email: 'marque@baobab.sn',
      motDePasse: hash, role: 'ENTREPRISE', statut: 'validated',
    },
  });

  await Entreprise.findOrCreate({
    where: { utilisateurId: SEED.entreprise },
    defaults: {
      utilisateurId: SEED.entreprise,
      nom:           'MarqueSN',
      secteur:       'MODE',
      description:   'Marque de mode africaine contemporaine.',
      pays:          'SENEGAL',
      siteWeb:       'https://marquesn.sn',
      telephone:     '+221 77 000 00 00',
    },
  });

  // ── Créateur ───────────────────────────────────────────────────────────────
  const [userCreateur] = await Utilisateur.findOrCreate({
    where: { id: SEED.createur },
    defaults: {
      id: SEED.createur, nom: 'Aminata Diallo', email: 'aminata@baobab.sn',
      motDePasse: hash, role: 'CREATEUR', statut: 'validated',
    },
  });

  await Createur.findOrCreate({
    where: { utilisateurId: SEED.createur },
    defaults: {
      utilisateurId: SEED.createur,
      nom:           'Aminata Diallo',
      handle:        '@aminatadiallo',
      bio:           'Créatrice de contenu mode & lifestyle basée à Dakar. 🌍',
      pays:          'SN',
      audience:      45000,
      reseaux: {
        Instagram: { audience: 30000, engagement: 4.2 },
        TikTok:    { audience: 15000, engagement: 6.1 },
      },
    },
  });


  const MOD_ID = 'mod00000-0000-0000-0000-000000000001';
  await Utilisateur.findOrCreate({
    where: { id: MOD_ID },
    defaults: {
      id: MOD_ID, nom: 'Modérateur Baobab', email: 'moderateur@baobab.sn',
      motDePasse: hash, role: 'MODERATEUR', statut: 'validated',
    },
  });
  console.log('✅ Seed P1 terminé.');
  console.log('   → admin@baobab.sn       / password123  (ADMINISTRATEUR)');
  console.log('   → moderateur@baobab.sn  / password123  (MODERATEUR)');
  console.log('   → marque@baobab.sn      / password123  (ENTREPRISE)');
  console.log('   → aminata@baobab.sn     / password123  (CREATEUR)');
  return SEED;
}
