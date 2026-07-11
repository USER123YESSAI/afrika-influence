// backend/controllers/entrepriseController.js
import Joi from 'joi';
import { Entreprise, Campagne } from '../models/index.js';
import { Op } from 'sequelize';
import { creerLog } from '../services/logService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

const updateSchema = Joi.object({
  nom:                 Joi.string().trim(),
  secteur:             Joi.string().valid('MODE', 'BEAUTE', 'TECH', 'AGROALIMENTAIRE', 'SANTE', 'FINANCE', 'EDUCATION', 'TOURISME', 'AUTRE'),
  secteurPersonnalise: Joi.string().allow('', null),
  description:         Joi.string().allow('', null),
  pays:                Joi.string().valid('SENEGAL', 'COTE_DIVOIRE', 'CAMEROUN', 'MALI', 'BURKINA_FASO', 'GUINEE', 'TOGO', 'BENIN', 'NIGER', 'RDC', 'AUTRE'),
  siteWeb:             Joi.string().uri().allow('', null),
  telephone:           Joi.string().allow('', null),
}).min(1);

// GET /api/entreprises — liste publique pour l'annuaire
export const getEntreprisesPubliques = async (req, res) => {
  try {
    const { secteur, pays, recherche } = req.query;
    const where = {};
    if (secteur) where.secteur = secteur;
    if (pays) where.pays = pays;
    if (recherche) where.nom = { [Op.iLike]: `%${recherche}%` };

    const entreprises = await Entreprise.findAll({
      where,
      attributes: ['id', 'nom', 'secteur', 'secteurPersonnalise', 'logoUrl', 'pays', 'description'],
      include: [
        { model: Campagne, as: 'campagnes', attributes: ['id', 'statut'] }
      ],
      order: [['nom', 'ASC']]
    });

    // Transformer pour renvoyer un nombre de campagnes plutôt que le détail
    const resultat = entreprises.map(e => {
      const data = e.toJSON();
      data.nombreCampagnes = data.campagnes ? data.campagnes.filter(c => c.statut === 'PUBLIEE' || c.statut === 'EN_COURS').length : 0;
      delete data.campagnes;
      return data;
    });

    return ok(res, resultat);
  } catch (e) { return err(res, e); }
};

// GET /api/entreprises/:id — cherche d'abord par PK, puis par utilisateurId
export const getEntreprise = async (req, res) => {
  try {
    let entreprise = await Entreprise.findByPk(req.params.id);
    if (!entreprise) {
      entreprise = await Entreprise.findOne({ where: { utilisateurId: req.params.id } });
    }
    if (!entreprise) return res.status(404).json({ success: false, message: 'Entreprise non trouvée.' });
    return ok(res, entreprise);
  } catch (e) { return err(res, e); }
};

// GET /api/entreprises/mon-profil — profil de l'entreprise connectée
export const getMonProfil = async (req, res) => {
  try {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });
    return ok(res, entreprise);
  } catch (e) { return err(res, e); }
};

export const updateEntreprise = async (req, res) => {
  try {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });
    if (req.params.id && entreprise.id !== req.params.id && entreprise.utilisateurId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Accès refusé.' });

    const { error, value } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(422).json({ success: false, message: error.details[0].message });

    await entreprise.update(value);
    await creerLog(req.user.id, 'MODIFICATION_ENTREPRISE', 'Entreprise', entreprise.id, null, req.ip);
    return ok(res, entreprise);
  } catch (e) { return err(res, e); }
};

export const uploadLogo = async (req, res) => {
  try {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: req.user.id } });
    if (!entreprise) return res.status(404).json({ success: false, message: 'Profil entreprise non trouvé.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni.' });

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    await entreprise.update({ logoUrl });
    await creerLog(req.user.id, 'UPLOAD_LOGO', 'Entreprise', entreprise.id, null, req.ip);
    return ok(res, { logoUrl });
  } catch (e) { return err(res, e); }
};
