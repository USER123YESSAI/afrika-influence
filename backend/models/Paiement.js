import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Paiement = sequelize.define('Paiement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborationId: { type: DataTypes.UUID, allowNull: false },
    createurId:      { type: DataTypes.UUID, allowNull: false },
    entrepriseId:    { type: DataTypes.UUID, allowNull: false },
    montant:          { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    montantCommission:{ type: DataTypes.DECIMAL(15, 2), allowNull: true },
    montantCreateur:  { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    methode: {
      type: DataTypes.STRING(40),
      defaultValue: 'MANUEL',
    },
    statut: {
      type: DataTypes.STRING(40),
      defaultValue: 'EN_ATTENTE',
    },
    numeroFacture:       { type: DataTypes.STRING(100), allowNull: true },
    numeroRecuCreateur:  { type: DataTypes.STRING(100), allowNull: true },
    datePaiement:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dateConfirmation:    { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'paiements',
    timestamps: false,
  });

  Paiement.prototype.initier = async function () {
    const taux = parseFloat(process.env.TAUX_COMMISSION) || 10;
    this.montantCommission = parseFloat(this.montant) * taux / 100;
    this.montantCreateur   = parseFloat(this.montant) - this.montantCommission;
    this.statut = 'EN_ATTENTE';
    await this.save();
  };

  Paiement.prototype.confirmer = async function () {
    this.statut = 'CONFIRME';
    this.dateConfirmation = new Date();
    await this.save();
  };

  Paiement.associate = (models) => {
    Paiement.belongsTo(models.Collaboration, { foreignKey: 'collaborationId', as: 'collaboration' });
  };

  return Paiement;
};
