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