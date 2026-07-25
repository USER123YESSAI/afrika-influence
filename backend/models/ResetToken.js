// backend/models/ResetToken.js
//
// Jetons de réinitialisation de mot de passe à usage unique.
// On ne stocke jamais le jeton en clair : seul son hash SHA-256 est
// conservé, exactement comme on ne stocke jamais un mot de passe en clair.
// Un jeton expiré ou déjà consommé (ligne supprimée) est refusé.
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ResetToken = sequelize.define('ResetToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateurId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(64), // sha256 hex = 64 caractères
      allowNull: false,
    },
    dateExpiration: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'reset_tokens',
    timestamps: true,
  });

  ResetToken.associate = (models) => {
    ResetToken.belongsTo(models.Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });
  };

  return ResetToken;
};
