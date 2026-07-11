import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { Utilisateur, Entreprise, Createur } from '../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { creerLog } from './logService.js';

const SALT_ROUNDS = 12;

export async function inscrire({ nom, email, password, role }) {
  console.log('[authService.inscrire] START', { nom, email, role });

  const existant = await Utilisateur.findOne({ where: { email } });
  if (existant) throw { status: 409, message: 'Un compte existe déjà avec cet email.' };

  console.log('[authService.inscrire] Hashing password...');
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log('[authService.inscrire] Creating utilisateur...');
  const utilisateur = await Utilisateur.create({
    nom, email, motDePasse: hash, role, statut: 'validated',
  });
  console.log('[authService.inscrire] Utilisateur created:', utilisateur.id);

  if (role === 'ENTREPRISE' || role === 'PARTICULIER') {
    console.log('[authService.inscrire] Creating entreprise profile...');
    await Entreprise.create({ utilisateurId: utilisateur.id, nom });
    console.log('[authService.inscrire] Entreprise profile created.');
  } else if (role === 'CREATEUR') {
    console.log('[authService.inscrire] Generating handle...');

    const base = '@' + (nom || 'createur')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'createur';

    console.log('[authService.inscrire] Base handle:', base);
    console.log('[authService.inscrire] Counting existing handles with Op.like...');

    const count = await Createur.count({
      where: { handle: { [Op.like]: `${base}%` } },
    });

    console.log('[authService.inscrire] Handle count:', count);
    const handle = count > 0 ? `${base}${count + 1}` : base;
    console.log('[authService.inscrire] Final handle:', handle);

    console.log('[authService.inscrire] Creating createur profile...');
    await Createur.create({ utilisateurId: utilisateur.id, nom, handle });
    console.log('[authService.inscrire] Createur profile created.');
  }

  console.log('[authService.inscrire] Creating log...');
  await creerLog(utilisateur.id, 'INSCRIPTION', 'Utilisateur', utilisateur.id);

  console.log('[authService.inscrire] DONE.');
  const { motDePasse: _, ...data } = utilisateur.toJSON();
  return data;
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
  return { token, utilisateur: data };
}

export async function getProfil(utilisateurId) {
  const utilisateur = await Utilisateur.findByPk(utilisateurId, {
    attributes: { exclude: ['motDePasse'] },
  });
  if (!utilisateur) throw { status: 404, message: 'Utilisateur introuvable.' };
  return utilisateur;
}

export async function reinitialiserMotDePasse(email, nouveauMotDePasse) {
  const utilisateur = await Utilisateur.findOne({ where: { email } });
  if (!utilisateur)
    throw { status: 404, message: 'Aucun compte associé à cet email.' };

  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  await utilisateur.update({ motDePasse: hash });
  await creerLog(utilisateur.id, 'RESET_MDP', 'Utilisateur', utilisateur.id);
  return { message: 'Mot de passe réinitialisé avec succès.' };
}
