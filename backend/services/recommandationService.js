import { Op } from 'sequelize';
import { sequelize, Recommandation, Campagne, CampagnePlateforme, Entreprise } from '../models/index.js';

// Niches associées à chaque secteur (scoring critère 1)
const SECTEUR_NICHES = {
  MODE: ['mode', 'fashion', 'lifestyle', 'vestimentaire'],
  BEAUTE: ['beaute', 'skincare', 'maquillage', 'cosmétique', 'lifestyle'],
  TECH: ['tech', 'informatique', 'gaming', 'high-tech', 'innovation'],
  AGROALIMENTAIRE: ['cuisine', 'food', 'nutrition', 'recette', 'alimentation'],
  SANTE: ['sante', 'fitness', 'wellness', 'sport', 'bien-être'],
  FINANCE: ['finance', 'business', 'entrepreneuriat', 'investissement'],
  EDUCATION: ['education', 'formation', 'developpement personnel', 'apprentissage'],
  TOURISME: ['voyage', 'tourisme', 'decouverte', 'lifestyle'],
  AUTRE: [],
};

const parseJson = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : Object.keys(p); } catch { return []; }
};

const scoreNiches = (nichesCreateur, secteur) => {
  if (!nichesCreateur || !secteur) return 10;
  const ref = SECTEUR_NICHES[secteur] || [];
  const niches = parseJson(nichesCreateur).map((n) => String(n.niche || n).trim().toLowerCase());
  const matches = niches.filter((n) => ref.some((r) => n.includes(r) || r.includes(n))).length;
  if (matches === 0) return 5;
  if (matches >= 2) return 40;
  return 25;
};

const scoreBudget = (budget, nombreCreateurs, prixMin) => {
  if (!prixMin || !budget) return 15;
  const budgetParCreateur = parseFloat(budget) / Math.max(parseInt(nombreCreateurs) || 1, 1);
  const ratio = parseFloat(prixMin) / budgetParCreateur;
  if (ratio <= 0.8) return 30;
  if (ratio <= 1.0) return 25;
  if (ratio <= 1.2) return 15;
  return 5;
};

const scorePlateformes = (reseauxCreateur, plateformesCampagne) => {
  if (!reseauxCreateur || !plateformesCampagne?.length) return 10;
  let reseaux = [];
  try {
    const parsed = typeof reseauxCreateur === 'string' ? JSON.parse(reseauxCreateur) : reseauxCreateur;
    reseaux = Object.keys(parsed || {}).map(k => k.toUpperCase());
  } catch { reseaux = []; }
  const matches = reseaux.filter((r) => plateformesCampagne.includes(r)).length;
  return Math.round((matches / plateformesCampagne.length) * 30);
};

export const genererRecommandations = async (campagneId) => {
  const campagne = await Campagne.findByPk(campagneId, {
    include: [
      { model: CampagnePlateforme, as: 'plateformes' },
      { model: Entreprise, as: 'entreprise' },
    ],
  });
  if (!campagne) throw new Error('Campagne non trouvée');

  const plateformes = campagne.plateformes.map((p) => p.plateforme);
  const secteur = campagne.entreprise?.secteur;

  // Supprimer les anciennes recommandations
  await Recommandation.destroy({ where: { campagneId } });

  // Requête sur la table Createurs de P3 via SQL brut
  let createurs = [];
  try {
    [createurs] = await sequelize.query(`
      SELECT c.id, c.reseaux, c.pays,
             MIN(CAST(o.prix AS DECIMAL(15,2))) AS prixMin,
             GROUP_CONCAT(cn.niche) AS niches
      FROM createurs c
      LEFT JOIN offres o ON o.createurId = c.id
      LEFT JOIN createur_niches cn ON cn.createurId = c.id
      GROUP BY c.id
      LIMIT 50
    `);
  } catch {
    // Table Createurs pas encore disponible (P3 n'a pas encore livré)
    return [];
  }

  const scores = createurs.map((c) => {
    const s1 = scoreNiches(c.niches, secteur);
    const s2 = scoreBudget(campagne.budget, campagne.nombreCreateursVoulus, c.prixMin);
    const s3 = scorePlateformes(c.reseaux, plateformes);
    return {
      createurId: c.id,
      scoreCompatibilite: Math.min(100, s1 + s2 + s3),
      raisonnement: `Niches : ${s1}/40 | Budget : ${s2}/30 | Plateformes : ${s3}/30`,
    };
  });

  scores.sort((a, b) => b.scoreCompatibilite - a.scoreCompatibilite);
  const top5 = scores.slice(0, 5);

  if (top5.length === 0) return [];

  const recommandations = await Recommandation.bulkCreate(
    top5.map((s) => ({ ...s, campagneId }))
  );
  return recommandations;
};
