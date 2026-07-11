import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CampagneMedia = sequelize.define('CampagneMedia', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campagneId: { type: DataTypes.UUID, allowNull: false },
    mediaUrl:   { type: DataTypes.STRING(500), allowNull: false },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  }, {
    tableName: 'campagne_medias',
    timestamps: false,
  });

  CampagneMedia.associate = (models) => {
    CampagneMedia.belongsTo(models.Campagne, { foreignKey: 'campagneId' });
  };

  return CampagneMedia;
};
