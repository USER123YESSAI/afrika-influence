import { DataTypes } from 'sequelize';

export const STATUTS_COLLABORATION = {
  INVITATION_ENVOYEE: 'INVITATION_ENVOYEE',
  CANDIDATURE_ENVOYEE: 'CANDIDATURE_ENVOYEE',
  INVITATION_ACCEPTEE: 'INVITATION_ACCEPTEE',
  TRAVAIL_EN_COURS: 'TRAVAIL_EN_COURS',
  CONTENU_SOUMIS: 'CONTENU_SOUMIS',
  CONTENU_VALIDE: 'CONTENU_VALIDE',
  PAIEMENT_EFFECTUE: 'PAIEMENT_EFFECTUE',
  TERMINEE: 'TERMINEE',
  REFUSEE: 'REFUSEE',
};

export default (sequelize) => {
  const Collaboration = sequelize.define('Collaboration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campagneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'campagnes', key: 'id' },
    },
    createurId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'createurs', key: 'id' },
    },
    directiveSpeciale: {
      type: DataTypes.TEXT,
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: STATUTS_COLLABORATION.INVITATION_ENVOYEE,
    },
    contenuUrl: {
      type: DataTypes.STRING(500),
    },
    dateInvitation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateAcceptation: {
      type: DataTypes.DATE,
    },
    dateSoumission: {
      type: DataTypes.DATE,
    },
    dateValidation: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'collaborations',
    timestamps: true,
  });

  Collaboration.associate = (models) => {
    // Dépend de Campagne (modèle P2) - optionnel si non présent
    if (models.Campagne) {
      Collaboration.belongsTo(models.Campagne, { foreignKey: 'campagneId', as: 'campagne' });
    }
    Collaboration.belongsTo(models.Createur, { foreignKey: 'createurId', as: 'createur' });
    Collaboration.hasMany(models.CollaborationContenu, {
      foreignKey: 'collaborationId', as: 'contenus', onDelete: 'CASCADE',
    });
    Collaboration.hasMany(models.Message, {
      foreignKey: 'collaborationId', as: 'messages', onDelete: 'CASCADE',
    });
  };

  return Collaboration;
};
