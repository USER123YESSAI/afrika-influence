import { randomUUID } from 'crypto';
import { sequelize, Entreprise, Campagne, CampagnePlateforme } from '../models/index.js';

const ENTREPRISE_ID = 'ent-seed-0001-0000-0000-000000000001';
const UTILISATEUR_ID = 'usr-seed-0001-0000-0000-000000000001';

const campagnesData = [
  {
    id: randomUUID(),
    entrepriseId: ENTREPRISE_ID,
    titre: 'Lancement Collection Été 2026',
    description: 'Campagne de notoriété pour notre nouvelle collection mode estivale.',
    budget: 2500000,
    objectifPrincipal: 'Augmenter la notoriété de la marque auprès des 18-35 ans',
    consignesContenu: 'Présenter les pièces en situation réelle, couleurs vives, ambiance plage',
    nombreCreateursVoulus: 5,
    statut: 'PUBLIEE',
    dateDebut: new Date('2026-07-01'),
    dateFin: new Date('2026-07-31'),
  },
  {
    id: randomUUID(),
    entrepriseId: ENTREPRISE_ID,
    titre: 'Promotion App Mobile Fintech',
    description: 'Campagne de téléchargement pour notre application de paiement mobile.',
    budget: 1800000,
    objectifPrincipal: 'Générer 10 000 téléchargements en 30 jours',
    consignesContenu: 'Démonstration de l\'application en conditions réelles, accent sur la rapidité',
    nombreCreateursVoulus: 3,
    statut: 'BROUILLON',
    dateDebut: new Date('2026-08-01'),
    dateFin: new Date('2026-08-31'),
  },
  {
    id: randomUUID(),
    entrepriseId: ENTREPRISE_ID,
    titre: 'Sensibilisation Produits Bio',
    description: 'Campagne éducative sur les bienfaits de notre gamme agroalimentaire bio.',
    budget: 900000,
    objectifPrincipal: 'Éduquer et convertir une audience soucieuse de sa santé',
    consignesContenu: 'Recettes créatives, storytelling authentique, pas de mise en scène trop commerciale',
    nombreCreateursVoulus: 4,
    statut: 'EN_COURS',
    dateDebut: new Date('2026-06-01'),
    dateFin: new Date('2026-06-30'),
  },
];

const plateformesData = [
  { plateforme: 'INSTAGRAM', campagneIndex: 0 },
  { plateforme: 'TIKTOK', campagneIndex: 0 },
  { plateforme: 'YOUTUBE', campagneIndex: 1 },
  { plateforme: 'TIKTOK', campagneIndex: 1 },
  { plateforme: 'INSTAGRAM', campagneIndex: 2 },
  { plateforme: 'FACEBOOK', campagneIndex: 2 },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    // Créer l'entreprise de test si elle n'existe pas
    await Entreprise.findOrCreate({
      where: { id: ENTREPRISE_ID },
      defaults: {
        id: ENTREPRISE_ID,
        utilisateurId: UTILISATEUR_ID,
        nom: 'Entreprise Seed SA',
        secteur: 'MODE',
        description: 'Entreprise de test pour le développement',
        pays: 'SENEGAL',
      },
    });

    // Créer les campagnes
    for (const data of campagnesData) {
      await Campagne.findOrCreate({
        where: { id: data.id },
        defaults: data,
      });
    }

    // Créer les plateformes associées
    for (const { plateforme, campagneIndex } of plateformesData) {
      await CampagnePlateforme.findOrCreate({
        where: {
          campagneId: campagnesData[campagneIndex].id,
          plateforme,
        },
        defaults: {
          id: randomUUID(),
          campagneId: campagnesData[campagneIndex].id,
          plateforme,
        },
      });
    }

    console.log('Seed terminé : 1 entreprise + 3 campagnes insérées.');
  } catch (err) {
    console.error('Erreur lors du seed :', err.message);
  } finally {
    await sequelize.close();
  }
};

seed();
