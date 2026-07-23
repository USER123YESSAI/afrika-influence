import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    destinataireId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'utilisateurs', key: 'id' },
    },
    entiteCibleId: {
      type: DataTypes.UUID,
    },
    entiteCible: {
      type: DataTypes.STRING(50),
      // ex: 'Collaboration', 'Campagne', 'Message'
    },
    type: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: true,
      // Texte optionnel affiché à la place du libellé générique associé à `type`
      // (ex: contenu réel d'un avertissement de modération).
    },
    lue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dateCreation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: false,
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.Utilisateur, {
      foreignKey: 'destinataireId',
      as: 'destinataire',
    });
  };

  return Notification;
};
