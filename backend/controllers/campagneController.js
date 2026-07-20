// backend/controllers/campagneController.js
import { sequelize, Campagne, Entreprise, CampagnePlateforme, CampagneMedia, Collaboration, CollaborationContenu, Soumission, Createur } from '../models/index.js';
import { creerLog } from '../services/logService.js';
import { debiterSolde, rembourserSolde } from '../services/soldeService.js';
import { STATUTS_COLLABORATION } from '../models/Collaboration.js';

// Statuts de collaboration signifiant qu'un créateur travaille déjà sur la campagne
// (au-delà d'une simple invitation en attente ou refusée).
const STATUTS_COLLAB_ACTIFS = [
  STATUTS_COLLABORATION.INVITATION_ACCEPTEE,
  STATUTS_COLLABORATION.TRAVAIL_EN_COURS,
  STATUTS_COLLABORATION.CONTENU_SOUMIS,
  STATUTS_COLLABORATION.CONTENU_VALIDE,
  STATUTS_COLLABORATION.PAIEMENT_EFFECTUE,
  STATUTS_COLLABORATION.TERMINEE,
];

const PLATEFORMES = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'FACEBOOK'];

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

const withPlateformes = { include: [{ model: CampagnePlateforme, as: 'plateformes' }] };
const withAll = {
  include: [
    { model: CampagnePlateforme, as: 'plateformes' },
    { model: CampagneMedia,      as: 'medias' },
  ],
};

const getEntrepriseByUser = (userId) => Entreprise.findOne({ where: { utilisateurId: userId } });

const checkOwnership = async (campagne, userId) => {
  const entreprise = await getEntrepriseByUser(userId);
  return entreprise && campagne.entrepriseId === entreprise.id ? entreprise : null;
};

export const createCampagne = async (req, res) => {
  try {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé. Complétez votre profil d\'abord.' });

    const { plateformes = [], ...campagneData } = req.body;
    const campagne = await Campagne.create({ ...campagneData, entrepriseId: entreprise.id });

    if (plateformes.length > 0) {
      await CampagnePlateforme.bulkCreate(
        plateformes.map((p) => ({ campagneId: campagne.id, plateforme: p }))
      );
    }

    await creerLog(req.user.id, 'CREATION_CAMPAGNE', 'Campagne', campagne.id, null, req.ip);
    const result = await Campagne.findByPk(campagne.id, withPlateformes);
    return ok(res, result, 201);
  } catch (e) { return err(res, e); }
};

export const getMesCampagnes = async (req, res) => {
  try {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });

    const where = { entrepriseId: entreprise.id };
    if (req.query.statut) where.statut = req.query.statut;

    const campagnes = await Campagne.findAll({
      where,
      ...withPlateformes,
      order: [['dateCreation', 'DESC']],
    });
    return ok(res, campagnes);
  } catch (e) { return err(res, e); }
};

// Masque le budget d'une campagne pour tout le monde sauf l'entreprise propriétaire,
// quand celle-ci a choisi de ne pas l'afficher publiquement.
async function masquerBudgetSiNecessaire(campagneJSON, req) {
  if (campagneJSON.budgetVisible) return campagneJSON;

  if (req.user && (req.user.role === 'ENTREPRISE' || req.user.role === 'PARTICULIER')) {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (entreprise && entreprise.id === campagneJSON.entrepriseId) return campagneJSON;
  }

  return { ...campagneJSON, budget: null, budgetDepense: null };
}

export const getCampagnesPubliques = async (req, res) => {
  try {
    const where = { statut: 'PUBLIEE' };
    const campagnes = await Campagne.findAll({
      where,
      include: [
        { model: CampagnePlateforme, as: 'plateformes' },
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'logoUrl', 'secteur', 'pays', 'description'] },
      ],
      order: [['dateCreation', 'DESC']],
    });
    const resultat = await Promise.all(campagnes.map((c) => masquerBudgetSiNecessaire(c.toJSON(), req)));
    return ok(res, resultat);
  } catch (e) { return err(res, e); }
};

export const getCampagne = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id, {
      ...withAll,
      include: [
        ...withAll.include,
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'logoUrl', 'secteur', 'pays'] },
      ],
    });
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    const resultat = await masquerBudgetSiNecessaire(campagne.toJSON(), req);
    return ok(res, resultat);
  } catch (e) { return err(res, e); }
};

export const updateCampagne = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    if (!['BROUILLON', 'PUBLIEE'].includes(campagne.statut))
      return res.status(400).json({ success: false, message: `Modification impossible : campagne ${campagne.statut}.` });

    const { plateformes, ...campagneData } = req.body;
    await campagne.update(campagneData);

    if (plateformes !== undefined) {
      await CampagnePlateforme.destroy({ where: { campagneId: campagne.id } });
      if (plateformes.length > 0) {
        await CampagnePlateforme.bulkCreate(
          plateformes.map((p) => ({ campagneId: campagne.id, plateforme: p }))
        );
      }
    }

    await creerLog(req.user.id, 'MODIFICATION_CAMPAGNE', 'Campagne', campagne.id, null, req.ip);
    const result = await Campagne.findByPk(campagne.id, withPlateformes);
    return ok(res, result);
  } catch (e) { return err(res, e); }
};

export const deleteCampagne = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    if (campagne.statut !== 'BROUILLON')
      return res.status(400).json({ success: false, message: 'Suppression impossible : seules les campagnes BROUILLON peuvent être supprimées.' });

    await campagne.destroy();
    await creerLog(req.user.id, 'SUPPRESSION_CAMPAGNE', 'Campagne', req.params.id, null, req.ip);
    return ok(res, { message: 'Campagne supprimée.' });
  } catch (e) { return err(res, e); }
};

