// backend/models/TokenRevoque.js
//
// Liste noire des JWT invalidés avant leur expiration naturelle (déconnexion
// explicite, changement de mot de passe, suspension de compte...).
// On stocke uniquement le "jti" (identifiant unique du jeton, ajouté dans
// generateToken) et sa date d'expiration d'origine — ça permet à un job
// périodique de purger les lignes devenues inutiles sans jamais supprimer
// une révocation encore valide.
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TokenRevoque = sequelize.define('TokenRevoque', {
    jti: {
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    dateExpiration: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'tokens_revoques',
    timestamps: false,
  });

  return TokenRevoque;
};
