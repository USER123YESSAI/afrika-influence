import models from '../models/index.js';
import { creerNotification } from './notificationService.js';

const { Message, Collaboration, Createur } = models;

// ─── HELPER : vérifier l'accès à la messagerie ────────────────────────────────

async function verifierAcces(collaborationId, utilisateurId) {
  const { Campagne, Entreprise } = models;

  const collab = await Collaboration.findByPk(collaborationId, {
    include: [
      { model: Createur, as: 'createur', attributes: ['utilisateurId'] },
      { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
    ],
  });
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };

  const estCreateur = collab.createur?.utilisateurId === utilisateurId;

  let estEntreprise = false;
  if (!estCreateur) {
    const entreprise = await Entreprise?.findOne({ where: { utilisateurId } });
    estEntreprise = entreprise && collab.campagne?.entrepriseId === entreprise.id;
  }

  if (!estCreateur && !estEntreprise)
    throw { status: 403, message: 'Accès à cette messagerie interdit.' };

  return { collab, estCreateur };
}

// ─── HISTORIQUE ────────────────────────────────────────────────────────────────

export async function getHistorique(collaborationId, utilisateurId) {
  await verifierAcces(collaborationId, utilisateurId);

  return Message.findAll({
    where: { collaborationId },
    include: [{
      model: models.Utilisateur,
      as: 'expediteur',
      attributes: ['id', 'nom', 'role'],
    }],
    order: [['dateEnvoi', 'ASC']],
  });
}

// ─── ENVOYER MESSAGE ───────────────────────────────────────────────────────────

export async function envoyerMessage(collaborationId, utilisateurId, contenu) {
  await verifierAcces(collaborationId, utilisateurId);

  const message = await Message.create({
    collaborationId,
    expediteurId: utilisateurId,
    contenu: contenu.trim(),
    dateEnvoi: new Date(),
  });

  // Notification hors du flux principal — pas critique
  try {
    const { collab } = await verifierAcces(collaborationId, utilisateurId);
    const expediteurInfo = await models.Utilisateur.findByPk(utilisateurId);
    let destinataireId, destinataireNom, destinataireEmail;

    if (collab.createur.utilisateurId === utilisateurId) {
      // Message envoyé par le créateur -> le destinataire est l'entreprise
      const entreprise = await models.Entreprise.findByPk(collab.campagne.entrepriseId, {
        include: [{ model: models.Utilisateur, as: 'utilisateur' }]
      });
      if (entreprise && entreprise.utilisateur) {
        destinataireId = entreprise.utilisateurId;
        destinataireNom = entreprise.nomEntreprise || entreprise.utilisateur.nom;
        destinataireEmail = entreprise.utilisateur.email;
      }
    } else {
      // Message envoyé par l'entreprise -> le destinataire est le créateur
      const createur = await models.Createur.findByPk(collab.createurId, {
        include: [{ model: models.Utilisateur, as: 'utilisateur' }]
      });
      if (createur && createur.utilisateur) {
        destinataireId = createur.utilisateurId;
        destinataireNom = createur.nom;
        destinataireEmail = createur.utilisateur.email;
      }
    }

    if (destinataireId) {
      await creerNotification(destinataireId, 'NOUVEAU_MESSAGE', 'Collaboration', collaborationId);
    }
    
    if (destinataireEmail && expediteurInfo) {
      const campagneInfo = await models.Campagne.findByPk(collab.campagneId);
      import('./emailService.js').then(({ sendNewMessageEmail }) => {
        sendNewMessageEmail(destinataireEmail, destinataireNom, expediteurInfo.nom, campagneInfo ? campagneInfo.titre : 'votre collaboration').catch(console.error);
      });
    }
  } catch (err) { console.error('Erreur notif message', err); }

  return message;
}

// ─── ENVOYER FICHIER ───────────────────────────────────────────────────────────

export async function envoyerFichier(collaborationId, utilisateurId, fichierUrl) {
  await verifierAcces(collaborationId, utilisateurId);

  return Message.create({
    collaborationId,
    expediteurId: utilisateurId,
    fichierUrl,
    dateEnvoi: new Date(),
  });
}

// ─── MARQUER LU ────────────────────────────────────────────────────────────────

export async function marquerLu(messageId, utilisateurId) {
  const msg = await Message.findByPk(messageId);
  if (!msg) throw { status: 404, message: 'Message introuvable.' };

  if (msg.expediteurId === utilisateurId)
    throw { status: 400, message: 'Vous ne pouvez pas marquer votre propre message comme lu.' };

  await verifierAcces(msg.collaborationId, utilisateurId);
  await msg.update({ lu: true });
  return msg;
}
