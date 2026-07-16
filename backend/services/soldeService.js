import { sequelize, Entreprise, Transaction } from '../models/index.js';
import { TYPES_TRANSACTION } from '../models/Transaction.js';

// ─── CRÉDITER (recharge simulée) ───────────────────────────────────────────────

export async function crediterSolde(entrepriseId, montant, description = 'Recharge de compte') {
  return sequelize.transaction(async (t) => {
    const entreprise = await Entreprise.findByPk(entrepriseId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!entreprise) throw { status: 404, message: 'Entreprise introuvable.' };

    const nouveauSolde = parseFloat((parseFloat(entreprise.solde) + montant).toFixed(2));
    await entreprise.update({ solde: nouveauSolde }, { transaction: t });

    await Transaction.create({
      entrepriseId,
      type: TYPES_TRANSACTION.RECHARGE,
      montant,
      soldeApres: nouveauSolde,
      description,
    }, { transaction: t });

    return { solde: nouveauSolde };
  });
}

// ─── DÉBITER (publication de campagne) ─────────────────────────────────────────
// Lève une erreur 400 si le solde est insuffisant — appelé depuis une transaction
// existante (celle de publierCampagne) pour que le débit et le changement de
// statut de la campagne soient atomiques ensemble.

export async function debiterSolde(entrepriseId, montant, campagneId, description, t) {
  const entreprise = await Entreprise.findByPk(entrepriseId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!entreprise) throw { status: 404, message: 'Entreprise introuvable.' };

  const soldeActuel = parseFloat(entreprise.solde);
  if (soldeActuel < montant) {
    throw {
      status: 400,
      message: `Solde insuffisant pour publier cette campagne. Disponible : ${soldeActuel.toLocaleString('fr-FR')} FCFA, requis : ${montant.toLocaleString('fr-FR')} FCFA.`,
    };
  }

  const nouveauSolde = parseFloat((soldeActuel - montant).toFixed(2));
  await entreprise.update({ solde: nouveauSolde }, { transaction: t });

  await Transaction.create({
    entrepriseId,
    campagneId,
    type: TYPES_TRANSACTION.DEBIT_CAMPAGNE,
    montant,
    soldeApres: nouveauSolde,
    description,
  }, { transaction: t });

  return { solde: nouveauSolde };
}

// ─── REMBOURSER (annulation de campagne) ───────────────────────────────────────

export async function rembourserSolde(entrepriseId, montant, campagneId, description, t) {
  const entreprise = await Entreprise.findByPk(entrepriseId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!entreprise) throw { status: 404, message: 'Entreprise introuvable.' };

  const nouveauSolde = parseFloat((parseFloat(entreprise.solde) + montant).toFixed(2));
  await entreprise.update({ solde: nouveauSolde }, { transaction: t });

  await Transaction.create({
    entrepriseId,
    campagneId,
    type: TYPES_TRANSACTION.REMBOURSEMENT,
    montant,
    soldeApres: nouveauSolde,
    description,
  }, { transaction: t });

  return { solde: nouveauSolde };
}

// ─── HISTORIQUE ────────────────────────────────────────────────────────────────

export async function getHistorique(entrepriseId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const { rows, count } = await Transaction.findAndCountAll({
    where: { entrepriseId },
    order: [['dateTransaction', 'DESC']],
    limit,
    offset,
  });
  return { transactions: rows, total: count, page, pages: Math.ceil(count / limit) };
}

// ─── TOUTES LES TRANSACTIONS (admin) ───────────────────────────────────────────

export async function getToutesLesTransactions({ type, entrepriseId, page = 1, limit = 50 } = {}) {
  const where = {};
  if (type) where.type = type;
  if (entrepriseId) where.entrepriseId = entrepriseId;

  const offset = (page - 1) * limit;
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [{ model: Entreprise, as: 'entreprise', attributes: ['id', 'nom'] }],
    order: [['dateTransaction', 'DESC']],
    limit,
    offset,
  });
  return { transactions: rows, total: count, page, pages: Math.ceil(count / limit) };
}
