// backend/controllers/favoriController.js
import { Favori, Createur, Campagne, Entreprise, CampagnePlateforme } from '../models/index.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

async function getCreateurByUser(utilisateurId) {
  const createur = await Createur.findOne({ where: { utilisateurId } });
  if (!createur) throw { status: 404, message: 'Profil créateur non trouvé.' };
  return createur;
}

// POST /api/favoris — { campagneId }
export const ajouterFavori = async (req, res) => {
  try {
    const createur = await getCreateurByUser(req.user.id);
    const { campagneId } = req.body;
    if (!campagneId) return res.status(400).json({ success: false, message: 'campagneId est requis.' });

    const campagne = await Campagne.findByPk(campagneId);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });

    const [favori, cree] = await Favori.findOrCreate({
      where: { createurId: createur.id, campagneId },
      defaults: { dateAjout: new Date() },
    });
    return ok(res, favori, cree ? 201 : 200);
  } catch (e) { return err(res, e); }
};

// DELETE /api/favoris/:campagneId
export const retirerFavori = async (req, res) => {
  try {
    const createur = await getCreateurByUser(req.user.id);
    await Favori.destroy({ where: { createurId: createur.id, campagneId: req.params.campagneId } });
    return ok(res, { message: 'Retiré des favoris.' });
  } catch (e) { return err(res, e); }
};

// GET /api/favoris
export const listerFavoris = async (req, res) => {
  try {
    const createur = await getCreateurByUser(req.user.id);
    const favoris = await Favori.findAll({
      where: { createurId: createur.id },
      include: [{
        model: Campagne, as: 'campagne',
        include: [
          { model: CampagnePlateforme, as: 'plateformes' },
          { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'logoUrl', 'secteur', 'pays'] },
        ],
      }],
      order: [['dateAjout', 'DESC']],
    });
    return ok(res, favoris.map((f) => f.campagne).filter(Boolean));
  } catch (e) { return err(res, e); }
};
