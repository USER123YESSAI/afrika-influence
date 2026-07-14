import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    motDePasse: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      // ADMINISTRATEUR | MODERATEUR | CREATEUR | ENTREPRISE | PARTICULIER
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: 'validated',
    },
    resetPasswordTokenHash: {
      // On ne stocke JAMAIS le token brut, seulement son hash SHA-256.
      // Si la base fuite, un attaquant ne peut pas reconstituer le lien de reset.
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    resetPasswordExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'utilisateurs',
    timestamps: true,
  });

Utilisateur.associate = (models) => {
    // Ne créer les associations que si les modèles existent réellement.
    // (évite crash si un modèle est undefined/mal initialisé)
    if (models.Notification) {
      Utilisateur.hasMany(models.Notification, { foreignKey: 'destinataireId', as: 'notifications' });
    }
    if (models.Log) {
      Utilisateur.hasMany(models.Log, { foreignKey: 'acteurId', as: 'logs' });
    }
    if (models.Signalement) {
      Utilisateur.hasMany(models.Signalement, { foreignKey: 'auteurId', as: 'signalements' });
    }
  };

  return Utilisateur;
};