import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    acteurId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    typeAction: {
      type: DataTypes.STRING(60),   // STRING au lieu de ENUM — plus souple, pas de migration cassée
      allowNull: false,
    },
    entiteCible: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    idEntiteCible: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAdresse: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    dateAction: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'logs',
    timestamps: false,
  });

  Log.associate = (models) => {
    Log.belongsTo(models.Utilisateur, { foreignKey: 'acteurId', as: 'acteur' });
  };

  return Log;
};
