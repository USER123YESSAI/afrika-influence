import models, { sequelize } from '../models/index.js';
import bcrypt from 'bcrypt';

const { Utilisateur, Entreprise, Createur } = models;

const SEED = {
  admin:      'admin000-0000-0000-0000-000000000001',
  entreprise: 'bbb00000-0000-0000-0000-000000000001',
  createur:   'aaa00000-0000-0000-0000-000000000001',
  moderateur: 'mod00000-0000-0000-0000-000000000001',
};

// CORRECTION : findOrCreate cherchait par `id`. Si un compte avec le même
// EMAIL existait déjà en base (créé manuellement, ou avec un ancien id lors
// d'un seed précédent), findOrCreate ne le trouvait pas (id différent) et
// tentait un INSERT en doublon → violation de la contrainte unique sur
// `email`. On cherche/crée donc par `email` (la vraie clé naturelle), et si
// le compte existe déjà, on remet mot de passe/rôle/statut à jour. Choix
// assumé pour des comptes de TEST à identifiants connus (password123) : ils
// doivent toujours fonctionner, peu importe leur état précédent.
async function upsertUtilisateur({ id, nom, email, hash, role, statut = 'validated' }) {
  const [utilisateur, cree] = await Utilisateur.findOrCreate({
    where: { email },
    defaults: { id, nom, email, motDePasse: hash, role, statut },
  });
  if (!cree) {
    await utilisateur.update({ motDePasse: hash, role, statut, nom });
  }
  return utilisateur;
}

export async function runSeed() {
  console.log('🌱 Seed P1 : création des comptes de test...');
  const hash = await bcrypt.hash('password123', 12);

  // Chaque bloc est isolé dans son propre try/catch : un souci sur un seul
  // compte (ex: contrainte unique résiduelle) ne doit plus jamais empêcher
  // les autres d'être créés, ni bloquer indéfiniment le marker de fin de
  // seed à chaque redémarrage du serveur.

  // ── Admin ──────────────────────────────────────────────────────────────────
  try {
    await upsertUtilisateur({
      id: SEED.admin, nom: 'Admin Baobab', email: 'admin@baobab.sn',
      hash, role: 'ADMINISTRATEUR',
    });
  } catch (e) {
    console.warn('⚠️  Seed admin échoué :', e.message);
  }

  // ── Modérateur ─────────────────────────────────────────────────────────────
  try {
    await upsertUtilisateur({
      id: SEED.moderateur, nom: 'Modérateur Baobab', email: 'moderateur@baobab.sn',
      hash, role: 'MODERATEUR',
    });
  } catch (e) {
    console.warn('⚠️  Seed modérateur échoué :', e.message);
  }

  // ── Entreprise ─────────────────────────────────────────────────────────────
  try {
    const userEntreprise = await upsertUtilisateur({
      id: SEED.entreprise, nom: 'MarqueSN Test', email: 'marque@baobab.sn',
      hash, role: 'ENTREPRISE',
    });

    await Entreprise.findOrCreate({
      where: { utilisateurId: userEntreprise.id },
      defaults: {
        utilisateurId: userEntreprise.id,
        nom:           'MarqueSN',
        secteur:       'MODE',
        description:   'Marque de mode africaine contemporaine.',
        pays:          'SENEGAL',
        siteWeb:       'https://marquesn.sn',
        telephone:     '+221 77 000 00 00',
      },
    });
  } catch (e) {
    console.warn('⚠️  Seed entreprise échoué :', e.message);
  }

  // ── Créateur ───────────────────────────────────────────────────────────────
  try {
    const userCreateur = await upsertUtilisateur({
      id: SEED.createur, nom: 'Aminata Diallo', email: 'aminata@baobab.sn',
      hash, role: 'CREATEUR',
    });

    const HANDLE = '@aminatadiallo';

    // CORRECTION : `handle` est UNIQUE en base, indépendamment de
    // `utilisateurId`. Chercher uniquement par utilisateurId ne voyait pas
    // une fiche résiduelle créée avec ce même handle mais un ancien
    // utilisateurId (ex: avant une correction précédente des ids de seed) —
    // l'INSERT tentait alors un doublon de handle et faisait planter tout
    // le reste du seed. On cherche donc par handle, la contrainte qui posait
    // réellement problème, et on rattache la fiche au bon compte si besoin.
    const [fiche] = await Createur.findOrCreate({
      where: { handle: HANDLE },
      defaults: {
        utilisateurId: userCreateur.id,
        nom:           'Aminata Diallo',
        handle:        HANDLE,
        bio:           'Créatrice de contenu mode & lifestyle basée à Dakar. 🌍',
        pays:          'SN',
        audience:      45000,
        reseaux: {
          Instagram: { audience: 30000, engagement: 4.2 },
          TikTok:    { audience: 15000, engagement: 6.1 },
        },
      },
    });

    if (fiche.utilisateurId !== userCreateur.id) {
      await fiche.update({ utilisateurId: userCreateur.id });
    }
  } catch (e) {
    console.warn('⚠️  Seed créateur échoué :', e.message);
  }

  console.log('✅ Seed P1 terminé.');
  console.log('   → admin@baobab.sn       / password123  (ADMINISTRATEUR)');
  console.log('   → moderateur@baobab.sn  / password123  (MODERATEUR)');
  console.log('   → marque@baobab.sn      / password123  (ENTREPRISE)');
  console.log('   → aminata@baobab.sn     / password123  (CREATEUR)');
  return SEED;
}