# Documentation API - Module P3

Ce fichier centralise la documentation technique des endpoints développés dans le cadre du module P3 (Espace Créateur, Collaborations, Messagerie, Paiements). Conformément aux conventions de l'équipe, chaque route est détaillée avec sa méthode, ses paramètres et sa description.

---

## 1. Collaborations (`/api/collaborations`)

### `POST /api/collaborations/inviter`
- **Rôle** : Permet à une entreprise d'inviter un créateur à rejoindre une campagne.
- **Authentification** : Requise (`ENTREPRISE`).
- **Body** : 
  - `campagneId` (UUID, requis)
  - `createurId` (UUID, requis)
  - `directiveSpeciale` (String, optionnel)
- **Description** : Crée une collaboration avec le statut `INVITATION_ENVOYEE`.

### `POST /api/collaborations/postuler`
- **Rôle** : Permet à un créateur de postuler spontanément à une campagne.
- **Authentification** : Requise (`CREATEUR`).
- **Body** :
  - `campagneId` (UUID, requis)
  - `message` (String, optionnel)
- **Description** : Crée une collaboration avec le statut `CANDIDATURE_ENVOYEE`.

### `GET /api/collaborations/`
- **Rôle** : Lister les collaborations de l'utilisateur connecté.
- **Authentification** : Requise.
- **Description** : Renvoie toutes les collaborations pertinentes (selon qu'on soit entreprise ou créateur), incluant les modèles Campagne et Créateur associés.

### `GET /api/collaborations/:id`
- **Rôle** : Obtenir les détails d'une collaboration spécifique.
- **Authentification** : Requise.
- **Paramètres URL** : `id` (UUID de la collaboration).

### `PATCH /api/collaborations/:id/accepter`
- **Rôle** : Accepter une invitation ou une candidature.
- **Authentification** : Requise (`CREATEUR` ou `ENTREPRISE`).
- **Description** : Fait passer la collaboration au statut `TRAVAIL_EN_COURS`.

### `PATCH /api/collaborations/:id/refuser`
- **Rôle** : Décliner ou annuler une collaboration.
- **Authentification** : Requise (`CREATEUR` ou `ENTREPRISE`).
- **Description** : Change le statut de la collaboration en `REFUSEE` ou `ANNULEE`.

---

## 2. Contenus de Collaboration (Lignes / Soumissions)

### `POST /api/collaborations/:id/lignes`
- **Rôle** : Permet au créateur de proposer une ligne de contenu (prestation) dans la collaboration.
- **Authentification** : Requise (`CREATEUR`).
- **Body** : `offreId` (UUID), `quantite` (Int), `prixUnitaire` (Decimal).

### `PATCH /api/collaborations/lignes/:ligneId/traiter`
- **Rôle** : L'entreprise valide ou rejette une proposition de prestation du créateur.
- **Authentification** : Requise (`ENTREPRISE`).
- **Body** : `action` (`ACCEPTER` | `REFUSER`).

### `PATCH /api/collaborations/lignes/:ligneId/soumettre`
- **Rôle** : Le créateur soumet concrètement le contenu (fichier ou lien).
- **Authentification** : Requise (`CREATEUR`).
- **Body/Form-data** : `fichier` (File), `lien` (String), `commentaire` (String).

### `PATCH /api/collaborations/soumissions/:soumissionId/valider`
- **Rôle** : L'entreprise valide le livrable final soumis par le créateur.
- **Authentification** : Requise (`ENTREPRISE`).

### `PATCH /api/collaborations/soumissions/:soumissionId/refuser`
- **Rôle** : L'entreprise refuse le livrable et demande des retouches.
- **Authentification** : Requise (`ENTREPRISE`).
- **Body** : `raisonRefus` (String).

---

## 3. Messagerie (`/api/messages`)

### `GET /api/messages/:collaborationId`
- **Rôle** : Récupérer l'historique des messages d'une collaboration.
- **Authentification** : Requise.

### `POST /api/messages/`
- **Rôle** : Envoyer un message texte dans une collaboration.
- **Authentification** : Requise.
- **Body** : `collaborationId` (UUID), `contenu` (String).

### `POST /api/messages/fichier`
- **Rôle** : Envoyer une pièce jointe dans la messagerie.
- **Authentification** : Requise.
- **Body/Form-data** : `collaborationId` (UUID), `fichier` (File).

### `PATCH /api/messages/:id/lue`
- **Rôle** : Marquer un message comme lu.
- **Authentification** : Requise.

---

## 4. Paiements (`/api/paiements`)

### `POST /api/paiements/initier`
- **Rôle** : L'entreprise initie le paiement d'une collaboration terminée.
- **Authentification** : Requise (`ENTREPRISE`).
- **Body** : `collaborationId` (UUID), `methodePaiement` (String).

### `POST /api/paiements/confirmer`
- **Rôle** : Webhook appelé par la passerelle de paiement (PayTech) après un paiement réussi.
- **Authentification** : Externe (Signature PayTech).

### `GET /api/paiements/historique`
- **Rôle** : Lister toutes les transactions et paiements de l'utilisateur.
- **Authentification** : Requise.

### `GET /api/paiements/:id/facture`
- **Rôle** : Télécharger ou visualiser la facture / le reçu d'un paiement.
- **Authentification** : Requise.
