import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Soumission = sequelize.define('Soumission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ligneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'collaboration_contenus', key: 'id' },
    },
    contenuUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    dateSoumission: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateValidation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      defaultValue: 'EN_ATTENTE', // EN_ATTENTE | VALIDEE | REFUSEE
    },
    raisonRefus: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    dateTraitement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'soumissions',
    timestamps: false,
  });

  Soumission.associate = (models) => {
    Soumission.belongsTo(models.CollaborationContenu, { foreignKey: 'ligneId', as: 'ligne' });
  };

  return Soumission;
};
