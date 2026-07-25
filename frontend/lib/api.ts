// frontend/lib/api.ts
// Client HTTP unifié — Afrika Influence Hub (P1 + P2 + P3)

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

// ─── Auth helpers ──────────────────────────────────────────────────────────────
export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') ?? '';
}

export function getUser(): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/connexion';
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── apiFetch interne ─────────────────────────────────────────────────────────
// Toutes les routes backend retournent { success, data } ou { success, message }.
// apiFetch lève une erreur si !success, et retourne data directement.
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    throw new Error(json.message || `Erreur ${res.status}`);
  }

  // Toutes les réponses ont la forme { success, data } ou { success, message }
  if (json && typeof json === 'object' && 'success' in json) {
    if (!json.success) throw new Error(json.message || 'Erreur serveur.');
    return json.data as T;
  }

  // Fallback pour réponses sans wrapper (webhook PayTech, etc.)
  return json as T;
}

// Alias court pour les chemins /api/xxx
function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetch<T>(`/api${path}`, options);
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutCampagne =
  | 'BROUILLON' | 'PUBLIEE' | 'EN_COURS'
  | 'EN_ATTENTE_VALIDATION' | 'TERMINEE' | 'ANNULEE';

export interface Entreprise {
  id: string;
  utilisateurId: string;
  nom: string;
  logoUrl?: string;
  secteur?: string;
  secteurPersonnalise?: string;
  description?: string;
  pays?: string;
  siteWeb?: string;
  telephone?: string;
  solde?: number;
}

export type TypeTransaction = 'RECHARGE' | 'DEBIT_CAMPAGNE' | 'REMBOURSEMENT' | 'PAIEMENT_CREATEUR';

export interface Transaction {
  id: string;
  entrepriseId: string;
  campagneId?: string;
  type: TypeTransaction;
  montant: number;
  soldeApres: number;
  description?: string;
  dateTransaction: string;
  entreprise?: { id: string; nom: string };
}

export interface Campagne {
  id: string;
  entrepriseId: string;
  titre: string;
  description?: string;
  budget: number | null;
  budgetDepense: number | null;
  budgetVisible?: boolean;
  objectifPrincipal?: string;
  consignesContenu?: string;
  contraintesContenu?: string;
  exempleContenu?: string;
  nombreCreateursVoulus?: number;
  statut: StatutCampagne;
  datePaiement: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  plateformes?: { id: string; plateforme: string }[];
  medias?: { id: string; mediaUrl: string; type: string }[];
  entreprise?: Partial<Entreprise>;
}

export interface Recommandation {
  id: string;
  createurId: string;
  scoreCompatibilite: number;
  raisonnement: string;
  estConsultee: boolean;
  createur?: {
    id: string;
    nom: string;
    handle?: string;
    photoProfilUrl?: string;
    niches?: { niche: string }[];
  };
}

export interface Paiement {
  id: string;
  collaborationId: string;
  montant: number;
  montantCommission?: number;
  montantCreateur?: number;
  methode: 'PAYTECH' | 'MANUEL';
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'REMBOURSE';
  numeroFacture?: string;
  datePaiement: string;
  dateConfirmation?: string;
}

// ─── AUTH (P1) ────────────────────────────────────────────────────────────────
export const authApi = {
  inscription: async (data: unknown) => {
    const responseData: any = await apiFetch('/api/auth/inscription', {
      method: 'POST', body: JSON.stringify(data),
    });
    const { token, utilisateur } = responseData;
    if (!token || !utilisateur) throw new Error('Réponse serveur invalide.');
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    return { token, utilisateur };
  },

  connexion: async (data: unknown) => {
    const responseData: any = await apiFetch('/api/auth/connexion', {
      method: 'POST', body: JSON.stringify(data),
    });
    const { token, utilisateur } = responseData;
    if (!token || !utilisateur) throw new Error('Réponse serveur invalide.');
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    return { token, utilisateur };
  },

  changerMdp: (data: any) =>
    apiFetch('/api/auth/changer-mdp', { method: 'POST', body: JSON.stringify(data) }),

  deconnexion: async () => {
    await apiFetch('/api/auth/deconnexion', { method: 'POST' }).catch(() => {});
    logout();
  },

  reinitialiserMdp: (data: unknown) =>
    apiFetch('/api/auth/reinitialiser-mdp', { method: 'POST', body: JSON.stringify(data) }),

  profil: () => request('/auth/profil'),
};

