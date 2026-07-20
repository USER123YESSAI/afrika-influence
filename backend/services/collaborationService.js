import models, { sequelize } from '../models/index.js';
import { creerNotification } from './notificationService.js';
import { payerCreateurAutomatiquement } from './paiementService.js';

const { Collaboration, CollaborationContenu, Soumission, Createur, Offre } = models;

// Statuts de collaboration considérés comme "actifs" (avant décision finale)
const STATUTS_REFUSABLES = ['INVITATION_ENVOYEE', 'CANDIDATURE_ENVOYEE', 'TRAVAIL_EN_COURS'];

// ─── HELPER : charger une collaboration ou lever une 404 ──────────────────────
async function findCollabOrFail(collaborationId, includes = []) {
  const collab = await Collaboration.findByPk(collaborationId, { include: includes });
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };
  return collab;
}

async function getEntrepriseByUser(utilisateurId, transaction) {
  const { Entreprise } = models;
  return Entreprise.findOne({ where: { utilisateurId }, transaction });
}

// ─── HELPER : notifier l'entreprise propriétaire d'une campagne ───────────────
// Notification.destinataireId doit être un Utilisateur.id — jamais l'Entreprise.id
// (campagne.entrepriseId référence Entreprise, pas Utilisateur).
async function notifierEntreprise(entrepriseId, type, entiteCible, entiteCibleId, transaction) {
  const { Entreprise } = models;
  const entreprise = await Entreprise.findByPk(entrepriseId, { transaction });
  if (entreprise) await creerNotification(entreprise.utilisateurId, type, entiteCible, entiteCibleId);
}

// ═════════════════════════════════════════════════════════════════════════════
// INVITER (entreprise → créateur) / POSTULER (créateur → entreprise)
// ════════════════════════════════════════════════════════════════════════════

async function creerCollaboration({ campagneId, createurId, directiveSpeciale, statutInitial }) {
  const { Campagne } = models;

  const collaboration = await sequelize.transaction(async (t) => {
    const campagne = await Campagne.findByPk(campagneId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!campagne) throw { status: 404, message: 'Campagne introuvable.' };
    if (!['PUBLIEE', 'EN_COURS'].includes(campagne.statut))
      throw { status: 400, message: 'La campagne doit être publiée.' };

    const createur = await Createur.findByPk(createurId, { transaction: t });
    if (!createur) throw { status: 404, message: 'Créateur introuvable.' };

    const existante = await Collaboration.findOne({ where: { campagneId, createurId }, transaction: t });
    if (existante)
      throw { status: 409, message: 'Une collaboration existe déjà entre ce créateur et cette campagne.' };

    return Collaboration.create({
      campagneId,
      createurId,
      directiveSpeciale,
      statut: statutInitial,
      dateInvitation: new Date(),
    }, { transaction: t });
  });

  return collaboration;
}

export async function inviterCreateur({ campagneId, createurId, directiveSpeciale }) {
  const collaboration = await creerCollaboration({
    campagneId, createurId, directiveSpeciale, statutInitial: 'INVITATION_ENVOYEE',
  });

  // Notification hors transaction — son échec ne rollback pas la création
  const createur = await Createur.findByPk(createurId, { include: [{ model: models.Utilisateur, as: 'utilisateur' }] });
  if (createur) {
    await creerNotification(createur.utilisateurId, 'NOUVELLE_INVITATION', 'Collaboration', collaboration.id);
    if (createur.utilisateur && createur.utilisateur.email) {
      const campagneInfo = await models.Campagne.findByPk(campagneId);
      import('./emailService.js')
        .then(({ sendNewInvitationEmail }) =>
          sendNewInvitationEmail(createur.utilisateur.email, createur.nom, campagneInfo ? campagneInfo.titre : 'Nouvelle campagne')
        )
        .catch(console.error);
    }
  }

  return collaboration;
}

