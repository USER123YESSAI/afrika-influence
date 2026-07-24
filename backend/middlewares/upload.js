import multer from 'multer';
import { verifierSignature, ecrireFichierSurDisque } from './fileSignature.js';

// CORRECTION SÉCURITÉ : passage en memoryStorage. L'ancien code écrivait
// directement sur disque avec diskStorage, avant tout contrôle du contenu
// réel du fichier — impossible à ce stade de vérifier les magic bytes.
// Le buffer est maintenant inspecté par verifierSignature() puis écrit sur
// disque par ecrireFichierSurDisque() avec un nom et une extension décidés
// côté serveur (voir middlewares/fileSignature.js).
const memoire = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Format image non supporté. Utilisez JPEG, PNG ou WebP.'));
};

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf', 'video/mp4', 'video/quicktime',
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Format de fichier non supporté.'));
};

const mediaFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf',
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Format de fichier non supporté pour un média de campagne.'));
};

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Enrobe multerSingle pour transformer ses erreurs (fichier trop gros, type
// refusé au premier filtre déclaratif) en réponse JSON propre, puis enchaîne
// sur la vérification de signature + l'écriture sur disque. Chaque export
// est un tableau de middlewares Express, à répandre avec `...` dans les
// routes (ex : router.post('/x', ...uploadLogo, ctrl.uneFonction)).
function pipeline(multerSingle, mimetypesAutorises, destination) {
  return [
    (req, res, next) => multerSingle(req, res, (err) => (err ? handleUploadError(err, req, res, next) : next())),
    verifierSignature(mimetypesAutorises),
    ecrireFichierSurDisque(destination),
  ];
}

const IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const MEDIAS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf'];
const FICHIERS_MESSAGE = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'];

// Utilisé pour l'upload du logo d'entreprise
const logoMulter = multer({ storage: memoire, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });
export const uploadLogo = pipeline(logoMulter.single('logo'), IMAGES, 'logos');

// Upload photo profil (créateur)
const photoMulter = multer({ storage: memoire, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });
export const uploadPhoto = pipeline(photoMulter.single('photo'), IMAGES, 'profils');

// Fichier joint à un message
const fichierMulter = multer({ storage: memoire, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadFichier = pipeline(fichierMulter.single('fichier'), FICHIERS_MESSAGE, 'messages');

// ─── mediaUpload ─────────────────────────────────────────────────────────────
// Utilisé par POST /api/campagnes/:id/medias — images, vidéos, PDF, 20 Mo max
const mediaMulter = multer({ storage: memoire, fileFilter: mediaFilter, limits: { fileSize: 20 * 1024 * 1024 } });
export const mediaUpload = pipeline(mediaMulter.single('media'), MEDIAS, 'medias');

// ─── soumissionUpload ────────────────────────────────────────────────────────
// Utilisé par les soumissions de contenu (créateur) — alternative à un simple lien.
const soumissionMulter = multer({ storage: memoire, fileFilter: mediaFilter, limits: { fileSize: 20 * 1024 * 1024 } });
export const soumissionUpload = pipeline(soumissionMulter.single('fichier'), MEDIAS, 'soumissions');
