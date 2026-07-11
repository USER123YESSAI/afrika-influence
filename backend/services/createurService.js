import { Op } from 'sequelize';
import models from '../models/index.js';

const { Createur, CreateurNiche, Offre } = models;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function findCreateurOrFail(createurId) {
  const c = await Createur.findByPk(createurId);
  if (!c) throw { status: 404, message: 'Créateur introuvable.' };
  return c;
}
function checkOwner(createur, utilisateurId) {
  if (createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Ce profil ne vous appartient pas.' };
}

const INCLUDES_COMPLET = [
  { model: CreateurNiche, as: 'niches' },
  { model: Offre,         as: 'offres' },
];

// ─── PROFIL ───────────────────────────────────────────────────────────────────
export async function getProfilCreateur(createurId) {
  const c = await Createur.findByPk(createurId, { include: INCLUDES_COMPLET });
  if (!c) throw { status: 404, message: 'Créateur introuvable.' };
  return c;
}

export async function getProfilByUtilisateurId(utilisateurId) {
  const c = await Createur.findOne({ where: { utilisateurId }, include: INCLUDES_COMPLET });
  if (!c) throw { status: 404, message: 'Profil créateur introuvable.' };
  return c;
}

export async function mettreAJourProfil(createurId, utilisateurId, data) {
  const createur = await findCreateurOrFail(createurId);
  checkOwner(createur, utilisateurId);
  const allowed = ['nom','handle','bio','portfolioUrl','tarifsDescription',
                   'reseaux','audience','pays','numeroOrangeMoney','numeroFreeMoney'];
  const updates = {};
  allowed.forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
  await createur.update(updates);
  return createur.reload({ include: INCLUDES_COMPLET });
}

export async function mettreAJourPhoto(createurId, utilisateurId, photoProfilUrl) {
  const createur = await findCreateurOrFail(createurId);
  checkOwner(createur, utilisateurId);
  await createur.update({ photoProfilUrl });
  return createur;
}

// ─── NICHES ───────────────────────────────────────────────────────────────────
export async function ajouterNiche(createurId, utilisateurId, niche) {
  const createur = await findCreateurOrFail(createurId);
  checkOwner(createur, utilisateurId);
  const existante = await CreateurNiche.findOne({ where: { createurId, niche } });
  if (existante) throw { status: 409, message: 'Cette niche est déjà ajoutée.' };
  return CreateurNiche.create({ createurId, niche });
}

export async function supprimerNiche(createurId, utilisateurId, niche) {
  const createur = await findCreateurOrFail(createurId);
  checkOwner(createur, utilisateurId);
  const ligne = await CreateurNiche.findOne({ where: { createurId, niche } });
  if (!ligne) throw { status: 404, message: 'Niche introuvable.' };
  await ligne.destroy();
}

// ─── OFFRES ───────────────────────────────────────────────────────────────────
export async function creerOffre(utilisateurId, data) {
  const createur = await Createur.findOne({ where: { utilisateurId } });
  if (!createur) throw { status: 404, message: 'Profil créateur introuvable.' };
  return Offre.create({ ...data, createurId: createur.id });
}

export async function listerOffres(utilisateurId) {
  const createur = await Createur.findOne({ where: { utilisateurId } });
  if (!createur) throw { status: 404, message: 'Profil créateur introuvable.' };
  return Offre.findAll({ where: { createurId: createur.id }, order: [['createdAt', 'ASC']] });
}

export async function modifierOffre(offreId, utilisateurId, data) {
  const offre = await Offre.findByPk(offreId, {
    include: [{ model: Createur, as: 'createur' }],
  });
  if (!offre) throw { status: 404, message: 'Offre introuvable.' };
  if (offre.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  const allowed = ['reseau','typeContenu','prix','delaiLivraison','description'];
  const updates = {};
  allowed.forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
  await offre.update(updates);
  return offre;
}

export async function supprimerOffre(offreId, utilisateurId) {
  const offre = await Offre.findByPk(offreId, {
    include: [{ model: Createur, as: 'createur' }],
  });
  if (!offre) throw { status: 404, message: 'Offre introuvable.' };
  if (offre.createur.utilisateurId !== utilisateurId)
    throw { status: 403, message: 'Accès interdit.' };
  await offre.destroy();
}

// ─── LISTE PUBLIQUE ───────────────────────────────────────────────────────────
export async function listerCreateursPublic(filtres = {}) {
  const { pays, niche, reseau, audienceMin, audienceMax, recherche } = filtres;

  const where = {};

  if (pays) where.pays = pays;

  if (audienceMin !== undefined || audienceMax !== undefined) {
    where.audience = {};
    if (audienceMin !== undefined) where.audience[Op.gte] = Number(audienceMin);
    if (audienceMax !== undefined) where.audience[Op.lte] = Number(audienceMax);
  }

  if (recherche) {
    where[Op.or] = [
      { nom:    { [Op.like]: `%${recherche}%` } },
      { handle: { [Op.like]: `%${recherche}%` } },
    ];
  }

  let createurs = await Createur.findAll({
    where,
    include: [
      ...INCLUDES_COMPLET,
      {
        model: models.Collaboration,
        as: 'collaborations',
        required: true,
      }
    ],
    order: [['createdAt', 'DESC']],
  });

  if (niche)  createurs = createurs.filter(c => c.niches?.some(n => n.niche === niche));
  if (reseau) createurs = createurs.filter(c => c.reseaux?.[reseau]?.handle);

  return createurs;
}

export async function getOffresCreateur(createurId) {
  const createur = await Createur.findByPk(createurId);
  if (!createur) throw { status: 404, message: 'Créateur introuvable.' };
  return Offre.findAll({ where: { createurId }, order: [['createdAt', 'ASC']] });
}
