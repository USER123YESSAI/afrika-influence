import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Favori = sequelize.define('Favori', {
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
    campagneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'campagnes', key: 'id' },
    },
    dateAjout: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'favoris',
    timestamps: false,
    indexes: [{ unique: true, fields: ['createurId', 'campagneId'] }],
  });

  Favori.associate = (models) => {
    Favori.belongsTo(models.Createur, { foreignKey: 'createurId' });
    Favori.belongsTo(models.Campagne, { foreignKey: 'campagneId', as: 'campagne' });
  };

  return Favori;
};
