import Joi from 'joi';

// ─── CONSTANTES PARTAGÉES ──────────────────────────────────────────────────────

const PAYS = ['SN', 'CI', 'CM', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'CD'];

const RESEAUX = [
  'Instagram', 'TikTok', 'YouTube',
  'Facebook', 'Twitter', 'LinkedIn', 'Snapchat', 'Pinterest',
];

const TYPES_CONTENU = [
  'Story', 'Post photo', 'Reel', 'Vidéo courte',
  'Vidéo intégrée', 'Vlog intégré', 'Post vidéo', 'Live',
];

const MOTIFS_SIGNALEMENT = [
  'COMPORTEMENT_INAPPROPRIE', 'NON_RESPECT_ACCORD', 'CONTENU_FRAUDULEUX',
  'PAIEMENT_NON_RECU', 'COMMUNICATION_ABUSIVE', 'AUTRE',
];

// N'échoue que si les deux dates sont réellement fournies — une mise à jour
// partielle (ex: PATCH ne touchant que dateFin) n'est jamais bloquée à tort.
const dateOrdreValide = (value, helpers) => {
  if (value.dateDebut && value.dateFin && new Date(value.dateFin) <= new Date(value.dateDebut)) {
    return helpers.error('dates.ordre');
  }
  return value;
};

// ─── CRÉATEUR ──────────────────────────────────────────────────────────────────

