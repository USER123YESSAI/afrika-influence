import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CreateurNiche = sequelize.define('CreateurNiche', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    createurId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'createurs', key: 'id' },
    },
    niche: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
  }, {
    tableName: 'createur_niches',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['createurId', 'niche'] }, // pas de doublons
    ],
  });

  CreateurNiche.associate = (models) => {
    CreateurNiche.belongsTo(models.Createur, { foreignKey: 'createurId' });
  };

  return CreateurNiche;
};
