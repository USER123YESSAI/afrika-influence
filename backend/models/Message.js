import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'collaborations', key: 'id' },
    },
    expediteurId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'utilisateurs', key: 'id' },
    },
    contenu: {
      type: DataTypes.TEXT,
    },
    fichierUrl: {
      type: DataTypes.STRING(500),
    },
    lu: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dateEnvoi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'messages',
    timestamps: false,
    validate: {
      contenuOuFichier() {
        if (!this.contenu && !this.fichierUrl) {
          throw new Error('Un message doit avoir du contenu ou un fichier.');
        }
      },
    },
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Collaboration, { foreignKey: 'collaborationId' });
    Message.belongsTo(models.Utilisateur, { foreignKey: 'expediteurId', as: 'expediteur' });
  };

  return Message;
};
