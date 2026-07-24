// backend/middlewares/fileSignature.js
//
// CORRECTION SÉCURITÉ : jusqu'ici, upload.js ne validait que le mimetype
// déclaré par le client (facilement falsifiable — n'importe quel fichier
// peut être envoyé avec un Content-Type "image/jpeg") et dérivait l'extension
// de stockage directement de req.file.originalname (contrôlé par
// l'utilisateur). Un fichier malveillant renommé et avec un mimetype usurpé
// passait donc les deux contrôles, puis était servi tel quel via /uploads.
//
// Ce module vérifie le contenu binaire réel du fichier (magic bytes) et
// c'est LUI, jamais le client, qui décide de l'extension de stockage.
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SIGNATURES = [
  { mimetype: 'image/jpeg', ext: '.jpg',
    test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mimetype: 'image/png', ext: '.png',
    test: (b) => b.length >= 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mimetype: 'image/gif', ext: '.gif',
    test: (b) => b.length >= 4 && b.slice(0, 4).toString('ascii') === 'GIF8' },
  { mimetype: 'image/webp', ext: '.webp',
    test: (b) => b.length >= 12 && b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' },
  { mimetype: 'application/pdf', ext: '.pdf',
    test: (b) => b.length >= 4 && b.slice(0, 4).toString('ascii') === '%PDF' },
  { mimetype: 'video/webm', ext: '.webm',
    test: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  // Conteneur ISO-BMFF (MP4 / QuickTime .mov partagent la même structure de
  // boîte "ftyp" à l'offset 4 — on ne peut pas les distinguer de façon fiable
  // par les seuls magic bytes sans parser tout l'arbre de boîtes).
  { mimetype: 'video/isobmff', ext: '.mp4',
    test: (b) => b.length >= 12 && b.slice(4, 8).toString('ascii') === 'ftyp' },
];

function detecterSignature(buffer) {
  return SIGNATURES.find((sig) => {
    try { return sig.test(buffer); } catch { return false; }
  }) || null;
}

// Vérifie que le contenu réel du fichier correspond à un type autorisé pour
// ce champ, et normalise req.file.mimetype sur le type RÉELLEMENT détecté
// (jamais le déclaré) pour que le reste du code (catégorisation média, etc.)
// travaille sur une donnée vérifiée.
export function verifierSignature(mimetypesAutorises) {
  return (req, res, next) => {
    if (!req.file) return next();

    const detection = detecterSignature(req.file.buffer);
    if (!detection) {
      return res.status(400).json({ success: false, message: 'Fichier non reconnu, corrompu, ou d\'un format non supporté.' });
    }

    let mimetypeReel = detection.mimetype;
    let extensionReelle = detection.ext;

    if (mimetypeReel === 'video/isobmff') {
      // On ne fait confiance au mimetype déclaré par le client QUE pour
      // choisir entre mp4 et mov, et seulement après avoir confirmé qu'il
      // s'agit bien d'un conteneur ISO-BMFF valide (donc pas un exécutable
      // ou un script renommé en .mp4).
      if (req.file.mimetype === 'video/quicktime') {
        mimetypeReel = 'video/quicktime'; extensionReelle = '.mov';
      } else {
        mimetypeReel = 'video/mp4'; extensionReelle = '.mp4';
      }
    }

    if (!mimetypesAutorises.includes(mimetypeReel)) {
      return res.status(400).json({ success: false, message: 'Le contenu réel du fichier ne correspond à aucun format autorisé pour cet usage.' });
    }

    req.file.mimetype = mimetypeReel;
    req.file.extensionVerifiee = extensionReelle;
    next();
  };
}

// Écrit sur disque le buffer déjà validé, avec un nom de fichier généré côté
// serveur (UUID + extension déterminée par la signature binaire — jamais par
// le nom de fichier fourni par l'utilisateur). Reproduit req.file.filename
// pour rester compatible avec le code existant des contrôleurs.
export function ecrireFichierSurDisque(destination) {
  return (req, res, next) => {
    if (!req.file) return next();
    try {
      const dir = `uploads/${destination}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const nomFichier = `${uuidv4()}${req.file.extensionVerifiee}`;
      fs.writeFileSync(path.join(dir, nomFichier), req.file.buffer);

      req.file.filename = nomFichier;
      req.file.path = path.join(dir, nomFichier);
      delete req.file.buffer; // libère la mémoire, plus besoin après écriture
      next();
    } catch (e) { next(e); }
  };
}
