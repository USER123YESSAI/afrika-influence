import dotenv from 'dotenv';
dotenv.config();

import models from './models/index.js';
import { sequelize } from './models/index.js';

const { Utilisateur, Createur, Entreprise, Campagne, CampagnePlateforme, Offre, Collaboration, CollaborationContenu, Favori, Transaction, Message, Notification } = models;

async function seedDemoData() {
  console.log('🔗 Connexion DB...');
  await sequelize.authenticate();
  
  // Trouver l'utilisateur Aminata Diallo
  const user = await Utilisateur.findOne({ where: { email: 'aminata@baobab.sn' } });
  if (!user) {
    console.error('❌ Utilisateur aminata@baobab.sn non trouvé.');
    process.exit(1);
  }

  const createur = await Createur.findOne({ where: { utilisateurId: user.id } });
  if (!createur) {
    console.error('❌ Profil créateur pour aminata@baobab.sn non trouvé.');
    process.exit(1);
  }

  console.log('✅ Profil créateur trouvé:', createur.id);

  // 1. Créer des Offres pour le créateur
  console.log('📦 Création d\'offres...');
  await Offre.destroy({ where: { createurId: createur.id } });
  
  await Offre.bulkCreate([
    { createurId: createur.id, plateformes: 'INSTAGRAM', typeContenu: 'POST_PHOTO', prixDeBase: 50000, description: 'Un post photo de haute qualité sur mon feed Instagram.' },
    { createurId: createur.id, plateformes: 'TIKTOK', typeContenu: 'VIDEO_COURTE', prixDeBase: 100000, description: 'Une vidéo courte et virale sur TikTok (15-60s).' },
    { createurId: createur.id, plateformes: 'INSTAGRAM', typeContenu: 'STORY', prixDeBase: 25000, description: 'Une story de 24h avec lien swipe-up.' }
  ]);

  // 2. Trouver ou créer une entreprise pour les campagnes
  let entUser = await Utilisateur.findOne({ where: { email: 'contact@orange.sn' } });
  if (!entUser) {
    entUser = await Utilisateur.create({
      nom: 'Orange Sénégal',
      email: 'contact@orange.sn',
      motDePasse: 'password',
      role: 'ENTREPRISE',
      isVerified: true
    });
  }

  let entreprise = await Entreprise.findOne({ where: { utilisateurId: entUser.id } });
  if (!entreprise) {
    entreprise = await Entreprise.create({
      utilisateurId: entUser.id,
      nom: 'Orange Sénégal',
      secteur: 'TECH',
      pays: 'SENEGAL',
      description: 'Opérateur de télécommunications.',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Orange'
    });
  }

  // 3. Créer des Campagnes
  console.log('📦 Création de campagnes...');
  const dateActuelle = new Date();
  const dateDans1Mois = new Date(dateActuelle);
  dateDans1Mois.setMonth(dateDans1Mois.getMonth() + 1);

  const campagnes = await Campagne.bulkCreate([
    { entrepriseId: entreprise.id, titre: 'Lancement de la 5G', description: 'Faites la promotion de notre nouveau réseau 5G !', objectifPrincipal: 'NOTORIETE', budget: 500000, statut: 'PUBLIEE', dateCreation: dateActuelle, dateDebut: dateActuelle, dateFin: dateDans1Mois },
    { entrepriseId: entreprise.id, titre: 'Offre Étudiante Rentrée', description: 'Une offre spéciale pour les étudiants de Dakar.', objectifPrincipal: 'VENTES', budget: 200000, statut: 'PUBLIEE', dateCreation: dateActuelle, dateDebut: dateActuelle, dateFin: dateDans1Mois }
  ], { returning: true });

  await CampagnePlateforme.bulkCreate([
    { campagneId: campagnes[0].id, plateforme: 'INSTAGRAM' },
    { campagneId: campagnes[0].id, plateforme: 'TIKTOK' },
    { campagneId: campagnes[1].id, plateforme: 'TIKTOK' }
  ]);

  // 4. Mettre en favoris
  console.log('📦 Création de favoris...');
  await Favori.destroy({ where: { createurId: createur.id } });
  await Favori.create({ createurId: createur.id, campagneId: campagnes[0].id });

  // 5. Créer des Collaborations
  console.log('📦 Création de collaborations...');
  // Collaboration en cours
  const collabEnCours = await Collaboration.create({
    campagneId: campagnes[0].id,
    createurId: createur.id,
    statut: 'TRAVAIL_EN_COURS',
    dateInvitation: new Date(),
    directiveSpeciale: 'Soyez très souriante et portez la couleur orange !'
  });

  const offres = await Offre.findAll({ where: { createurId: createur.id } });
  if (offres.length > 0) {
    await CollaborationContenu.create({
      collaborationId: collabEnCours.id,
      offreId: offres[1].id,
      typeContenu: 'VIDEO_COURTE',
      quantite: 1,
      prixUnitaire: 100000,
      sousTotal: 100000,
      statut: 'ACCEPTEE'
    });
  }

  // Collaboration terminée
  const collabTerminee = await Collaboration.create({
    campagneId: campagnes[1].id,
    createurId: createur.id,
    statut: 'TERMINEE',
    dateInvitation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  });

  if (offres.length > 0) {
    await CollaborationContenu.create({
      collaborationId: collabTerminee.id,
      offreId: offres[0].id,
      typeContenu: 'POST_PHOTO',
      quantite: 1,
      prixUnitaire: 50000,
      sousTotal: 50000,
      statut: 'ACCEPTEE'
    });
  }

  // 6. Ajouter des messages
  console.log('📦 Création de messages...');
  await Message.create({ collaborationId: collabEnCours.id, expediteurId: entUser.id, contenu: 'Bonjour Aminata, bienvenue dans la campagne 5G !', dateEnvoi: new Date() });
  await Message.create({ collaborationId: collabEnCours.id, expediteurId: user.id, contenu: 'Bonjour ! Merci beaucoup, j\'ai hâte de commencer.', dateEnvoi: new Date(Date.now() + 1000) });

  // 7. Ajouter des transactions et paiements
  console.log('📦 Création de paiements...');
  await Transaction.bulkCreate([
    { utilisateurId: user.id, entrepriseId: entreprise.id, type: 'ENTREE', montant: 50000, statut: 'COMPLETE', referenceId: collabTerminee.id, referenceType: 'Collaboration', methode: 'SYSTEME', description: 'Paiement pour la campagne Offre Étudiante', dateCreation: new Date() }
  ]);

  const { Paiement } = models;
  await Paiement.destroy({ where: { createurId: createur.id } });
  await Paiement.create({
    collaborationId: collabTerminee.id,
    createurId: createur.id,
    entrepriseId: entreprise.id,
    montant: 50000,
    montantCommission: 5000,
    montantCreateur: 45000,
    statut: 'CONFIRME',
    datePaiement: new Date(),
    dateConfirmation: new Date()
  });

  // Ajouter une notification
  await Notification.create({
    destinataireId: user.id,
    entiteCibleId: collabEnCours.id,
    entiteCible: 'Collaboration',
    type: 'NOUVEAU_MESSAGE',
    message: 'Nouveau message reçu pour la campagne Lancement de la 5G.',
    lue: false,
    dateCreation: new Date()
  });

  console.log('🎉 Seed de démonstration terminé !');
  process.exit(0);
}

seedDemoData();
