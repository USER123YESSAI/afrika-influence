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
import transactionModel        from './Transaction.js';

import createurModel             from './Createur.js';
import createurNicheModel        from './CreateurNiche.js';
import offreModel                from './Offre.js';
import collaborationModel        from './Collaboration.js';
import collaborationContenuModel from './CollaborationContenu.js';
import soumissionModel           from './Soumission.js';
import favoriModel               from './Favori.js';
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
const Transaction        = transactionModel(sequelize);

const Createur             = createurModel(sequelize);
const CreateurNiche        = createurNicheModel(sequelize);
const Offre                = offreModel(sequelize);
const Collaboration        = collaborationModel(sequelize);
const CollaborationContenu = collaborationContenuModel(sequelize);
const Soumission            = soumissionModel(sequelize);
const Favori                = favoriModel(sequelize);
const Message              = messageModel(sequelize);

// SECURITE : table de révocation des JWT (utilisée par verifyToken/revokeToken
// dans middlewares/auth.js). Sans son ajout à allModels ET à l'export nommé
// ci-dessous, l'import `{ TokenRevoque }` dans auth.js résout `undefined` et
// fait planter en 500 la moindre requête authentifiée (findByPk sur undefined).
const TokenRevoque = TokenRevoqueModel(sequelize);

// ─── Dictionnaire complet ─────────────────────────────────────────────────────
const allModels = {
  Utilisateur, Notification, Log, Signalement,
  Entreprise, Campagne, CampagnePlateforme, CampagneMedia, Recommandation, Paiement, Avis, Transaction,
  Createur, CreateurNiche, Offre, Collaboration, CollaborationContenu, Soumission, Favori, Message,
  TokenRevoque,
};

// ─── Associations (toutes en une seule passe) ─────────────────────────────────
Object.values(allModels).forEach((m) => {
  if (m && typeof m.associate === 'function') m.associate(allModels);
});

// ─── Exports nommés ───────────────────────────────────────────────────────────
export {
  sequelize,
  Utilisateur, Notification, Log, Signalement,
  Entreprise, Campagne, CampagnePlateforme, CampagneMedia, Recommandation, Paiement, Avis, Transaction,
  Createur, CreateurNiche, Offre, Collaboration, CollaborationContenu, Soumission, Favori, Message,
  TokenRevoque,
};
export default allModels;