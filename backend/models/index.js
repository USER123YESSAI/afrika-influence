// backend/models/index.js
// Point d'entrée unique — UNE SEULE instance Sequelize pour tous les modèles.

import sequelize from '../config/database.js';
import TokenRevoqueModel from './tokenRevoque.js';


// ─── Imports (tous en factory functions maintenant) ───────────────────────────
import utilisateurModel        from './utilisateur.js';
import notificationModel       from './notification.js';
import logModel                from './log.js';
import signalementModel        from './signalement.js';

import entrepriseModel         from './Entreprise.js';
import campagneModel           from './Campagne.js';
import campagnePlateformeModel from './CampagnePlateforme.js';
import campagneMediaModel      from './CampagneMedia.js';
import recommandationModel     from './Recommandation.js';
import paiementModel           from './Paiement.js';
import avisModel               from './Avis.js';

import createurModel             from './Createur.js';
import createurNicheModel        from './CreateurNiche.js';
import offreModel                from './Offre.js';
import collaborationModel        from './Collaboration.js';
import collaborationContenuModel from './CollaborationContenu.js';
import messageModel              from './Message.js';

// ─── Initialisation sur la même instance ─────────────────────────────────────
const Utilisateur  = utilisateurModel(sequelize);
const Notification = notificationModel(sequelize);
const Log          = logModel(sequelize);
const Signalement  = signalementModel(sequelize);

const Entreprise         = entrepriseModel(sequelize);
const Campagne           = campagneModel(sequelize);
const CampagnePlateforme = campagnePlateformeModel(sequelize);
const CampagneMedia      = campagneMediaModel(sequelize);
const Recommandation     = recommandationModel(sequelize);
const Paiement           = paiementModel(sequelize);
const Avis               = avisModel(sequelize);

const Createur             = createurModel(sequelize);
const CreateurNiche        = createurNicheModel(sequelize);
const Offre                = offreModel(sequelize);
const Collaboration        = collaborationModel(sequelize);
const CollaborationContenu = collaborationContenuModel(sequelize);
const Message              = messageModel(sequelize);

const TokenRevoque = TokenRevoqueModel(sequelize);

// ─── Dictionnaire complet ─────────────────────────────────────────────────────
const allModels = {
  Utilisateur, Notification, Log, Signalement,
  Entreprise, Campagne, CampagnePlateforme, CampagneMedia, Recommandation, Paiement, Avis,
  Createur, CreateurNiche, Offre, Collaboration, CollaborationContenu, Message,
};

// ─── Associations (toutes en une seule passe) ─────────────────────────────────
Object.values(allModels).forEach((m) => {
  if (m && typeof m.associate === 'function') m.associate(allModels);
});

// ─── Exports nommés ───────────────────────────────────────────────────────────
export {
  sequelize,
  Utilisateur, Notification, Log, Signalement,
  Entreprise, Campagne, CampagnePlateforme, CampagneMedia, Recommandation, Paiement, Avis,
  Createur, CreateurNiche, Offre, Collaboration, CollaborationContenu, Message,
};
export default allModels;
