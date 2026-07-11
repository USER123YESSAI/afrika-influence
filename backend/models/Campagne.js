import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Campagne = sequelize.define('Campagne', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entrepriseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    budgetDepense: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    objectifPrincipal:    { type: DataTypes.TEXT, allowNull: true },
    consignesContenu:     { type: DataTypes.TEXT, allowNull: true },
    contraintesContenu:   { type: DataTypes.TEXT, allowNull: true },
    exempleContenu:       { type: DataTypes.TEXT, allowNull: true },
    nombreCreateursVoulus:  { type: DataTypes.INTEGER, allowNull: true },
    nombrePostsParCreateur: { type: DataTypes.INTEGER, allowNull: true },
    statut: {
      type: DataTypes.STRING(30),
      defaultValue: 'BROUILLON',
    },
    dateCreation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dateDebut:    { type: DataTypes.DATE, allowNull: true },
    dateFin:      { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'campagnes',
    timestamps: false,
  });

  // Instance methods
  Campagne.prototype.publier = async function () {
    if (this.statut !== 'BROUILLON')
      throw { status: 400, message: 'Seules les campagnes BROUILLON peuvent être publiées.' };
    this.statut = 'PUBLIEE';
    await this.save();
  };
  Campagne.prototype.annuler = async function () { this.statut = 'ANNULEE'; await this.save(); };
  Campagne.prototype.terminer = async function () { this.statut = 'TERMINEE'; await this.save(); };

  Campagne.associate = (models) => {
    Campagne.belongsTo(models.Entreprise, { foreignKey: 'entrepriseId', as: 'entreprise' });
    Campagne.hasMany(models.CampagnePlateforme, { foreignKey: 'campagneId', as: 'plateformes', onDelete: 'CASCADE' });
    Campagne.hasMany(models.CampagneMedia,      { foreignKey: 'campagneId', as: 'medias',      onDelete: 'CASCADE' });
    Campagne.hasMany(models.Recommandation,     { foreignKey: 'campagneId', as: 'recommandations', onDelete: 'CASCADE' });
    if (models.Collaboration) {
      Campagne.hasMany(models.Collaboration, { foreignKey: 'campagneId', as: 'collaborations' });
    }
  };

  return Campagne;
};
