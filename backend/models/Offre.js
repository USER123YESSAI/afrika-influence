import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Offre = sequelize.define('Offre', {
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
    reseau: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    typeContenu: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    prix: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    delaiLivraison: {
      type: DataTypes.INTEGER, // en jours
      allowNull: false,
      validate: { min: 1 },
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'offres',
    timestamps: true,
  });

  Offre.associate = (models) => {
    Offre.belongsTo(models.Createur, { foreignKey: 'createurId', as: 'createur' });
    Offre.hasMany(models.CollaborationContenu, { foreignKey: 'offreId', as: 'lignesContenu' });
  };

  return Offre;
};
