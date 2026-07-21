import { DataTypes } from 'sequelize';

export const TYPES_TRANSACTION = {
  RECHARGE: 'RECHARGE',
  DEBIT_CAMPAGNE: 'DEBIT_CAMPAGNE',
  REMBOURSEMENT: 'REMBOURSEMENT',
  PAIEMENT_CREATEUR: 'PAIEMENT_CREATEUR',
};

export default (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entrepriseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'entreprises', key: 'id' },
    },
    campagneId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'campagnes', key: 'id' },
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    soldeApres: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dateTransaction: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'transactions',
    timestamps: false,
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Entreprise, { foreignKey: 'entrepriseId', as: 'entreprise' });
    Transaction.belongsTo(models.Campagne, { foreignKey: 'campagneId', as: 'campagne' });
  };

  return Transaction;
};
