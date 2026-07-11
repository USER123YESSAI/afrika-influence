import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Createur = sequelize.define('Createur', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateurId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'utilisateurs', key: 'id' },
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    handle: {
      type: DataTypes.STRING(60),
      unique: true,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    photoProfilUrl: {
      type: DataTypes.STRING(500),
    },
    portfolioUrl: {
      type: DataTypes.STRING(500),
    },
    tarifsDescription: {
      type: DataTypes.TEXT,
    },
    reseaux: {
      type: DataTypes.JSON,
      defaultValue: {},
    
    },
    audience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verifie: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pays: {
      type: DataTypes.STRING(50),
      defaultValue: 'SN',
    },
    numeroOrangeMoney: {
      type: DataTypes.STRING(20),
    },
    numeroFreeMoney: {
      type: DataTypes.STRING(20),
    },
    dateInscription: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'createurs',
    timestamps: true,
  });

  Createur.associate = (models) => {
    Createur.belongsTo(models.Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });
    Createur.hasMany(models.CreateurNiche, { foreignKey: 'createurId', as: 'niches', onDelete: 'CASCADE' });
    Createur.hasMany(models.Offre, { foreignKey: 'createurId', as: 'offres', onDelete: 'CASCADE' });
    Createur.hasMany(models.Collaboration, { foreignKey: 'createurId', as: 'collaborations' });
  };

  return Createur;
};
