import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Recommandation = sequelize.define('Recommandation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campagneId:          { type: DataTypes.UUID, allowNull: false },
    createurId:          { type: DataTypes.UUID, allowNull: false },
    scoreCompatibilite:  { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    raisonnement:        { type: DataTypes.TEXT, allowNull: true },
    estConsultee:        { type: DataTypes.BOOLEAN, defaultValue: false },
    dateGeneree:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'recommandations',
    timestamps: false,
  });

  Recommandation.associate = (models) => {
    Recommandation.belongsTo(models.Campagne,  { foreignKey: 'campagneId' });
    Recommandation.belongsTo(models.Createur,  { foreignKey: 'createurId', as: 'createur' });
  };

  return Recommandation;
};