export const schemas = {

  // ─── AUTH ────────────────────────────────────────────────────────────────

  inscription: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    nom: Joi.string().min(2).max(100).trim().allow('', null),
    role: Joi.string().valid('CREATEUR', 'ENTREPRISE', 'PARTICULIER').required(),
  }),

  connexion: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  resetMdp: Joi.object({
    email: Joi.string().email().required(),
    nouveauMotDePasse: Joi.string().min(6).required(),
  }),

  changerMdp: Joi.object({
    ancienMotDePasse: Joi.string().required(),
    nouveauMotDePasse: Joi.string().min(6).required()
      .messages({
        'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      }),
  }),

  changerMdp: Joi.object({
    ancienMotDePasse: Joi.string().required(),
    nouveauMotDePasse: Joi.string().min(6).required()
      .messages({
        'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      }),
  }),

  // ─── CRÉATEUR ─────────────────────────────────────────────────────────────

  // PUT /api/createurs/:id
  updateProfil: Joi.object({
    nom: Joi.string().min(2).max(100).trim().allow('', null)
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères.',
        'string.max': 'Le nom ne peut pas dépasser 100 caractères.',
      }),
    handle: Joi.string().min(2).max(60).trim().allow('', null)
      .pattern(/^@?[\w.]+$/)
      .messages({
        'string.pattern.base': 'Le handle ne peut contenir que des lettres, chiffres, points et underscores.',
        'string.max': 'Le handle ne peut pas dépasser 60 caractères.',
      }),
    bio: Joi.string().max(500).allow('', null).trim()
      .messages({ 'string.max': 'La bio ne peut pas dépasser 500 caractères.' }),
    portfolioUrl: Joi.string().uri().allow('', null)
      .messages({ 'string.uri': 'L\'URL du portfolio est invalide.' }),
    tarifsDescription: Joi.string().max(1000).allow('', null),
    reseaux: Joi.object().pattern(
      Joi.string().valid(...RESEAUX),
      Joi.object({
        handle: Joi.string().max(80).allow('', null),
        audience: Joi.number().integer().min(0).allow(null),
      })
    ).messages({ 'object.unknown': 'Réseau social non reconnu.' }),
    audience: Joi.number().integer().min(0),
    pays: Joi.string().valid(...PAYS).allow('', null)
      .messages({ 'any.only': `Le pays doit être l'un des suivants : ${PAYS.join(', ')}.` }),
    numeroOrangeMoney: Joi.string()
      .pattern(/^\+?[\d\s]{8,15}$/).allow('', null)
      .messages({ 'string.pattern.base': 'Le numéro Orange Money est invalide.' }),
    numeroFreeMoney: Joi.string()
      .pattern(/^\+?[\d\s]{8,15}$/).allow('', null)
      .messages({ 'string.pattern.base': 'Le numéro Free Money est invalide.' }),
  }).min(1).messages({ 'object.min': 'Au moins un champ est requis.' }),

  // POST /api/createurs/:id/niches
  ajouterNiche: Joi.object({
    niche: Joi.string().min(2).max(80).trim().required()
      .messages({
        'string.min': 'La niche doit contenir au moins 2 caractères.',
        'string.max': 'La niche ne peut pas dépasser 80 caractères.',
        'any.required': 'Le champ "niche" est obligatoire.',
      }),
  }),

  // ─── OFFRES ─────────────────────────────────────────────────────────────────

  // POST /api/offres
  creerOffre: Joi.object({
    reseau: Joi.string().valid(...RESEAUX).required()
      .messages({
        'any.only': `Le réseau doit être l'un des suivants : ${RESEAUX.join(', ')}.`,
        'any.required': 'Le champ "reseau" est obligatoire.',
      }),
    typeContenu: Joi.string().valid(...TYPES_CONTENU).required()
      .messages({
        'any.only': `Le type de contenu doit être l'un des suivants : ${TYPES_CONTENU.join(', ')}.`,
        'any.required': 'Le champ "typeContenu" est obligatoire.',
      }),
    prix: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'Le prix doit être supérieur à 0.',
        'any.required': 'Le champ "prix" est obligatoire.',
      }),
    delaiLivraison: Joi.number().integer().min(1).max(365).required()
      .messages({
        'number.min': 'Le délai de livraison doit être d\'au moins 1 jour.',
        'number.max': 'Le délai de livraison ne peut pas dépasser 365 jours.',
        'any.required': 'Le champ "delaiLivraison" est obligatoire.',
      }),
    description: Joi.string().max(500).allow('', null).trim()
      .messages({ 'string.max': 'La description ne peut pas dépasser 500 caractères.' }),
  }),

  // PUT /api/offres/:id
  modifierOffre: Joi.object({
    reseau: Joi.string().valid(...RESEAUX),
    typeContenu: Joi.string().valid(...TYPES_CONTENU),
    prix: Joi.number().positive().precision(2)
      .messages({ 'number.positive': 'Le prix doit être supérieur à 0.' }),
    delaiLivraison: Joi.number().integer().min(1).max(365),
    description: Joi.string().max(500).allow('', null).trim(),
  }).min(1).messages({ 'object.min': 'Au moins un champ est requis pour la modification.' }),

  // ─── SOLDE ────────────────────────────────────────────────────────────────────

  rechargerSolde: Joi.object({
    montant: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'Le montant doit être supérieur à 0.',
        'any.required': 'Le champ "montant" est obligatoire.',
      }),
  }),

  // ─── CAMPAGNES ────────────────────────────────────────────────────────────────

  creerCampagne: Joi.object({
    titre: Joi.string().min(3).max(200).required()
      .messages({
        'string.min': 'Le titre doit contenir au moins 3 caractères.',
        'string.max': 'Le titre ne peut pas dépasser 200 caractères.',
        'any.required': 'Le champ "titre" est obligatoire.',
      }),
    description: Joi.string().allow('', null),
    budget: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'Le budget doit être supérieur à 0.',
        'any.required': 'Le champ "budget" est obligatoire.',
      }),
    budgetVisible: Joi.boolean(),
    objectifPrincipal: Joi.string().allow('', null),
    consignesContenu: Joi.string().allow('', null),
    contraintesContenu: Joi.string().allow('', null),
    exempleContenu: Joi.string().allow('', null),
    nombreCreateursVoulus: Joi.number().integer().min(1),
    dateDebut: Joi.date().allow(null),
    dateFin: Joi.date().allow(null),
  }).custom(dateOrdreValide).messages({ 'dates.ordre': 'La date de fin doit être postérieure à la date de début.' }),

  modifierCampagne: Joi.object({
    titre: Joi.string().min(3).max(200),
    description: Joi.string().allow('', null),
    budget: Joi.number().positive().precision(2),
    budgetVisible: Joi.boolean(),
    objectifPrincipal: Joi.string().allow('', null),
    consignesContenu: Joi.string().allow('', null),
    contraintesContenu: Joi.string().allow('', null),
    exempleContenu: Joi.string().allow('', null),
    nombreCreateursVoulus: Joi.number().integer().min(1),
    dateDebut: Joi.date().allow(null),
    dateFin: Joi.date().allow(null),
  }).min(1).custom(dateOrdreValide)
    .messages({
      'object.min': 'Au moins un champ est requis pour la modification.',
      'dates.ordre': 'La date de fin doit être postérieure à la date de début.',
    }),

  // ─── COLLABORATIONS ──────────────────────────────────────────────────────────

  // POST /api/collaborations/inviter
  inviter: Joi.object({
    campagneId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la campagne doit être un UUID valide.',
        'any.required': 'Le champ "campagneId" est obligatoire.',
      }),
    createurId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant du créateur doit être un UUID valide.',
        'any.required': 'Le champ "createurId" est obligatoire.',
      }),
    directiveSpeciale: Joi.string().max(1000).allow('', null).trim()
      .messages({ 'string.max': 'La directive spéciale ne peut pas dépasser 1000 caractères.' }),
  }),

  // POST /api/collaborations/postuler
  postuler: Joi.object({
    campagneId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la campagne doit être un UUID valide.',
        'any.required': 'Le champ "campagneId" est obligatoire.',
      }),
  }),

  // PATCH /api/collaborations/lignes/:ligneId/soumettre
  // contenuUrl n'est requis que si aucun fichier n'est joint (vérifié dans le contrôleur,
  // qui a accès à req.file — Joi ne valide que req.body).
  soumettreLigne: Joi.object({
    contenuUrl: Joi.string().uri().allow('', null)
      .messages({ 'string.uri': 'L\'URL du contenu soumis est invalide.' }),
  }),

  // PUT /api/collaborations/soumissions/:soumissionId
  modifierSoumission: Joi.object({
    contenuUrl: Joi.string().uri().allow('', null)
      .messages({ 'string.uri': 'L\'URL du contenu soumis est invalide.' }),
  }),

  // PATCH /api/collaborations/soumissions/:soumissionId/refuser
  refuserSoumission: Joi.object({
    raison: Joi.string().max(500).allow('', null).trim()
      .messages({ 'string.max': 'Le motif ne peut pas dépasser 500 caractères.' }),
  }),

  // POST /api/collaborations/:id/lignes
  proposerLigne: Joi.object({
    offreId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de l\'offre doit être un UUID valide.',
        'any.required': 'Le champ "offreId" est obligatoire.',
      }),
    quantite: Joi.number().integer().min(1).max(100).required()
      .messages({
        'number.min': 'La quantité doit être d\'au moins 1.',
        'number.max': 'La quantité ne peut pas dépasser 100.',
        'any.required': 'Le champ "quantite" est obligatoire.',
      }),
    prixUnitaire: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'Le prix proposé doit être supérieur à 0.',
        'any.required': 'Le champ "prixUnitaire" est obligatoire.',
      }),
  }),

  // PUT /api/collaborations/lignes/:ligneId
  modifierLigne: Joi.object({
    quantite: Joi.number().integer().min(1).max(100),
    prixUnitaire: Joi.number().positive().precision(2),
  }).min(1).messages({ 'object.min': 'Au moins un champ est requis pour la modification.' }),

  // PATCH /api/collaborations/lignes/:ligneId/traiter
  traiterLigne: Joi.object({
    action: Joi.string().valid('ACCEPTER', 'REFUSER').required()
      .messages({
        'any.only': 'action doit être ACCEPTER ou REFUSER.',
        'any.required': 'Le champ "action" est obligatoire.',
      }),
    raison: Joi.string().max(500).allow('', null).trim()
      .messages({ 'string.max': 'Le motif ne peut pas dépasser 500 caractères.' }),
  }),

  // ─── MESSAGES ────────────────────────────────────────────────────────────────

  // POST /api/messages
  envoyerMessage: Joi.object({
    collaborationId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la collaboration doit être un UUID valide.',
        'any.required': 'Le champ "collaborationId" est obligatoire.',
      }),
    contenu: Joi.string().min(1).max(2000).trim().required()
      .messages({
        'string.min': 'Le message ne peut pas être vide.',
        'string.max': 'Le message ne peut pas dépasser 2000 caractères.',
        'any.required': 'Le contenu du message est obligatoire.',
      }),
  }),

  // ─── AVIS ───────────────────────────────────────────────────────────────────────

  creerAvis: Joi.object({
    collaborationId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la collaboration doit être un UUID valide.',
        'any.required': 'Le champ "collaborationId" est obligatoire.',
      }),
    cibleId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la cible doit être un UUID valide.',
        'any.required': 'Le champ "cibleId" est obligatoire.',
      }),
    note: Joi.number().integer().min(1).max(5).required()
      .messages({
        'number.min': 'La note doit être au moins 1.',
        'number.max': 'La note ne peut pas dépasser 5.',
        'any.required': 'Le champ "note" est obligatoire.',
      }),
    commentaire: Joi.string().max(1000).allow('', null).trim()
      .messages({ 'string.max': 'Le commentaire ne peut pas dépasser 1000 caractères.' }),
  }),

  // ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────

  // POST /api/signalements
  creerSignalement: Joi.object({
    cibleId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la personne signalée doit être un UUID valide.',
        'any.required': 'Le champ "cibleId" est obligatoire.',
      }),
    motif: Joi.string().valid(...MOTIFS_SIGNALEMENT).required()
      .messages({
        'any.only': `Le motif doit être l'un des suivants : ${MOTIFS_SIGNALEMENT.join(', ')}.`,
        'any.required': 'Le champ "motif" est obligatoire.',
      }),
    description: Joi.string().max(1000).allow('', null).trim()
      .messages({ 'string.max': 'La description ne peut pas dépasser 1000 caractères.' }),
  }),

  // ─── PAIEMENTS ───────────────────────────────────────────────────────────────────

  initierPaiement: Joi.object({
    collaborationId: Joi.string().uuid().required()
      .messages({
        'string.uuid': 'L\'identifiant de la collaboration doit être un UUID valide.',
        'any.required': 'Le champ "collaborationId" est obligatoire.',
      }),
    methode: Joi.string().valid('PAYTECH', 'MANUEL').default('PAYTECH')
      .messages({
        'any.only': 'La méthode doit être PAYTECH ou MANUEL.',
      }),
  }),
};
