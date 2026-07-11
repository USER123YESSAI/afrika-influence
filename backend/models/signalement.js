import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Signalement = sequelize.define('Signalement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    auteurId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'utilisateurs', key: 'id' },
    },
    cibleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    entiteCible: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // 'Utilisateur', 'Campagne', 'Collaboration', 'Message'
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    motif: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    decisionAdmin: {
      type: DataTypes.TEXT,
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: 'EN_ATTENTE',
    },
    dateCreation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateTraitement: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'signalements',
    timestamps: false,
  });

  Signalement.associate = (models) => {
    Signalement.belongsTo(models.Utilisateur, { foreignKey: 'auteurId', as: 'auteur' });
  };

  return Signalement;
};
