import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const storage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `uploads/${destination}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

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

// Utilisé pour l'upload du logo d'entreprise
export const logoUpload = multer({
  storage: storage('logos'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Middleware final pour POST /:id/logo
export const uploadLogo = logoUpload.single('logo');


// Upload photo profil (createur)
export const uploadPhoto = multer({
  storage: storage('profils'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('photo');


export const uploadFichier = multer({
  storage: storage('messages'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('fichier');

// ─── mediaUpload ─────────────────────────────────────────────────────────────
// Utilisé par POST /api/campagnes/:id/medias
// Accepte : images, vidéos, PDF — limite 20 Mo
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

export const mediaUpload = multer({
  storage: storage('medias'),
  fileFilter: mediaFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