export async function postulerCampagne({ campagneId, utilisateurId }) {
  const createur = await Createur.findOne({ where: { utilisateurId } });
  if (!createur) throw { status: 404, message: 'Profil créateur introuvable.' };

  const collaboration = await creerCollaboration({
    campagneId, createurId: createur.id, statutInitial: 'CANDIDATURE_ENVOYEE',
  });

  const { Campagne } = models;
  const campagne = await Campagne.findByPk(campagneId, { attributes: ['entrepriseId', 'titre'] });
  await notifierEntreprise(campagne.entrepriseId, 'NOUVELLE_CANDIDATURE', 'Collaboration', collaboration.id);

  return collaboration;
}

// ─── LISTER ────────────────────────────────────────────────────────────────────

export async function listerCollaborations(utilisateurId, role, filtres = {}) {
  const { Campagne } = models;
  const where = {};

  if (role === 'CREATEUR') {
    const createur = await Createur.findOne({ where: { utilisateurId } });
    if (!createur) throw { status: 404, message: 'Profil créateur introuvable.' };
    where.createurId = createur.id;
  }

  if (filtres.statut) where.statut = filtres.statut;

  const collaborations = await Collaboration.findAll({
    where,
    include: [
      {
        model: Campagne, as: 'campagne',
        attributes: ['id', 'titre', 'objectifPrincipal', 'budget', 'budgetDepense', 'entrepriseId', 'dateFin'],
      },
      { model: Createur, as: 'createur', attributes: ['id', 'nom', 'handle', 'photoProfilUrl'] },
      { model: CollaborationContenu, as: 'contenus', attributes: ['id', 'statut', 'quantite', 'sousTotal'] },
    ],
    order: [['dateInvitation', 'DESC']],
  });

  if (role === 'ENTREPRISE') {
    const entreprise = await getEntrepriseByUser(utilisateurId);
    if (!entreprise) throw { status: 404, message: 'Profil entreprise introuvable.' };
    return collaborations.filter((c) => c.campagne?.entrepriseId === entreprise.id);
  }

  return collaborations;
}

// ─── DETAIL ────────────────────────────────────────────────────────────────────
// Détail d'une collaboration, avec totalRemuneration/totalValide calculés
// (lignes acceptées uniquement, validation comptée par soumission unitaire).

export async function getCollaboration(collaborationId) {
  const { Campagne, Entreprise } = models;

  const collab = await Collaboration.findByPk(collaborationId, {
    include: [
      {
        model: Campagne, as: 'campagne',
        include: [{ model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'utilisateurId'] }],
      },
      { model: Createur, as: 'createur', attributes: ['id', 'nom', 'handle', 'photoProfilUrl', 'utilisateurId'] },
      {
        model: CollaborationContenu, as: 'contenus',
        include: [{ model: Offre, as: 'offre' }, { model: Soumission, as: 'soumissions' }],
      },
    ],
    order: [[{ model: CollaborationContenu, as: 'contenus' }, 'dateProposition', 'ASC']],
  });
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };

  const lignesAcceptees = collab.contenus.filter((c) => c.statut === 'ACCEPTEE');
  const totalRemuneration = lignesAcceptees.reduce((sum, c) => sum + parseFloat(c.sousTotal || 0), 0);
  const totalValide = lignesAcceptees.reduce((sum, c) => {
    const validees = c.soumissions.filter((s) => s.dateValidation).length;
    return sum + validees * parseFloat(c.prixUnitaire);
  }, 0);

  return { ...collab.toJSON(), totalRemuneration, totalValide };
}

// ─── ACCEPTER (invitation OU candidature) ──────────────────────────────────────
// Invitation (entreprise → créateur) : seul le créateur invité peut accepter.
// Candidature (créateur → entreprise) : seule l'entreprise propriétaire peut accepter.

