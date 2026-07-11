import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CampagnePlateforme = sequelize.define('CampagnePlateforme', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campagneId: { type: DataTypes.UUID, allowNull: false },
    plateforme: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  }, {
    tableName: 'campagne_plateformes',
    timestamps: false,
  });

  CampagnePlateforme.associate = (models) => {
    CampagnePlateforme.belongsTo(models.Campagne, { foreignKey: 'campagneId' });
  };

  return CampagnePlateforme;
};
