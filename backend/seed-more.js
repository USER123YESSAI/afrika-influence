import dotenv from 'dotenv';
dotenv.config();

import models from './models/index.js';
import { sequelize } from './models/index.js';

const { Utilisateur, Createur, Entreprise, Campagne, Collaboration, CollaborationContenu, Offre } = models;

async function seedMore() {
  await sequelize.authenticate();
  
  const user = await Utilisateur.findOne({ where: { email: 'aminata@baobab.sn' } });
  const createur = await Createur.findOne({ where: { utilisateurId: user.id } });
  const entUser = await Utilisateur.findOne({ where: { email: 'contact@orange.sn' } });
  const entreprise = await Entreprise.findOne({ where: { utilisateurId: entUser.id } });

  const dateActuelle = new Date();
  
  // 1. Nouvelle campagne pour "Contenu soumis"
  const camp1 = await Campagne.create({ 
    entrepriseId: entreprise.id, 
    titre: 'Promotion Fibre Optique', 
    description: 'Une campagne pour la fibre.', 
    objectifPrincipal: 'VENTES', 
    budget: 150000, 
    statut: 'PUBLIEE', 
    dateCreation: dateActuelle, 
    dateDebut: dateActuelle, 
    dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
  });

  const collabSoumis = await Collaboration.create({
    campagneId: camp1.id,
    createurId: createur.id,
    statut: 'CONTENU_SOUMIS',
    dateInvitation: new Date(),
  });

  const offres = await Offre.findAll({ where: { createurId: createur.id } });
  if (offres.length > 0) {
    await CollaborationContenu.create({
      collaborationId: collabSoumis.id,
      offreId: offres[2].id,
      typeContenu: 'STORY',
      quantite: 1,
      prixUnitaire: 25000,
      sousTotal: 25000,
      statut: 'SOUMISE'
    });
  }

  // 2. Nouvelle campagne pour "Invitation reçue"
  const camp2 = await Campagne.create({ 
    entrepriseId: entreprise.id, 
    titre: 'Campagne de fin d\'année', 
    description: 'Pour les fêtes !', 
    objectifPrincipal: 'NOTORIETE', 
    budget: 300000, 
    statut: 'PUBLIEE', 
    dateCreation: dateActuelle, 
    dateDebut: dateActuelle, 
    dateFin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) 
  });

  await Collaboration.create({
    campagneId: camp2.id,
    createurId: createur.id,
    statut: 'INVITATION_ENVOYEE',
    dateInvitation: new Date(),
  });

  console.log('✅ Nouvelles collabs ajoutées !');
  process.exit(0);
}

seedMore();