export async function accepterCollaboration(collaborationId, utilisateurId, role) {
  const { Campagne } = models;

  const collab = await findCollabOrFail(collaborationId, [
    { model: Createur, as: 'createur' },
    { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
  ]);

  if (collab.statut === 'INVITATION_ENVOYEE') {
    if (collab.createur.utilisateurId !== utilisateurId)
      throw { status: 403, message: 'Seul le créateur invité peut accepter cette invitation.' };
  } else if (collab.statut === 'CANDIDATURE_ENVOYEE') {
    const entreprise = await getEntrepriseByUser(utilisateurId);
    if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
      throw { status: 403, message: 'Seule la marque propriétaire de la campagne peut accepter cette candidature.' };
  } else {
    throw { status: 400, message: `Action impossible : statut actuel "${collab.statut}".` };
  }

  const statutOrigine = collab.statut;
  await collab.update({ statut: 'TRAVAIL_EN_COURS', dateAcceptation: new Date() });

  if (statutOrigine === 'INVITATION_ENVOYEE') {
    await notifierEntreprise(collab.campagne.entrepriseId, 'COLLABORATION_ACCEPTEE', 'Collaboration', collab.id);
  } else {
    await creerNotification(collab.createur.utilisateurId, 'CANDIDATURE_ACCEPTEE', 'Collaboration', collab.id);
  }

  return collab;
}

// ─── REFUSER LA COLLABORATION (créateur OU entreprise, à tout moment) ─────────
// Créateur : refuse une invitation, retire sa candidature, ou abandonne en cours de négociation.
// Entreprise : décline une candidature, ou écarte un créateur sans négociation ligne par ligne.
// Libère dans budgetDepense de la campagne les lignes ACCEPTEE non encore intégralement validées.

export async function refuserCollaboration(collaborationId, utilisateurId, role) {
  return sequelize.transaction(async (t) => {
    const collab = await Collaboration.findByPk(collaborationId, {
      include: [
        { model: Createur, as: 'createur' },
        { model: models.Campagne, as: 'campagne' },
        { model: CollaborationContenu, as: 'contenus', include: [{ model: Soumission, as: 'soumissions' }] },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };

    if (role === 'CREATEUR') {
      if (collab.createur.utilisateurId !== utilisateurId)
        throw { status: 403, message: 'Accès interdit.' };
    } else if (role === 'ENTREPRISE') {
      const entreprise = await getEntrepriseByUser(utilisateurId, t);
      if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
        throw { status: 403, message: 'Accès interdit.' };
    } else {
      throw { status: 403, message: 'Accès interdit.' };
    }

    if (!STATUTS_REFUSABLES.includes(collab.statut))
      throw { status: 400, message: `Impossible de refuser une collaboration au statut "${collab.statut}".` };

    // Libérer le budget des lignes acceptées mais pas intégralement validées
    const aLiberer = collab.contenus.filter((c) => {
      if (c.statut !== 'ACCEPTEE') return false;
      const validees = c.soumissions.filter((s) => s.dateValidation).length;
      return validees < c.quantite;
    });
    const montantALiberer = aLiberer.reduce((sum, c) => sum + parseFloat(c.sousTotal || 0), 0);

    if (montantALiberer > 0) {
      const nouveauBudgetDepense = parseFloat((parseFloat(collab.campagne.budgetDepense || 0) - montantALiberer).toFixed(2));
      await collab.campagne.update({ budgetDepense: Math.max(0, nouveauBudgetDepense) }, { transaction: t });
      await CollaborationContenu.update(
        { statut: 'REFUSEE', dateTraitement: new Date() },
        { where: { id: aLiberer.map((c) => c.id) }, transaction: t }
      );
    }

    await collab.update({ statut: 'REFUSEE' }, { transaction: t });

    if (role === 'CREATEUR') {
      await notifierEntreprise(collab.campagne.entrepriseId, 'COLLABORATION_REFUSEE', 'Collaboration', collab.id);
    } else {
      await creerNotification(collab.createur.utilisateurId, 'COLLABORATION_REFUSEE', 'Collaboration', collab.id);
    }

    return collab;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// LIGNES DE CONTENU — négociation ligne par ligne
// ═════════════════════════════════════════════════════════════════════════════

// ─── PROPOSER UNE LIGNE (créateur) ─────────────────────────────────────────────
// Aucune réservation de budget à ce stade — seulement à l'acceptation par la marque.

export async function proposerLigne(collaborationId, utilisateurId, { offreId, quantite, prixUnitaire }) {
  const collab = await findCollabOrFail(collaborationId, [{ model: Createur, as: 'createur' }]);

  if (collab.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (collab.statut !== 'TRAVAIL_EN_COURS')
    throw { status: 400, message: 'Impossible de proposer une ligne dans ce statut.' };

  const offre = await Offre.findByPk(offreId);
  if (!offre) throw { status: 404, message: 'Offre introuvable.' };
  if (offre.createurId !== collab.createurId)
    throw { status: 400, message: 'Cette offre ne vous appartient pas.' };

  const sousTotal = parseFloat((prixUnitaire * quantite).toFixed(2));

  const ligne = await CollaborationContenu.create({
    collaborationId,
    offreId,
    typeContenu: offre.typeContenu,
    quantite,
    prixUnitaire,
    sousTotal,
    statut: 'PROPOSEE',
    dateProposition: new Date(),
  });

  const { Campagne } = models;
  const campagne = await Campagne.findByPk(collab.campagneId, { attributes: ['entrepriseId'] });
  await notifierEntreprise(campagne.entrepriseId, 'LIGNE_PROPOSEE', 'Collaboration', collab.id);

  return ligne;
}

// ─── MODIFIER UNE LIGNE (créateur, avant acceptation) ──────────────────────────
// Permet d'ajuster une ligne refusée (ou encore en attente) pour la re-proposer.

export async function modifierLigne(ligneId, utilisateurId, { quantite, prixUnitaire }) {
  const ligne = await CollaborationContenu.findByPk(ligneId, {
    include: [{ model: Collaboration, include: [{ model: Createur, as: 'createur' }] }],
  });
  if (!ligne) throw { status: 404, message: 'Ligne introuvable.' };
  if (ligne.Collaboration.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (!['PROPOSEE', 'REFUSEE'].includes(ligne.statut))
    throw { status: 400, message: 'Cette ligne ne peut plus être modifiée (déjà acceptée).' };

  const nouvelleQuantite = quantite ?? ligne.quantite;
  const nouveauPrix      = prixUnitaire ?? ligne.prixUnitaire;

  await ligne.update({
    quantite: nouvelleQuantite,
    prixUnitaire: nouveauPrix,
    sousTotal: parseFloat((nouvelleQuantite * nouveauPrix).toFixed(2)),
    statut: 'PROPOSEE',
    dateTraitement: null,
  });

  return ligne;
}

// ─── SUPPRIMER UNE LIGNE (créateur, avant acceptation) ─────────────────────────

export async function supprimerLigne(ligneId, utilisateurId) {
  const ligne = await CollaborationContenu.findByPk(ligneId, {
    include: [{ model: Collaboration, include: [{ model: Createur, as: 'createur' }] }],
  });
  if (!ligne) throw { status: 404, message: 'Ligne introuvable.' };
  if (ligne.Collaboration.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (ligne.statut === 'ACCEPTEE')
    throw { status: 400, message: 'Impossible de supprimer une ligne déjà acceptée.' };

  await ligne.destroy();
}

// ─── TRAITER UNE LIGNE : accepter ou refuser (entreprise) ──────────────────────

export async function traiterLigne(ligneId, utilisateurId, action, raison) {
  return sequelize.transaction(async (t) => {
    const ligne = await CollaborationContenu.findByPk(ligneId, {
      include: [{
        model: Collaboration,
        include: [
          { model: Createur, as: 'createur' },
          { model: models.Campagne, as: 'campagne' },
        ],
      }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ligne) throw { status: 404, message: 'Ligne introuvable.' };

    const collab = ligne.Collaboration;
    const entreprise = await getEntrepriseByUser(utilisateurId, t);
    if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
      throw { status: 403, message: 'Accès interdit.' };

    if (ligne.statut !== 'PROPOSEE')
      throw { status: 400, message: `Cette ligne a déjà été traitée (statut "${ligne.statut}").` };

    if (action === 'ACCEPTER') {
      // Recharger la campagne avec verrou pour éviter une double-réservation concurrente
      const campagne = await models.Campagne.findByPk(collab.campagneId, { transaction: t, lock: t.LOCK.UPDATE });
      const budgetDisponible = parseFloat(campagne.budget) - parseFloat(campagne.budgetDepense || 0);
      if (parseFloat(ligne.sousTotal) > budgetDisponible) {
        throw {
          status: 400,
          message: `Budget de la campagne insuffisant. Disponible : ${budgetDisponible.toLocaleString('fr-FR')} FCFA, requis : ${parseFloat(ligne.sousTotal).toLocaleString('fr-FR')} FCFA.`,
        };
      }

      await campagne.update(
        { budgetDepense: parseFloat((parseFloat(campagne.budgetDepense || 0) + parseFloat(ligne.sousTotal)).toFixed(2)) },
        { transaction: t }
      );
      await ligne.update({ statut: 'ACCEPTEE', dateTraitement: new Date() }, { transaction: t });
      await creerNotification(collab.createur.utilisateurId, 'LIGNE_ACCEPTEE', 'Collaboration', collab.id);
    } else {
      await ligne.update({ statut: 'REFUSEE', dateTraitement: new Date(), raisonRefus: raison || null }, { transaction: t });
      await creerNotification(collab.createur.utilisateurId, 'LIGNE_REFUSEE', 'Collaboration', collab.id);
    }

    return ligne;
  });
}

// ─── SOUMETTRE UNE UNITÉ DE CONTENU (créateur) ─────────────────────────────────
// Une ligne acceptée de quantite=N attend N soumissions distinctes, validables une par une.

export async function soumettreLigne(ligneId, utilisateurId, contenuUrl) {
  const ligne = await CollaborationContenu.findByPk(ligneId, {
    include: [
      {
        model: Collaboration,
        include: [
          { model: Createur, as: 'createur' },
          { model: models.Campagne, as: 'campagne', attributes: ['entrepriseId'] },
        ],
      },
      { model: Soumission, as: 'soumissions' },
    ],
  });
  if (!ligne) throw { status: 404, message: 'Ligne introuvable.' };

  const collab = ligne.Collaboration;
  if (collab.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (ligne.statut !== 'ACCEPTEE')
    throw { status: 400, message: 'Seule une ligne acceptée peut recevoir un contenu.' };
  // Une soumission refusée libère sa place — seules EN_ATTENTE/VALIDEE comptent dans le quota.
  const soumissionsActives = ligne.soumissions.filter((s) => s.statut !== 'REFUSEE');
  if (soumissionsActives.length >= ligne.quantite)
    throw { status: 400, message: `Les ${ligne.quantite} unité(s) de cette ligne ont déjà été soumises.` };

  const soumission = await Soumission.create({ ligneId, contenuUrl, dateSoumission: new Date() });
  await notifierEntreprise(collab.campagne.entrepriseId, 'CONTENU_SOUMIS', 'Collaboration', collab.id);
  return soumission;
}

// ─── MODIFIER UNE SOUMISSION (créateur, tant qu'EN_ATTENTE) ────────────────────

export async function modifierSoumission(soumissionId, utilisateurId, contenuUrl) {
  const soumission = await Soumission.findByPk(soumissionId, {
    include: [{
      model: CollaborationContenu, as: 'ligne',
      include: [{ model: Collaboration, include: [{ model: Createur, as: 'createur' }] }],
    }],
  });
  if (!soumission) throw { status: 404, message: 'Soumission introuvable.' };
  if (soumission.ligne.Collaboration.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (soumission.statut !== 'EN_ATTENTE')
    throw { status: 400, message: `Cette soumission a déjà été traitée (statut "${soumission.statut}") et ne peut plus être modifiée.` };

  await soumission.update({ contenuUrl, dateSoumission: new Date() });
  return soumission;
}

// ─── SUPPRIMER UNE SOUMISSION (créateur, tant qu'EN_ATTENTE) ───────────────────

export async function supprimerSoumission(soumissionId, utilisateurId) {
  const soumission = await Soumission.findByPk(soumissionId, {
    include: [{
      model: CollaborationContenu, as: 'ligne',
      include: [{ model: Collaboration, include: [{ model: Createur, as: 'createur' }] }],
    }],
  });
  if (!soumission) throw { status: 404, message: 'Soumission introuvable.' };
  if (soumission.ligne.Collaboration.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  if (soumission.statut !== 'EN_ATTENTE')
    throw { status: 400, message: `Cette soumission a déjà été traitée (statut "${soumission.statut}") et ne peut plus être supprimée.` };

  await soumission.destroy();
}

// ─── VALIDER UNE SOUMISSION (entreprise) ───────────────────────────────────────
// Déclenche la clôture + le paiement automatique dès que toutes les unités de
// toutes les lignes acceptées de la collaboration sont validées.

export async function validerSoumission(soumissionId, utilisateurId) {
  const soumission = await Soumission.findByPk(soumissionId, {
    include: [{
      model: CollaborationContenu, as: 'ligne',
      include: [{
        model: Collaboration,
        include: [
          { model: Createur, as: 'createur' },
          { model: models.Campagne, as: 'campagne' },
          { model: CollaborationContenu, as: 'contenus', include: [{ model: Soumission, as: 'soumissions' }] },
        ],
      }],
    }],
  });
  if (!soumission) throw { status: 404, message: 'Soumission introuvable.' };
  if (soumission.statut !== 'EN_ATTENTE')
    throw { status: 400, message: `Cette soumission a déjà été traitée (statut "${soumission.statut}").` };

  const ligne = soumission.ligne;
  const collab = ligne.Collaboration;
  const entreprise = await getEntrepriseByUser(utilisateurId);
  if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
    throw { status: 403, message: 'Accès interdit.' };

  const maintenant = new Date();
  await soumission.update({ statut: 'VALIDEE', dateValidation: maintenant, dateTraitement: maintenant });
  await creerNotification(collab.createur.utilisateurId, 'CONTENU_VALIDE', 'Collaboration', collab.id);

  // Une ligne est "complète" quand toutes ses unités actives (hors refusées) sont
  // soumises ET validées. La collaboration se termine quand toutes ses lignes le sont.
  const lignesAcceptees = collab.contenus.filter((c) => c.statut === 'ACCEPTEE');
  const ligneComplete = (c) => {
    const soumissions = (c.id === ligne.id
      ? [...c.soumissions.filter((s) => s.id !== soumission.id), soumission.toJSON()]
      : c.soumissions
    ).filter((s) => s.statut !== 'REFUSEE');
    return soumissions.length >= c.quantite && soumissions.every((s) => s.statut === 'VALIDEE');
  };
  const toutesCompletes = lignesAcceptees.length > 0 && lignesAcceptees.every(ligneComplete);

  if (toutesCompletes) {
    await collab.update({ statut: 'TERMINEE' });
    // Paiement automatique et immédiat — la marque n'a plus rien à déclencher.
    await payerCreateurAutomatiquement(collab);
  }

  return soumission;
}

// ─── REFUSER UNE SOUMISSION (entreprise) ───────────────────────────────────────
// Ne libère pas le budget de la ligne (le travail reste dû) — libère seulement
// la place pour que le créateur puisse soumettre une nouvelle unité à la place.

export async function refuserSoumission(soumissionId, utilisateurId, raison) {
  const soumission = await Soumission.findByPk(soumissionId, {
    include: [{
      model: CollaborationContenu, as: 'ligne',
      include: [{
        model: Collaboration,
        include: [
          { model: Createur, as: 'createur' },
          { model: models.Campagne, as: 'campagne' },
        ],
      }],
    }],
  });
  if (!soumission) throw { status: 404, message: 'Soumission introuvable.' };
  if (soumission.statut !== 'EN_ATTENTE')
    throw { status: 400, message: `Cette soumission a déjà été traitée (statut "${soumission.statut}").` };

  const collab = soumission.ligne.Collaboration;
  const entreprise = await getEntrepriseByUser(utilisateurId);
  if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
    throw { status: 403, message: 'Accès interdit.' };

  await soumission.update({ statut: 'REFUSEE', raisonRefus: raison || null, dateTraitement: new Date() });
  await creerNotification(collab.createur.utilisateurId, 'CONTENU_REFUSE', 'Collaboration', collab.id);

  return soumission;
}

// ─── LISTER CONTENUS ───────────────────────────────────────────────────────────

export async function listerContenus(collaborationId) {
  return CollaborationContenu.findAll({
    where: { collaborationId },
    include: [{ model: Offre, as: 'offre' }, { model: Soumission, as: 'soumissions' }],
    order: [['dateProposition', 'ASC']],
  });
}
