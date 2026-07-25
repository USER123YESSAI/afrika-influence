// backend/services/moderateurService.js
import { Op } from 'sequelize';
import models, { sequelize } from '../models/index.js';
import { creerNotification } from './notificationService.js';
import { MOTIF_LABELS } from './emailService.js';
import { rembourserSolde } from './soldeService.js';

const {
  Utilisateur, Entreprise, Createur, Campagne, Collaboration,
  CollaborationContenu, Soumission, Offre, Signalement, Log,
} = models;

// Statuts de collaboration considérés "actifs" — un modérateur qui suspend/rejette
// une campagne doit pouvoir arrêter même une collaboration en cours (contrairement
// à l'entreprise elle-même, qui est bloquée dans ce cas côté campagneController).
const STATUTS_COLLAB_ACTIFS = [
  'INVITATION_ACCEPTEE', 'TRAVAIL_EN_COURS', 'CONTENU_SOUMIS', 'CONTENU_VALIDE', 'PAIEMENT_EFFECTUE',
];

// ─── STATS TABLEAU DE BORD ────────────────────────────────────────────────────
export async function getStats() {
  const [
    campagnesAControler,
    signalementsEnAttente,
    soumissionsRecentes,
    actionsAujourdhui,
  ] = await Promise.all([
    Campagne.count({ where: { statut: { [Op.in]: ['PUBLIEE', 'EN_COURS'] } } }),
    Signalement.count({ where: { statut: 'EN_ATTENTE' } }),
    Soumission.count({ where: { dateSoumission: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    Log.count({
      where: {
        dateAction: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return {
    campagnesAControler,
    signalementsEnAttente,
    soumissionsRecentes,
    actionsAujourdhui,
  };
}

// ─── CAMPAGNES ────────────────────────────────────────────────────────────────
export async function getCampagnesAControler({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;
  else where.statut = { [Op.in]: ['PUBLIEE', 'EN_COURS'] };

  const { count, rows } = await Campagne.findAndCountAll({
    where,
    include: [{ model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'logoUrl'] }],
    order: [['dateCreation', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), campagnes: rows };
}

// Suspendre/Rejeter une campagne a posteriori — il n'y a plus de portail d'approbation
// avant publication (l'entreprise publie et débite son solde directement ; décision prise
// pour ne pas dégrader l'expérience utilisateur). Cette action doit donc rembourser le
// budget non consommé et arrêter les collaborations en cours exactement comme le ferait
// l'entreprise elle-même via annulerCampagne — sauf que le modérateur n'est jamais bloqué
// par une collaboration active : il doit pouvoir arrêter une campagne problématique
// immédiatement, chaque créateur concerné étant notifié individuellement.
export async function modererCampagne(campagneId, action, raison, moderateurId) {
  const actionsValides = ['SUSPENDRE', 'REJETER'];
  if (!actionsValides.includes(action))
    throw { status: 400, message: `Action invalide. Valeurs : ${actionsValides.join(', ')}.` };

  return sequelize.transaction(async (t) => {
    const campagne = await Campagne.findByPk(campagneId, {
      include: [{ model: Entreprise, as: 'entreprise' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!campagne) throw { status: 404, message: 'Campagne introuvable.' };
    if (['ANNULEE', 'TERMINEE'].includes(campagne.statut))
      throw { status: 400, message: `Cette campagne est déjà ${campagne.statut === 'ANNULEE' ? 'annulée' : 'terminée'}.` };

    const budgetReserve = ['PUBLIEE', 'EN_COURS'].includes(campagne.statut);
    const libelleAction = action === 'SUSPENDRE' ? 'suspendue' : 'rejetée';

    if (budgetReserve) {
      const collabsActives = await Collaboration.findAll({
        where: { campagneId: campagne.id, statut: STATUTS_COLLAB_ACTIFS },
        include: [{ model: Createur, as: 'createur' }],
        transaction: t,
      });
      for (const collab of collabsActives) {
        await collab.update({ statut: 'REFUSEE' }, { transaction: t });
        if (collab.createur?.utilisateurId) {
          const messageCreateur = `La campagne "${campagne.titre}" a été arrêtée par la modération.${raison ? ' Motif : ' + raison : ''}`;
          await creerNotification(
            collab.createur.utilisateurId, 'COLLABORATION_REFUSEE', 'Collaboration', collab.id,
            messageCreateur.slice(0, 500)
          );
        }
      }

      const montantARembourser = parseFloat(campagne.budget) - parseFloat(campagne.budgetDepense || 0);
      if (montantARembourser > 0) {
        await rembourserSolde(
          campagne.entrepriseId,
          montantARembourser,
          campagne.id,
          `Campagne "${campagne.titre}" ${libelleAction} par la modération`,
          t
        );
      }
    }

    campagne.statut = 'ANNULEE';
    await campagne.save({ transaction: t });

    if (campagne.entreprise?.utilisateurId) {
      const messageEntreprise = `Votre campagne "${campagne.titre}" a été ${libelleAction} par la modération.${raison ? ' Motif : ' + raison : ''}`;
      await creerNotification(
        campagne.entreprise.utilisateurId, `CAMPAGNE_${action}`, 'Campagne', campagneId,
        messageEntreprise.slice(0, 500)
      );
    }

    return { campagne, raison };
  });
}

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────
export async function getSignalements({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;

  const { count, rows } = await Signalement.findAndCountAll({
    where,
    include: [{ model: Utilisateur, as: 'auteur', attributes: ['id', 'nom', 'email', 'role'] }],
    order: [['dateCreation', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), signalements: rows };
}

// Notifie l'auteur du signalement (résultat de son signalement) et, si celui-ci est jugé
// fondé (TRAITE) et cible un utilisateur, avertit aussi cette personne directement
// (notification in-app + email reprenant motif et le message rédigé par le modérateur).
// Le statut stocké est 'TRAITE', identique à celui utilisé côté admin (même table,
// mêmes valeurs) — seul le libellé affiché ("Résolu") diffère côté interface modérateur.
// Avant ce correctif, le modérateur écrivait 'RESOLU' : un signalement traité par un
// modérateur devenait invisible dans le filtre "Traités" de l'admin, et inversement.
export async function traiterSignalement(signalementId, statut, decisionAdmin, moderateurId) {
  const sig = await Signalement.findByPk(signalementId);
  if (!sig) throw { status: 404, message: 'Signalement introuvable.' };

  await sig.update({ statut, decisionAdmin, adminId: moderateurId, dateTraitement: new Date() });

  const messageAuteur = statut === 'TRAITE'
    ? 'Votre signalement a été jugé fondé — un avertissement a été envoyé à la personne concernée.'
    : 'Votre signalement a été examiné et rejeté.';
  await creerNotification(sig.auteurId, 'SIGNALEMENT_TRAITE', 'Signalement', signalementId, messageAuteur);

  if (statut === 'TRAITE' && sig.entiteCible === 'Utilisateur') {
    const cible = await Utilisateur.findByPk(sig.cibleId);
    if (cible) {
      const motifLabel = MOTIF_LABELS[sig.motif] || sig.motif;
      const message = `${motifLabel}${decisionAdmin ? ' — ' + decisionAdmin : ''}`.slice(0, 500);
      await creerNotification(cible.id, 'AVERTISSEMENT_SIGNALEMENT', 'Signalement', signalementId, message);
      import('./emailService.js')
        .then(({ sendAvertissementEmail }) => sendAvertissementEmail(cible.email, cible.nom, sig.motif, decisionAdmin))
        .catch(console.error);
    }
  }

  return sig;
}

// ─── CONTENUS ─────────────────────────────────────────────────────────────────
// Vue de visibilité sur les vraies soumissions (une par unité de contenu livrée),
// pas un portail de validation : depuis la refonte de la négociation ligne par ligne,
// c'est l'entreprise qui valide/refuse chaque soumission directement, avec paiement
// automatique immédiat — il n'y a plus d'étape modérateur avant que ça compte, comme
// pour les campagnes. `Collaboration.statut` ne passe d'ailleurs plus jamais par
// 'CONTENU_SOUMIS' dans le code actuel : l'ancienne version de cette fonction, qui
// filtrait dessus, ne retournait donc plus jamais aucun résultat.
// Si un contenu pose problème, l'intervention se fait au niveau de la campagne
// (suspendre/rejeter) ou du compte du créateur (sanctions), pas ici : il n'existe
// aucun mécanisme pour annuler un paiement déjà versé automatiquement.
export async function getContenus({ statut, page = 1, limit = 20 }) {
  const where = {};
  if (statut) where.statut = statut;

  const { count, rows } = await Soumission.findAndCountAll({
    where,
    include: [{
      model: CollaborationContenu,
      as: 'ligne',
      include: [
        { model: Offre, as: 'offre', attributes: ['id', 'typeContenu', 'reseau'] },
        {
          model: Collaboration,
          include: [
            { model: Createur, as: 'createur', attributes: ['id', 'nom', 'handle'] },
            { model: Campagne, as: 'campagne', attributes: ['id', 'titre'] },
          ],
        },
      ],
    }],
    order: [['dateSoumission', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), soumissions: rows };
}

// ─── SANCTIONS ────────────────────────────────────────────────────────────────
// CORRECTION RBAC : même règle que changerStatutUtilisateur (adminService.js)
// — cette route est un second chemin permettant de suspendre/bannir un
// compte, elle doit donc respecter la même limite : un modérateur ne peut
// pas sanctionner un compte ADMINISTRATEUR ou MODERATEUR, ni son propre compte.
export async function appliquerSanction(utilisateurId, action, raison, acteur) {
  const actionsValides = ['AVERTIR', 'SUSPENDRE', 'BLOQUER', 'BANNIR'];
  if (!actionsValides.includes(action))
    throw { status: 400, message: `Action invalide. Valeurs : ${actionsValides.join(', ')}.` };

  const utilisateur = await Utilisateur.findByPk(utilisateurId);
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };

  if (utilisateur.id === acteur.id)
    throw { status: 400, message: 'Vous ne pouvez pas sanctionner votre propre compte.' };

  if (acteur.role === 'MODERATEUR' && ['ADMINISTRATEUR', 'MODERATEUR'].includes(utilisateur.role))
    throw { status: 403, message: 'Seul un administrateur peut sanctionner un compte administrateur ou modérateur.' };

  if (action === 'SUSPENDRE') await utilisateur.update({ statut: 'suspended' });
  if (action === 'BLOQUER')   await utilisateur.update({ statut: 'rejected' });
  if (action === 'BANNIR')    await utilisateur.update({ statut: 'banned' });

  await creerNotification(utilisateurId, `COMPTE_${action}`, 'Utilisateur', utilisateurId);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return { utilisateur: data, action, raison };
}

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────
export async function getHistoriqueActions(moderateurId, { page = 1, limit = 30 }) {
  const { count, rows } = await Log.findAndCountAll({
    where: { acteurId: moderateurId },
    order: [['dateAction', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { total: count, page, totalPages: Math.ceil(count / limit), actions: rows };
}
