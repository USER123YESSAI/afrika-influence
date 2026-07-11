// backend/controllers/campagneController.js
import { Campagne, Entreprise, CampagnePlateforme, CampagneMedia } from '../models/index.js';
import { creerLog } from '../services/logService.js';

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
    return ok(res, campagnes);
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
    return ok(res, campagne);
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
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    if (campagne.statut !== 'BROUILLON')
      return res.status(400).json({ success: false, message: 'Seules les campagnes BROUILLON peuvent être publiées.' });
    await campagne.publier();
    await creerLog(req.user.id, 'PUBLICATION_CAMPAGNE', 'Campagne', campagne.id, null, req.ip);
    return ok(res, campagne);
  } catch (e) { return err(res, e); }
};

export const annulerCampagne = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
    if (!(await checkOwnership(campagne, req.user.id)))
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    await campagne.annuler();
    await creerLog(req.user.id, 'ANNULATION_CAMPAGNE', 'Campagne', campagne.id, null, req.ip);
    return ok(res, campagne);
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