export const publierCampagne = async (req, res) => {
  try {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });

    await sequelize.transaction(async (t) => {
      const campagne = await Campagne.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!campagne) throw { status: 404, message: 'Campagne non trouvée.' };
      if (campagne.entrepriseId !== entreprise.id) throw { status: 403, message: 'Accès refusé.' };
      if (campagne.statut !== 'BROUILLON')
        throw { status: 400, message: 'Seules les campagnes BROUILLON peuvent être publiées.' };

      await debiterSolde(
        entreprise.id,
        parseFloat(campagne.budget),
        campagne.id,
        `Publication de la campagne "${campagne.titre}"`,
        t
      );

      campagne.statut = 'PUBLIEE';
      await campagne.save({ transaction: t });
    });

    const result = await Campagne.findByPk(req.params.id, withPlateformes);
    await creerLog(req.user.id, 'PUBLICATION_CAMPAGNE', 'Campagne', req.params.id, null, req.ip);
    return ok(res, result);
  } catch (e) { return err(res, e); }
};

export const annulerCampagne = async (req, res) => {
  try {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });

    await sequelize.transaction(async (t) => {
      const campagne = await Campagne.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!campagne) throw { status: 404, message: 'Campagne non trouvée.' };
      if (campagne.entrepriseId !== entreprise.id) throw { status: 403, message: 'Accès refusé.' };
      if (['ANNULEE', 'TERMINEE'].includes(campagne.statut))
        throw { status: 400, message: `Cette campagne est déjà ${campagne.statut === 'ANNULEE' ? 'annulée' : 'terminée'}.` };

      const budgetReserve = ['PUBLIEE', 'EN_COURS'].includes(campagne.statut);

      if (budgetReserve) {
        const collabActive = await Collaboration.findOne({
          where: { campagneId: campagne.id, statut: STATUTS_COLLAB_ACTIFS },
          transaction: t,
        });
        if (collabActive)
          throw {
            status: 400,
            message: 'Impossible d\'annuler : des créateurs travaillent déjà sur cette campagne. Refusez d\'abord leurs collaborations individuellement.',
          };

        const montantARembourser = parseFloat(campagne.budget) - parseFloat(campagne.budgetDepense || 0);
        if (montantARembourser > 0) {
          await rembourserSolde(
            entreprise.id,
            montantARembourser,
            campagne.id,
            `Annulation de la campagne "${campagne.titre}"`,
            t
          );
        }
      }

      campagne.statut = 'ANNULEE';
      await campagne.save({ transaction: t });
    });

    const result = await Campagne.findByPk(req.params.id, withPlateformes);
    await creerLog(req.user.id, 'ANNULATION_CAMPAGNE', 'Campagne', req.params.id, null, req.ip);
    return ok(res, result);
  } catch (e) { return err(res, e); }
};

export const terminerCampagne = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    await campagne.terminer();
    await creerLog(req.user.id, 'CLOTURE_CAMPAGNE', 'Campagne', campagne.id, null, req.ip);
    return ok(res, campagne);
  } catch (e) { return err(res, e); }
};

export const addMedia = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni.' });

    const { mimetype } = req.file;
    let type = 'AUTRE';
    if (mimetype.startsWith('image/'))       type = 'IMAGE';
    else if (mimetype.startsWith('video/'))  type = 'VIDEO';
    else if (mimetype === 'application/pdf') type = 'PDF';

    const mediaUrl = `/uploads/medias/${req.file.filename}`;
    const media = await CampagneMedia.create({ campagneId: campagne.id, mediaUrl, type });
    return ok(res, media, 201);
  } catch (e) { return err(res, e); }
};

// GET /api/campagnes/:id/progression — vue agrégée : X posts livrés / Y prévus,
// détaillée par créateur. Ne compte que les lignes de contenu acceptées.
export const getProgressionCampagne = async (req, res) => {
  try {
    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });

    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (campagne.entrepriseId !== entreprise.id)
      return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const collaborations = await Collaboration.findAll({
      where: { campagneId: campagne.id },
      include: [
        { model: Createur, as: 'createur', attributes: ['id', 'nom', 'handle', 'photoProfilUrl'] },
        { model: CollaborationContenu, as: 'contenus', include: [{ model: Soumission, as: 'soumissions' }] },
      ],
    });

    const parCreateur = collaborations
      .map((c) => {
        const acceptees = c.contenus.filter((l) => l.statut === 'ACCEPTEE');
        // Livré = compté par soumission unitaire validée, pas par ligne entière —
        // une ligne de 3 posts dont 1 seul est validé compte pour 1, pas 0 ni 3.
        const quantiteLivree = acceptees.reduce(
          (s, l) => s + l.soumissions.filter((sub) => sub.dateValidation).length, 0
        );
        const montantValide = acceptees.reduce(
          (s, l) => s + l.soumissions.filter((sub) => sub.dateValidation).length * parseFloat(l.prixUnitaire), 0
        );
        return {
          collaborationId: c.id,
          statutCollaboration: c.statut,
          createur: c.createur,
          quantitePrevue: acceptees.reduce((s, l) => s + l.quantite, 0),
          quantiteLivree,
          montantEngage: acceptees.reduce((s, l) => s + parseFloat(l.sousTotal), 0),
          montantValide,
        };
      })
      .filter((x) => x.quantitePrevue > 0);

    const totalPrevu = parCreateur.reduce((s, x) => s + x.quantitePrevue, 0);
    const totalLivre = parCreateur.reduce((s, x) => s + x.quantiteLivree, 0);

    return ok(res, { totalPrevu, totalLivre, parCreateur });
  } catch (e) { return err(res, e); }
};
