// backend/controllers/recommandationController.js
import { Campagne, Entreprise, Recommandation, Createur, CreateurNiche } from '../models/index.js';
import { genererRecommandations } from '../services/recommandationService.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, e, status = 500) =>
  res.status(e.status || status).json({ success: false, message: e.message || 'Erreur serveur.' });

const getEntrepriseByUser = (userId) => Entreprise.findOne({ where: { utilisateurId: userId } });

export const getRecommandations = async (req, res) => {
  try {
    const campagne = await Campagne.findByPk(req.params.id);
    if (!campagne) return res.status(404).json({ success: false, message: 'Campagne non trouvée.' });

    const entreprise = await getEntrepriseByUser(req.user.id);
    if (!entreprise || campagne.entrepriseId !== entreprise.id)
      return res.status(403).json({ success: false, message: 'Accès refusé.' });

    await genererRecommandations(req.params.id);
    await Recommandation.update(
      { estConsultee: true },
      { where: { campagneId: req.params.id } }
    );
    
    // Fetch newly generated recommendations with creator data
    const recommandationsWithCreator = await Recommandation.findAll({
      where: { campagneId: req.params.id },
      include: [
        { 
          model: Createur, 
          as: 'createur',
          include: [{ model: CreateurNiche, as: 'niches' }] 
        }
      ],
      order: [['scoreCompatibilite', 'DESC']]
    });

    return ok(res, recommandationsWithCreator);
  } catch (e) { return err(res, e); }
};
