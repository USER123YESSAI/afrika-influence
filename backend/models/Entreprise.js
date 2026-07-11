import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Entreprise = sequelize.define('Entreprise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateurId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    secteur: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    secteurPersonnalise: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pays: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    siteWeb: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    dateInscription: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'entreprises',
    timestamps: false,
    hooks: {
      beforeSave(e) {
        if (e.secteur !== 'AUTRE') e.secteurPersonnalise = null;
      },
    },
  });

  Entreprise.associate = (models) => {
    Entreprise.belongsTo(models.Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });
    Entreprise.hasMany(models.Campagne, { foreignKey: 'entrepriseId', as: 'campagnes' });
  };

  return Entreprise;
};
