// backend/middlewares/upload.js
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

export const logoUpload = multer({
  storage: storage('logos'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
export const uploadLogo = logoUpload.single('logo');

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

// ─── SECURITE : vérification de signature (magic bytes) ───────────────────
// Le Content-Type HTTP envoyé par le client est purement déclaratif : un
// attaquant peut nommer un webshell "photo.jpg" avec Content-Type: image/jpeg
// et passer le fileFilter Multer ci-dessus. On vérifie donc, APRÈS écriture
// sur disque, que les premiers octets du fichier correspondent réellement au
// format annoncé. En cas d'incohérence, le fichier est supprimé et la requête
// rejetée AVANT que son URL ne soit persistée en base (donc jamais servie).
const SIGNATURES = [
  { mimetype: 'image/jpeg',       bytes: [0xff, 0xd8, 0xff] },
  { mimetype: 'image/png',        bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimetype: 'image/gif',        bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimetype: 'application/pdf',  bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  // WEBP : "RIFF"...."WEBP" (4 premiers + 4 à l'offset 8)
  { mimetype: 'image/webp',       bytes: [0x52, 0x49, 0x46, 0x46], offsetCheck: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] } },
  // MP4 / MOV (ISO Base Media) : "ftyp" à l'offset 4
  { mimetype: 'video/mp4',        bytes: [], offsetCheck: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] } },
  { mimetype: 'video/quicktime',  bytes: [], offsetCheck: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] } },
  // WEBM (EBML header)
  { mimetype: 'video/webm',       bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

function signatureCorrespond(buffer, def) {
  const matchStart = def.bytes.length === 0 ||
    def.bytes.every((b, i) => buffer[i] === b);
  if (!matchStart) return false;
  if (def.offsetCheck) {
    const { offset, bytes } = def.offsetCheck;
    return bytes.every((b, i) => buffer[offset + i] === b);
  }
  return true;
}

export function verifierSignatureFichier(req, res, next) {
  if (!req.file) return next(); // rien à vérifier si aucun fichier (ex: PUT sans nouvelle photo)

  const cheminFichier = req.file.path;

  try {
    const fd = fs.openSync(cheminFichier, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const attendu = SIGNATURES.filter((s) => s.mimetype === req.file.mimetype);
    const valide = attendu.length > 0 && attendu.some((def) => signatureCorrespond(buffer, def));

    if (!valide) {
      fs.unlinkSync(cheminFichier); // on supprime immédiatement le fichier suspect
      console.warn('[SECURITE] Signature de fichier invalide (MIME usurpé)', {
        ip: req.ip,
        mimetypeDeclare: req.file.mimetype,
        nomOriginal: req.file.originalname,
      });
      return res.status(400).json({
        success: false,
        message: 'Le contenu du fichier ne correspond pas au format déclaré.',
      });
    }

    next();
  } catch (e) {
    // En cas d'erreur de lecture, on refuse par prudence (fail closed)
    try { fs.unlinkSync(cheminFichier); } catch {}
    return res.status(400).json({ success: false, message: 'Fichier invalide ou illisible.' });
  }
}