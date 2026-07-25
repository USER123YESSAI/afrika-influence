import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { Op } from 'sequelize';
import { Utilisateur, Entreprise, Createur, ResetToken, TokenRevoque } from '../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { creerLog } from './logService.js';
import { sendPasswordResetEmail } from './emailService.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_VALIDITE_MS = 30 * 60 * 1000; // 30 minutes

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
  const token = generateToken(utilisateur);
  return { token, utilisateur: data };
}

export async function connecter({ email, password }, ipAdresse) {
  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur)
    throw { status: 401, message: 'Email ou mot de passe incorrect.' };

  if (utilisateur.statut === 'rejected')
    throw { status: 403, message: 'Votre compte a été rejeté. Contactez l\'administration.' };
  if (utilisateur.statut === 'suspended')
    throw { status: 403, message: 'Votre compte a été suspendu. Contactez l\'administration.' };

  const valide = await bcrypt.compare(password, utilisateur.motDePasse);
  if (!valide)
    throw { status: 401, message: 'Email ou mot de passe incorrect.' };

  const token = generateToken(utilisateur);
  await creerLog(utilisateur.id, 'CONNEXION', 'Utilisateur', utilisateur.id, null, ipAdresse);

  const { motDePasse: _, ...data } = utilisateur.toJSON();

  if (data.role === 'CREATEUR') {
    const createur = await Createur.findOne({ where: { utilisateurId: data.id } });
    if (createur) {
      data.photoProfil = createur.photoProfilUrl;
      data.profilComplet = !!createur.nom && !!createur.pays;
    }
  } else if (data.role === 'ENTREPRISE' || data.role === 'PARTICULIER') {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId: data.id } });
    if (entreprise) {
      data.logo = entreprise.logoUrl;
      data.profilComplet = !!entreprise.nom && !!entreprise.secteur;
    }
  }

  return { token, utilisateur: data };
}

export async function getProfil(utilisateurId) {
  const utilisateur = await Utilisateur.findByPk(utilisateurId, {
    attributes: { exclude: ['motDePasse'] },
  });
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };

  const data = utilisateur.toJSON();

  if (data.role === 'CREATEUR') {
    const createur = await Createur.findOne({ where: { utilisateurId } });
    if (createur) {
      data.photoProfil = createur.photoProfilUrl;
      data.profilComplet = !!createur.nom && !!createur.pays;
    }
  } else if (data.role === 'ENTREPRISE' || data.role === 'PARTICULIER') {
    const entreprise = await Entreprise.findOne({ where: { utilisateurId } });
    if (entreprise) {
      data.logo = entreprise.logoUrl;
      data.profilComplet = !!entreprise.nom && !!entreprise.secteur;
    }
  }

  return data;
}

// ─── Déconnexion : révocation du JWT en cours ─────────────────────────────────
// CORRECTION SÉCURITÉ : jusqu'ici la déconnexion ne faisait rien côté serveur,
// le token restait valide jusqu'à son expiration naturelle (24h) même après
// "déconnexion". On enregistre désormais son jti dans la liste noire.
export async function deconnecter(jti, exp) {
  if (jti && exp) {
    await TokenRevoque.findOrCreate({
      where: { jti },
      defaults: { dateExpiration: new Date(exp * 1000) },
    });
  }
  return { message: 'Déconnexion réussie.' };
}

// ─── Réinitialisation de mot de passe — demande ───────────────────────────────
// CORRECTION SÉCURITÉ CRITIQUE : l'ancienne version changeait le mot de passe
// directement à partir de l'email fourni, sans aucune preuve que la personne
// qui fait la demande possède réellement cette boîte mail. N'importe qui
// connaissant l'email d'un utilisateur pouvait donc prendre le contrôle de
// son compte. Le flux correct est en deux temps :
//   1. demanderResetMotDePasse(email)          → génère un jeton à usage
//      unique, l'envoie par email (jamais dans la réponse HTTP), et répond
//      toujours le même message que le compte existe ou non (on ne révèle
//      jamais quels emails sont enregistrés — énumération de comptes).
//   2. confirmerResetMotDePasse(email, token, nouveauMotDePasse) → vérifie le
//      jeton (hashé en base, comparé au hash du jeton reçu) avant de changer
//      le mot de passe.
export async function demanderResetMotDePasse(email) {
  const utilisateur = await Utilisateur.findOne({ where: { email } });

  if (utilisateur) {
    const tokenBrut = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(tokenBrut).digest('hex');
    const dateExpiration = new Date(Date.now() + RESET_TOKEN_VALIDITE_MS);

    // Invalide les demandes précédentes non utilisées avant d'en créer une nouvelle
    await ResetToken.destroy({ where: { utilisateurId: utilisateur.id } });
    await ResetToken.create({ utilisateurId: utilisateur.id, tokenHash, dateExpiration });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const lien = `${frontendUrl}/reinitialiser-mdp/confirmer?token=${tokenBrut}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(email, lien);
    await creerLog(utilisateur.id, 'DEMANDE_RESET_MDP', 'Utilisateur', utilisateur.id);
  }

  // Réponse identique que le compte existe ou non, volontairement.
  return { message: 'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.' };
}

// ─── Réinitialisation de mot de passe — confirmation ──────────────────────────
export async function confirmerResetMotDePasse(email, tokenBrut, nouveauMotDePasse) {
  const generique = { status: 400, message: 'Lien invalide ou expiré. Merci de refaire une demande.' };

  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur) throw generique;

  const tokenHash = createHash('sha256').update(tokenBrut).digest('hex');
  const entree = await ResetToken.findOne({ where: { utilisateurId: utilisateur.id, tokenHash } });
  if (!entree) throw generique;
  if (entree.dateExpiration < new Date()) {
    await entree.destroy();
    throw generique;
  }

  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  await utilisateur.update({ motDePasse: hash });
  await entree.destroy(); // jeton à usage unique

  await creerLog(utilisateur.id, 'RESET_MDP', 'Utilisateur', utilisateur.id);
  return { message: 'Mot de passe réinitialisé avec succès.' };
}

export async function changerMotDePasse(utilisateurId, ancienMotDePasse, nouveauMotDePasse) {
  const utilisateur = await Utilisateur.findByPk(utilisateurId);
  if (!utilisateur)
    throw { status: 404, message: 'Utilisateur introuvable.' };

  const valide = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
  if (!valide)
    throw { status: 401, message: 'Ancien mot de passe incorrect.' };

  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  await utilisateur.update({ motDePasse: hash });
  await creerLog(utilisateur.id, 'CHANGE_MDP', 'Utilisateur', utilisateur.id);
  return { message: 'Mot de passe modifié avec succès.' };
}
