import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Avis = sequelize.define('Avis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborationId: { type: DataTypes.UUID, allowNull: false },
    auteurId:        { type: DataTypes.UUID, allowNull: false },
    cibleId:         { type: DataTypes.UUID, allowNull: false },
    auteurRole: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    note: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    commentaire:  { type: DataTypes.TEXT, allowNull: true },
    dateAvis:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'avis',
    timestamps: false,
  });

  Avis.associate = (models) => {
    Avis.belongsTo(models.Collaboration, { foreignKey: 'collaborationId', as: 'collaboration' });
  };

  return Avis;
};
