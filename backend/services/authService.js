import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { Utilisateur, Entreprise, Createur } from '../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { creerLog } from './logService.js';
import { sendPasswordResetEmail } from './emailService.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// ─── SECURITE : verrouillage de compte anti brute-force ───────────────────
// Seuil aligné sur le rate-limit de connexion (middlewares/antiBot.js) pour
// une cohérence de message côté utilisateur, mais ce verrou est indépendant
// de l'IP (persisté en base) donc résiste à un attaquant qui change d'IP.
const MAX_TENTATIVES_CONNEXION = 5;
const DUREE_VERROUILLAGE_MS = 15 * 60 * 1000; // 15 minutes

export async function inscrire({ nom, email, password, role }) {
  const existant = await Utilisateur.findOne({ where: { email } });
  if (existant) throw { status: 409, message: 'Un compte existe déjà avec cet email.' };

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const utilisateur = await Utilisateur.create({
    nom, email, motDePasse: hash, role, statut: 'validated',
  });

  if (role === 'ENTREPRISE' || role === 'PARTICULIER') {
    await Entreprise.create({ utilisateurId: utilisateur.id, nom });
  } else if (role === 'CREATEUR') {
    const base = '@' + (nom || 'createur')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'createur';

    const count = await Createur.count({
      where: { handle: { [Op.like]: `${base}%` } },
    });

    const handle = count > 0 ? `${base}${count + 1}` : base;

    await Createur.create({ utilisateurId: utilisateur.id, nom, handle });
  }

  await creerLog(utilisateur.id, 'INSCRIPTION', 'Utilisateur', utilisateur.id);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return data;
}

export async function connecter({ email, password }, ipAdresse) {
  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur)
    throw { status: 401, message: 'Email ou mot de passe incorrect.' };

  // ─── Verrou actif ? ──────────────────────────────────────────────────────
  if (utilisateur.verrouilleJusqua && new Date(utilisateur.verrouilleJusqua) > new Date()) {
    const minutesRestantes = Math.ceil((new Date(utilisateur.verrouilleJusqua) - new Date()) / 60000);
    throw {
      status: 423,
      message: `Compte temporairement verrouillé suite à trop de tentatives échouées. Réessayez dans ${minutesRestantes} minute(s).`,
    };
  }

  if (utilisateur.statut === 'rejected')
    throw { status: 403, message: 'Votre compte a été rejeté. Contactez l\'administration.' };
  if (utilisateur.statut === 'suspended')
    throw { status: 403, message: 'Votre compte a été suspendu. Contactez l\'administration.' };
  // SECURITE : 'banned' n'était pas vérifié auparavant — un compte banni
  // pouvait donc toujours se connecter normalement.
  if (utilisateur.statut === 'banned')
    throw { status: 403, message: 'Votre compte a été banni. Contactez l\'administration.' };

  const valide = await bcrypt.compare(password, utilisateur.motDePasse);

  if (!valide) {
    const tentatives = (utilisateur.tentativesEchouees || 0) + 1;
    const misAJour = { tentativesEchouees: tentatives };

    if (tentatives >= MAX_TENTATIVES_CONNEXION) {
      misAJour.verrouilleJusqua = new Date(Date.now() + DUREE_VERROUILLAGE_MS);
      console.warn(`[SECURITE] Compte verrouillé après ${tentatives} échecs : ${email} (IP: ${ipAdresse})`);
      await creerLog(utilisateur.id, 'COMPTE_VERROUILLE', 'Utilisateur', utilisateur.id, { tentatives }, ipAdresse);
    }

    await utilisateur.update(misAJour);
    await creerLog(utilisateur.id, 'CONNEXION_ECHOUEE', 'Utilisateur', utilisateur.id, { tentatives }, ipAdresse);

    throw { status: 401, message: 'Email ou mot de passe incorrect.' };
  }

  // ─── Connexion réussie : réinitialiser le compteur d'échecs ─────────────
  if (utilisateur.tentativesEchouees > 0 || utilisateur.verrouilleJusqua) {
    await utilisateur.update({ tentativesEchouees: 0, verrouilleJusqua: null });
  }

  const token = generateToken(utilisateur);
  await creerLog(utilisateur.id, 'CONNEXION', 'Utilisateur', utilisateur.id, null, ipAdresse);

  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return { token, utilisateur: data };
}

export async function getProfil(utilisateurId) {
  const utilisateur = await Utilisateur.findByPk(utilisateurId, {
    attributes: { exclude: ['motDePasse'] },
  });
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };
  return utilisateur;
}

// ─── ÉTAPE 1 : demande de réinitialisation ─────────────────────────────────
// Génère un token à usage unique, le stocke haché en base, envoie le lien par email.
// Réponse volontairement générique dans tous les cas pour ne pas révéler
// si un email existe en base (protection contre l'énumération de comptes).
export async function demanderReinitialisation(email) {
  const reponseGenerique = {
    message: 'Si un compte existe avec cet email, un lien de réinitialisation vient d\'être envoyé.',
  };

  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur) return reponseGenerique;

  const rawToken = crypto.randomBytes(32).toString('hex');
  await utilisateur.update({
    resetPasswordTokenHash: hashToken(rawToken),
    resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reinitialiser-mdp/confirmer?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendPasswordResetEmail(email, resetLink);

  await creerLog(utilisateur.id, 'DEMANDE_RESET_MDP', 'Utilisateur', utilisateur.id);
  return reponseGenerique;
}

// ─── ÉTAPE 2 : confirmation avec le token reçu par email ───────────────────
export async function confirmerReinitialisation(email, token, nouveauMotDePasse) {
  const utilisateur = await Utilisateur.findOne({ where: { email } });

  if (
    !utilisateur ||
    !utilisateur.resetPasswordTokenHash ||
    !utilisateur.resetPasswordExpiresAt ||
    utilisateur.resetPasswordExpiresAt < new Date() ||
    utilisateur.resetPasswordTokenHash !== hashToken(token)
  ) {
    throw { status: 400, message: 'Lien de réinitialisation invalide ou expiré. Merci de refaire une demande.' };
  }

  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  // On réinitialise aussi le verrou : un reset de mot de passe légitime
  // (preuve de possession de l'email) doit débloquer le compte.
  await utilisateur.update({
    motDePasse: hash,
    resetPasswordTokenHash: null,
    resetPasswordExpiresAt: null,
    tentativesEchouees: 0,
    verrouilleJusqua: null,
  });

  await creerLog(utilisateur.id, 'RESET_MDP', 'Utilisateur', utilisateur.id);
  return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' };
}