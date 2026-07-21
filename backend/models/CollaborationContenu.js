import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CollaborationContenu = sequelize.define('CollaborationContenu', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'collaborations', key: 'id' },
    },
    offreId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'offres', key: 'id' },
    },
    typeContenu: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    prixUnitaire: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    sousTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      // Calculé automatiquement : quantite × prixUnitaire
    },
    statut: {
      type: DataTypes.STRING(20),
      defaultValue: 'PROPOSEE', // PROPOSEE | ACCEPTEE | REFUSEE
    },
    dateProposition: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateTraitement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'collaboration_contenus',
    timestamps: false,
  });

  CollaborationContenu.associate = (models) => {
    CollaborationContenu.belongsTo(models.Collaboration, { foreignKey: 'collaborationId' });
    CollaborationContenu.belongsTo(models.Offre, { foreignKey: 'offreId', as: 'offre' });
    CollaborationContenu.hasMany(models.Soumission, { foreignKey: 'ligneId', as: 'soumissions', onDelete: 'CASCADE' });
  };

  return CollaborationContenu;
};