// ─── ADMIN (P1) ───────────────────────────────────────────────────────────────
export const adminApi = {
  getUtilisateurs: (params?: Record<string, string>) => {
    const q = params && Object.keys(params).filter(k => params[k]).length ? '?' + new URLSearchParams(params) : '';
    return request(`/admin/utilisateurs${q}`);
  },
  changerStatut: (id: string, statut: string) =>
    request(`/admin/utilisateurs/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
  getLogs: (params?: Record<string, string>) => {
    const q = params && Object.keys(params).filter(k => params[k]).length ? '?' + new URLSearchParams(params) : '';
    return request(`/admin/logs${q}`);
  },
  getSignalements: (params?: Record<string, string>) => {
    const q = params && Object.keys(params).filter(k => params[k]).length ? '?' + new URLSearchParams(params) : '';
    return request(`/admin/signalements${q}`);
  },
  traiterSignalement: (id: string, data: unknown) =>
    request(`/admin/signalements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTransactions: (params?: Record<string, string>) => {
    const q = params && Object.keys(params).filter(k => params[k]).length ? '?' + new URLSearchParams(params) : '';
    return request<{ transactions: Transaction[]; total: number; page: number; pages: number }>(`/admin/transactions${q}`);
  },
};

// ─── NOTIFICATIONS (P1) ───────────────────────────────────────────────────────
export const notifApi = {
  lister:     ()           => request('/notifications'),
  marquerLue: (id: string) => request(`/notifications/${id}/lue`, { method: 'PATCH' }),
};

// ─── ENTREPRISES (P2) ─────────────────────────────────────────────────────────
export const getEntreprisesPubliques = (filtres?: Record<string, string>) => {
  const q = filtres && Object.keys(filtres).length ? '?' + new URLSearchParams(filtres) : '';
  return request<Entreprise[]>(`/entreprises${q}`);
};
export const getEntreprise      = (id: string)                         => request<Entreprise>(`/entreprises/${id}`);
export const getMonProfilEntreprise = ()                               => request<Entreprise>('/entreprises/mon-profil');
export const updateEntreprise   = (id: string, data: Partial<Entreprise>) =>
  request<Entreprise>(`/entreprises/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ─── SOLDE (portefeuille entreprise) ──────────────────────────────────────────
export const soldeApi = {
  recharger: (montant: number) =>
    request<{ solde: number }>('/entreprises/solde/recharger', { method: 'POST', body: JSON.stringify({ montant }) }),
  historique: (page = 1, limit = 20) =>
    request<{ transactions: Transaction[]; total: number; page: number; pages: number }>(
      `/entreprises/solde/historique?page=${page}&limit=${limit}`
    ),
};

// ─── CAMPAGNES (P2) ───────────────────────────────────────────────────────────
export const getMesCampagnes = (statut?: string) =>
  request<Campagne[]>(`/campagnes${statut ? `?statut=${statut}` : ''}`);

export const getCampagne = (id: string) =>
  request<Campagne>(`/campagnes/${id}`);

export const getCampagnesPubliques = (filtres?: Record<string, string>) => {
  const q = filtres && Object.keys(filtres).length ? '?' + new URLSearchParams(filtres) : '';
  return request<Campagne[]>(`/campagnes/publiques${q}`);
};

export const createCampagne = (data: Partial<Campagne> & { plateformes?: string[] }) =>
  request<Campagne>('/campagnes', { method: 'POST', body: JSON.stringify(data) });

export const updateCampagne = (id: string, data: Partial<Campagne> & { plateformes?: string[] }) =>
  request<Campagne>(`/campagnes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCampagne  = (id: string) =>
  request<void>(`/campagnes/${id}`, { method: 'DELETE' });

export const publierCampagne = (id: string) =>
  request<Campagne>(`/campagnes/${id}/publier`, { method: 'PATCH' });

export const annulerCampagne = (id: string) =>
  request<Campagne>(`/campagnes/${id}/annuler`, { method: 'PATCH' });

export const terminerCampagne = (id: string) =>
  request<Campagne>(`/campagnes/${id}/terminer`, { method: 'PATCH' });

export const getRecommandations = (id: string) =>
  request<Recommandation[]>(`/campagnes/${id}/recommandations`);

export interface ProgressionCreateur {
  collaborationId: string;
  statutCollaboration: string;
  createur: { id: string; nom: string; handle?: string; photoProfilUrl?: string };
  quantitePrevue: number;
  quantiteLivree: number;
  montantEngage: number;
  montantValide: number;
}

export interface ProgressionCampagne {
  totalPrevu: number;
  totalLivre: number;
  parCreateur: ProgressionCreateur[];
}

export const getProgressionCampagne = (id: string) =>
  request<ProgressionCampagne>(`/campagnes/${id}/progression`);

export const addMedia = async (id: string, file: File): Promise<unknown> => {
  const form = new FormData();
  form.append('media', file);
  const res = await fetch(`${BASE_URL}/api/campagnes/${id}/medias`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: form,
  });

  const json = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
  if (!json?.success) throw new Error(json?.message || 'Erreur serveur.');
  return json.data;
};


// ─── PAIEMENTS (P2) ───────────────────────────────────────────────────────────
export const getPaiements    = ()         => request<Paiement[]>('/paiements/historique');
export const getFactureUrl   = (id: string) => `${BASE_URL}/api/paiements/${id}/facture`;
export const initierPaiement = (data: { collaborationId: string; methode?: string }) =>
  request('/paiements/initier', { method: 'POST', body: JSON.stringify(data) });

// ─── AVIS (P2) ────────────────────────────────────────────────────────────────
export const avisApi = {
  creer:    (data: { collaborationId: string; cibleId: string; note: number; commentaire?: string }) =>
    request('/avis', { method: 'POST', body: JSON.stringify(data) }),
  getRecus: (cibleId: string) => request(`/avis/${cibleId}`),
};

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────
export const MOTIFS_SIGNALEMENT: { value: string; label: string }[] = [
  { value: 'COMPORTEMENT_INAPPROPRIE', label: 'Comportement inapproprié' },
  { value: 'NON_RESPECT_ACCORD',       label: 'Non-respect de l\'accord' },
  { value: 'CONTENU_FRAUDULEUX',       label: 'Contenu frauduleux' },
  { value: 'PAIEMENT_NON_RECU',        label: 'Paiement non reçu' },
  { value: 'COMMUNICATION_ABUSIVE',    label: 'Communication abusive' },
  { value: 'AUTRE',                    label: 'Autre' },
];

export const signalementApi = {
  creer: (data: { cibleId: string; motif: string; description?: string }) =>
    request('/signalements', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── CRÉATEUR (P3) ────────────────────────────────────────────────────────────
export const createurApi = {
  getProfil:   (id: string) => request(`/createurs/${id}`),
  getMonProfil: () => request('/createurs/mon-profil'),
  lister:      (filtres?: Record<string, string>) => {
    const q = filtres && Object.keys(filtres).length ? '?' + new URLSearchParams(filtres) : '';
    return request(`/createurs${q}`);
  },
  getOffres:   (id: string) => request(`/createurs/${id}/offres`),
  updateProfil: (id: string, data: unknown) =>
    request(`/createurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadPhoto: async (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch(`${BASE_URL}/api/createurs/${id}/photo`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: form,
    });

    const json = await res.json().catch(() => ({ message: res.statusText }));
    if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
    if (!json?.success) throw new Error(json?.message || 'Erreur serveur.');
    return json.data;
  },

  ajouterNiche: (id: string, niche: string) =>
    request(`/createurs/${id}/niches`, { method: 'POST', body: JSON.stringify({ niche }) }),
  supprimerNiche: (id: string, niche: string) =>
    request(`/createurs/${id}/niches/${encodeURIComponent(niche)}`, { method: 'DELETE' }),
};

// ─── OFFRES (P3) ──────────────────────────────────────────────────────────────
export const offreApi = {
  lister:    ()                          => request('/offres'),
  creer:     (data: unknown)             => request('/offres', { method: 'POST', body: JSON.stringify(data) }),
  modifier:  (id: string, data: unknown) => request(`/offres/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimer: (id: string)                => request(`/offres/${id}`, { method: 'DELETE' }),
};

// ─── COLLABORATIONS (P3) ──────────────────────────────────────────────────────
export type StatutLigne = 'PROPOSEE' | 'ACCEPTEE' | 'REFUSEE';

export type StatutSoumission = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';

export interface Soumission {
  id: string;
  ligneId: string;
  contenuUrl: string;
  dateSoumission: string;
  dateValidation?: string;
  statut: StatutSoumission;
  raisonRefus?: string;
  dateTraitement?: string;
}

export interface LigneContenu {
  id: string;
  collaborationId: string;
  offreId: string;
  typeContenu: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  statut: StatutLigne;
  dateProposition: string;
  dateTraitement?: string;
  raisonRefus?: string;
  offre?: { id: string; reseau: string; typeContenu: string; prix: number; delaiLivraison: number };
  soumissions?: Soumission[];
}

export const collabApi = {
  lister:  (statut?: string) => request(`/collaborations${statut ? `?statut=${statut}` : ''}`),
  detail:  (id: string) => request(`/collaborations/${id}`),
  inviter: (data: unknown) =>
    request('/collaborations/inviter', { method: 'POST', body: JSON.stringify(data) }),
  postuler: (campagneId: string) =>
    request('/collaborations/postuler', { method: 'POST', body: JSON.stringify({ campagneId }) }),
  accepter: (id: string) =>
    request(`/collaborations/${id}/accepter`, { method: 'PATCH' }),
  refuser:  (id: string) =>
    request(`/collaborations/${id}/refuser`, { method: 'PATCH' }),

  // Négociation ligne par ligne
  proposerLigne: (id: string, data: { offreId: string; quantite: number; prixUnitaire: number }) =>
    request<LigneContenu>(`/collaborations/${id}/lignes`, { method: 'POST', body: JSON.stringify(data) }),
  listerLignes: (id: string) => request<LigneContenu[]>(`/collaborations/${id}/lignes`),
  modifierLigne: (ligneId: string, data: { quantite?: number; prixUnitaire?: number }) =>
    request<LigneContenu>(`/collaborations/lignes/${ligneId}`, { method: 'PUT', body: JSON.stringify(data) }),
  supprimerLigne: (ligneId: string) =>
    request<void>(`/collaborations/lignes/${ligneId}`, { method: 'DELETE' }),
  traiterLigne: (ligneId: string, action: 'ACCEPTER' | 'REFUSER', raison?: string) =>
    request<LigneContenu>(`/collaborations/lignes/${ligneId}/traiter`, { method: 'PATCH', body: JSON.stringify({ action, raison }) }),

  // Soumissions — une ligne acceptée de quantite N attend N soumissions distinctes.
  // Chaque soumission accepte soit un lien, soit un fichier — jamais les deux.
  soumettreLigne: async (ligneId: string, contenu: { contenuUrl?: string; fichier?: File }): Promise<Soumission> => {
    const form = new FormData();
    if (contenu.fichier) form.append('fichier', contenu.fichier);
    else if (contenu.contenuUrl) form.append('contenuUrl', contenu.contenuUrl);
    const res = await fetch(`${BASE_URL}/api/collaborations/lignes/${ligneId}/soumettre`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders() },
      body: form,
    });
    const json = await res.json().catch(() => ({ message: res.statusText }));
    if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
    if (!json?.success) throw new Error(json?.message || 'Erreur serveur.');
    return json.data;
  },
  modifierSoumission: async (soumissionId: string, contenu: { contenuUrl?: string; fichier?: File }): Promise<Soumission> => {
    const form = new FormData();
    if (contenu.fichier) form.append('fichier', contenu.fichier);
    else if (contenu.contenuUrl) form.append('contenuUrl', contenu.contenuUrl);
    const res = await fetch(`${BASE_URL}/api/collaborations/soumissions/${soumissionId}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
      body: form,
    });
    const json = await res.json().catch(() => ({ message: res.statusText }));
    if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
    if (!json?.success) throw new Error(json?.message || 'Erreur serveur.');
    return json.data;
  },
  supprimerSoumission: (soumissionId: string) =>
    request<void>(`/collaborations/soumissions/${soumissionId}`, { method: 'DELETE' }),
  validerSoumission: (soumissionId: string) =>
    request<Soumission>(`/collaborations/soumissions/${soumissionId}/valider`, { method: 'PATCH' }),
  refuserSoumission: (soumissionId: string, raison?: string) =>
    request<Soumission>(`/collaborations/soumissions/${soumissionId}/refuser`, { method: 'PATCH', body: JSON.stringify({ raison }) }),

  // Alias rétrocompatible (même route que listerLignes)
  listerContenus: (id: string) => request<LigneContenu[]>(`/collaborations/${id}/contenus`),
};

// ─── MESSAGES (P3) ────────────────────────────────────────────────────────────
export const messageApi = {
  historique: (collaborationId: string) => request(`/messages/${collaborationId}`),
  envoyer:    (collaborationId: string, contenu: string) =>
    request('/messages', { method: 'POST', body: JSON.stringify({ collaborationId, contenu }) }),
  envoyerFichier: async (collaborationId: string, file: File) => {
    const form = new FormData();
    form.append('fichier', file);
    form.append('collaborationId', collaborationId);
    const res = await fetch(`${BASE_URL}/api/messages/fichier`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: form,
    });

    const json = await res.json().catch(() => ({ message: res.statusText }));
    if (!res.ok) throw new Error(json?.message || `Erreur ${res.status}`);
    if (!json?.success) throw new Error(json?.message || 'Erreur serveur.');
    return json.data;
  },

  marquerLu: (id: string) => request(`/messages/${id}/lue`, { method: 'PATCH' }),
};


// ─── FAVORIS (créateur) ────────────────────────────────────────────────────────
export const favoriApi = {
  lister:  () => request<Campagne[]>('/favoris'),
  ajouter: (campagneId: string) => request('/favoris', { method: 'POST', body: JSON.stringify({ campagneId }) }),
  retirer: (campagneId: string) => request<void>(`/favoris/${campagneId}`, { method: 'DELETE' }),
};

// ─── MODÉRATEUR ───────────────────────────────────────────────────────────────
export const moderateurApi = {
  getDashboard:        ()                                    => request('/moderateur/dashboard'),
  // Campagnes
  getCampagnes:        (p?: Record<string,string>)          => request(`/moderateur/campagnes${p && Object.keys(p).length ? '?' + new URLSearchParams(p) : ''}`),
  modererCampagne:     (id: string, data: { action: string; raison?: string }) =>
    request(`/moderateur/campagnes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Signalements
  getSignalements:     (p?: Record<string,string>)          => request(`/moderateur/signalements${p && Object.keys(p).length ? '?' + new URLSearchParams(p) : ''}`),
  traiterSignalement:  (id: string, data: { statut: string; decisionAdmin?: string }) =>
    request(`/moderateur/signalements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Contenus — visibilité uniquement, pas d'action (voir moderateurService.getContenus)
  getContenus:         (p?: Record<string,string>)          => request(`/moderateur/contenus${p && Object.keys(p).length ? '?' + new URLSearchParams(p) : ''}`),
  // Sanctions
  appliquerSanction:   (id: string, data: { action: string; raison?: string }) =>
    request(`/moderateur/sanctions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Historique
  getHistorique:       (p?: Record<string,string>)          => request(`/moderateur/historique${p && Object.keys(p).length ? '?' + new URLSearchParams(p) : ''}`),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
  }).format(montant);
}

export const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  INVITATION_ENVOYEE: { label: 'Invitation envoyée', color: 'bg-amber-100 text-amber-800' },
  CANDIDATURE_ENVOYEE:{ label: 'Candidature envoyée', color: 'bg-amber-100 text-amber-800' },
  TRAVAIL_EN_COURS:   { label: 'En cours',           color: 'bg-blue-100 text-blue-800' },
  CONTENU_SOUMIS:     { label: 'Contenu soumis',     color: 'bg-purple-100 text-purple-800' },
  CONTENU_VALIDE:     { label: 'Validé ✓',           color: 'bg-brand-100 text-brand-800' },
  PAIEMENT_EFFECTUE:  { label: 'Payé',               color: 'bg-green-100 text-green-800' },
  TERMINEE:           { label: 'Terminée',           color: 'bg-gray-100 text-gray-700' },
  REFUSEE:            { label: 'Refusée',            color: 'bg-red-100 text-red-700' },
};

export const STATUT_USER_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'bg-amber-100 text-amber-800' },
  validated: { label: 'Validé',      color: 'bg-brand-100 text-brand-800' },
  rejected:  { label: 'Rejeté',      color: 'bg-red-100 text-red-700' },
  suspended: { label: 'Suspendu',    color: 'bg-gray-100 text-gray-700' },
  banned:    { label: 'Banni',       color: 'bg-red-900 text-white' },
};

export const ROLE_LABELS: Record<string, string> = {
  CREATEUR:       'Créateur',
  ENTREPRISE:     'Entreprise',
  PARTICULIER:    'Particulier',
  ADMINISTRATEUR: 'Administrateur',
  MODERATEUR:     'Modérateur',
};

export const RESEAUX          = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter', 'LinkedIn'];
export const TYPES_CONTENU    = ['Story', 'Post photo', 'Reel', 'Vidéo courte', 'Vidéo intégrée', 'Vlog intégré', 'Post vidéo', 'Live'];
export const NICHES_DISPONIBLES = ['Mode', 'Lifestyle', 'Beauté', 'Tech', 'Gaming', 'Sport', 'Food', 'Voyage', 'Finance', 'Éducation', 'Musique', 'Art'];
