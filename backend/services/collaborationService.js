import models, { sequelize } from '../models/index.js';
import { creerNotification } from './notificationService.js';

const { Collaboration, CollaborationContenu, Createur, Offre } = models;

// ─── HELPER : charger une collaboration ou lever une 404 ──────────────────────
async function findCollabOrFail(collaborationId, includes = []) {
  const collab = await Collaboration.findByPk(collaborationId, { include: includes });
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };
  return collab;
}

// ─── HELPER : vérifier la transition de statut attendue ──────────────────────
function assertStatut(collab, statutAttendu) {
  if (collab.statut !== statutAttendu)
    throw {
      status: 400,
      message: `Action impossible : statut actuel "${collab.statut}", attendu "${statutAttendu}".`,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSACTION 1 : inviterCreateur
// ════════════════════════════════════════════════════════════════════════════

export async function inviterCreateur({ campagneId, createurId, directiveSpeciale }) {
  const { Campagne } = models;

  const collaboration = await sequelize.transaction(async (t) => {

    // 1. Vérifier que la campagne existe et est publiée
    const campagne = await Campagne.findByPk(campagneId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!campagne)
      throw { status: 404, message: 'Campagne introuvable.' };
    if (!['PUBLIEE', 'EN_COURS'].includes(campagne.statut))
      throw { status: 400, message: 'La campagne doit être publiée pour inviter des créateurs.' };

    // 2. Vérifier que le créateur existe
    const createur = await Createur.findByPk(createurId, { transaction: t });
    if (!createur)
      throw { status: 404, message: 'Créateur introuvable.' };

    // 3. Vérifier l'absence de doublon dans la même transaction
    //    La 2e requête simultanée attendra et trouvera la collab déjà créée → 409
    const existante = await Collaboration.findOne({
      where: { campagneId, createurId },
      transaction: t,
    });
    if (existante)
      throw { status: 409, message: 'Ce créateur a déjà été invité pour cette campagne.' };

    // 4. Créer la collaboration — seulement si tout est bon
    return Collaboration.create({
      campagneId,
      createurId,
      directiveSpeciale,
      statut: 'INVITATION_ENVOYEE',
      dateInvitation: new Date(),
    }, { transaction: t });

  }); 

  // Notification hors transaction — son échec ne rollback pas la création
  const createur = await Createur.findByPk(createurId, { include: [{ model: models.Utilisateur, as: 'utilisateur' }] });
  if (createur) {
    await creerNotification(createur.utilisateurId, 'NOUVELLE_INVITATION', 'Collaboration', collaboration.id);
    if (createur.utilisateur && createur.utilisateur.email) {
      const campagneInfo = await models.Campagne.findByPk(campagneId);
      import('./emailService.js').then(({ sendNewInvitationEmail }) => {
        sendNewInvitationEmail(createur.utilisateur.email, createur.nom, campagneInfo ? campagneInfo.titre : 'Nouvelle campagne').catch(console.error);
      });
    }
  }

  return collaboration;
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSACTION 2 : ajouterContenu
// ════════════════════════════════════════════════════════════════════════════

export async function ajouterContenu(collaborationId, utilisateurId, { offreId, quantite }) {
  const { Campagne } = models;

  return sequelize.transaction(async (t) => {

    // 1. Charger la collaboration avec verrou
    //    Empêche deux requêtes simultanées de lire le même budget disponible
    const collab = await Collaboration.findByPk(collaborationId, {
      include: [
        { model: Createur,             as: 'createur' },
        { model: Campagne,             as: 'campagne' },
        { model: CollaborationContenu, as: 'contenus' },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!collab)
      throw { status: 404, message: 'Collaboration introuvable.' };

    // 2. Vérifications métier
    if (collab.createur.utilisateurId !== utilisateurId)
      throw { status: 403, message: 'Accès interdit.' };

    if (!['TRAVAIL_EN_COURS', 'INVITATION_ACCEPTEE'].includes(collab.statut))
      throw { status: 400, message: 'Impossible d\'ajouter des contenus dans ce statut.' };

    // 3. Vérifier l'offre et son appartenance
    const offre = await Offre.findByPk(offreId, { transaction: t });
    if (!offre)
      throw { status: 404, message: 'Offre introuvable.' };
    if (offre.createurId !== collab.createurId)
      throw { status: 400, message: 'Cette offre ne vous appartient pas.' };

    // 4. Calculer le sous-total
    const prixUnitaire = parseFloat(offre.prix);
    const sousTotal    = parseFloat((prixUnitaire * quantite).toFixed(2));

    // 5. Vérifier que le budget ne sera pas dépassé
    const budgetMax     = parseFloat(collab.campagne.budget);
    const budgetDepense = parseFloat(collab.campagne.budgetDepense || 0);
    const totalActuel   = collab.contenus
      .reduce((s, c) => s + parseFloat(c.sousTotal || 0), 0);

    if (budgetDepense + totalActuel + sousTotal > budgetMax) {
      const disponible = (budgetMax - budgetDepense - totalActuel).toFixed(0);
      throw {
        status: 400,
        message: `Budget dépassé. Disponible : ${parseInt(disponible).toLocaleString('fr-FR')} FCFA.`,
      };
    }

    // 6. Les deux écritures en parallèle — toutes les deux ou aucune
    const [ligne] = await Promise.all([

      // Écriture 1 : créer la ligne de contenu
      CollaborationContenu.create({
        collaborationId,
        offreId,
        typeContenu:  offre.typeContenu,
        quantite,
        prixUnitaire,
        sousTotal,
      }, { transaction: t }),

      // Écriture 2 : mettre à jour budgetDepense sur la campagne
      collab.campagne.update(
        { budgetDepense: parseFloat((budgetDepense + sousTotal).toFixed(2)) },
        { transaction: t }
      ),

    ]);

    return ligne;
  });
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
      { model: CollaborationContenu, as: 'contenus', attributes: ['sousTotal'] },
    ],
    order: [['dateInvitation', 'DESC']],
  });

  if (role === 'ENTREPRISE') {
    const { Entreprise } = models;
    const entreprise = await Entreprise?.findOne({ where: { utilisateurId } });
    if (!entreprise) throw { status: 404, message: 'Profil entreprise introuvable.' };
    return collaborations.filter((c) => c.campagne?.entrepriseId === entreprise.id);
  }

  return collaborations;
}

// ─── DETAIL ────────────────────────────────────────────────────────────────────
// Détail d'une collaboration, avec totalRemuneration calculé pour P2 (paiement)

export async function getCollaboration(collaborationId) {
  const { Campagne } = models;

  const collab = await Collaboration.findByPk(collaborationId, {
    include: [
      { model: Campagne, as: 'campagne' },
      { model: Createur, as: 'createur', attributes: ['id', 'nom', 'handle', 'photoProfilUrl', 'utilisateurId'] },
      {
        model: CollaborationContenu, as: 'contenus',
        include: [{ model: Offre, as: 'offre' }],
      },
    ],
  });
  if (!collab) throw { status: 404, message: 'Collaboration introuvable.' };

  // totalRemuneration exposé pour P2 (déclenchement paiement)
  const totalRemuneration = collab.contenus
    .reduce((sum, c) => sum + parseFloat(c.sousTotal || 0), 0);

  return { ...collab.toJSON(), totalRemuneration };
}

// ─── ACCEPTER ──────────────────────────────────────────────────────────────────
// Pas de transaction — une seule table, risque de double-clic géré par l'UI

export async function accepterCollaboration(collaborationId, utilisateurId) {
  const { Campagne } = models;

  const collab = await findCollabOrFail(collaborationId, [
    { model: Createur, as: 'createur' },
    { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
  ]);

  if (collab.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Seul le créateur invité peut accepter cette collaboration.' };

  assertStatut(collab, 'INVITATION_ENVOYEE');

  await collab.update({ statut: 'TRAVAIL_EN_COURS', dateAcceptation: new Date() });
  await creerNotification(collab.campagne.entrepriseId, 'COLLABORATION_ACCEPTEE', 'Collaboration', collab.id);
  return collab;
}

// ─── REFUSER ───────────────────────────────────────────────────────────────────

export async function refuserCollaboration(collaborationId, utilisateurId) {
  const { Campagne } = models;

  const collab = await findCollabOrFail(collaborationId, [
    { model: Createur, as: 'createur' },
    { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
  ]);

  if (collab.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Seul le créateur invité peut refuser cette collaboration.' };

  assertStatut(collab, 'INVITATION_ENVOYEE');

  await collab.update({ statut: 'REFUSEE' });
  await creerNotification(collab.campagne.entrepriseId, 'COLLABORATION_REFUSEE', 'Collaboration', collab.id);
  return collab;
}

// ─── SOUMETTRE ─────────────────────────────────────────────────────────────────

export async function soumettreContenu(collaborationId, utilisateurId, contenuUrl) {
  const { Campagne } = models;

  const collab = await findCollabOrFail(collaborationId, [
    { model: Createur, as: 'createur' },
    { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
  ]);

  if (collab.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };

  assertStatut(collab, 'TRAVAIL_EN_COURS');

  await collab.update({ statut: 'CONTENU_SOUMIS', contenuUrl, dateSoumission: new Date() });
  await creerNotification(collab.campagne.entrepriseId, 'CONTENU_SOUMIS', 'Collaboration', collab.id);
  return collab;
}

// ─── VALIDER ───────────────────────────────────────────────────────────────────

export async function validerContenu(collaborationId, utilisateurId) {
  const { Campagne, Entreprise } = models;

  const collab = await findCollabOrFail(collaborationId, [
    { model: Createur, as: 'createur' },
    { model: Campagne, as: 'campagne', attributes: ['entrepriseId'] },
  ]);

  const entreprise = await Entreprise?.findOne({ where: { utilisateurId } });
  if (!entreprise || collab.campagne.entrepriseId !== entreprise.id)
    throw { status: 403, message: 'Seule l\'entreprise propriétaire peut valider le contenu.' };

  assertStatut(collab, 'CONTENU_SOUMIS');

  await collab.update({ statut: 'CONTENU_VALIDE', dateValidation: new Date() });
  await creerNotification(collab.createur.utilisateurId, 'CONTENU_VALIDE', 'Collaboration', collab.id);
  return collab;
}

// ─── LISTER CONTENUS ───────────────────────────────────────────────────────────

export async function listerContenus(collaborationId) {
  return CollaborationContenu.findAll({
    where: { collaborationId },
    include: [{ model: Offre, as: 'offre' }],
  });
}
