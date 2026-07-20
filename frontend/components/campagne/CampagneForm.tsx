'use client';

import { useState } from 'react';
import type { Campagne } from '@/lib/api';

const PLATEFORMES = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'FACEBOOK'];

const today = () => new Date().toISOString().split('T')[0];
const lendemain = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

type PlateformeValue = string | { plateforme: string };
type FormData = Omit<Partial<Campagne>, 'plateformes'> & { plateformes?: string[] };
type InitialFormData = Omit<Partial<Campagne>, 'plateformes'> & { plateformes?: PlateformeValue[] };

interface Props {
  initialData?: InitialFormData;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  /** 'wizard' affiche les champs étape par étape avec validation bloquante (création).
   *  'complet' (défaut) affiche tout sur une page, comme pour la modification. */
  mode?: 'wizard' | 'complet';
  /** Étape courante (0 = Informations, 1 = Contenu et créateurs) — piloté par le parent en mode wizard. */
  step?: number;
  /** Appelé quand l'étape 0 est validée, pour que le parent avance à l'étape 1. */
  onNext?: () => void;
  /** Appelé pour revenir à l'étape 0 depuis l'étape 1. */
  onBack?: () => void;
  /** Solde disponible de l'entreprise — affiche un avertissement live si le budget le dépasse. */
  soldeDisponible?: number | null;
}

const fmtFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function CampagneForm({
  initialData = {}, onSubmit, isLoading, submitLabel = 'Enregistrer',
  mode = 'complet', step = 0, onNext, onBack, soldeDisponible,
}: Props) {
  const [form, setForm] = useState<FormData>({
    titre: '', description: '', budget: undefined, budgetVisible: true, objectifPrincipal: '',
    consignesContenu: '', contraintesContenu: '', exempleContenu: '',
    nombreCreateursVoulus: undefined,
    dateDebut: '', dateFin: '',
    ...initialData,
    plateformes: initialData.plateformes
      ? (typeof initialData.plateformes[0] === 'string'
          ? initialData.plateformes as string[]
          : (initialData.plateformes as { plateforme: string }[]).map(p => p.plateforme))
      : [],
  });
  const [error, setError] = useState('');

  const isWizard = mode === 'wizard';
  const currentStep = isWizard ? step : 0;

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const togglePlateforme = (p: string) =>
    set('plateformes', (form.plateformes ?? []).includes(p)
      ? form.plateformes!.filter(x => x !== p)
      : [...(form.plateformes ?? []), p]);

  // Validation bloquante par étape — reflète les contraintes déjà imposées côté backend
  // (titre/budget requis, ordre des dates) pour ne jamais laisser passer côté client
  // ce que l'API rejetterait de toute façon.
  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.titre || form.titre.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères.';
      if (!form.budget || form.budget <= 0) return 'Le budget doit être supérieur à 0.';
      if (form.dateDebut && form.dateFin && new Date(form.dateFin) <= new Date(form.dateDebut))
        return 'La date de fin doit être postérieure à la date de début.';
      return null;
    }
    if (s === 1) {
      if (form.nombreCreateursVoulus !== undefined && form.nombreCreateursVoulus < 1)
        return 'Le nombre de créateurs voulus doit être d\'au moins 1.';
      return null;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isWizard && currentStep === 0) {
      const validationError = validateStep(0);
      if (validationError) { setError(validationError); return; }
      onNext?.();
      return;
    }

    // Étape finale (wizard step 1, ou mode complet) : on revalide tout avant d'envoyer.
    const err0 = validateStep(0);
    if (err0) { setError(err0); return; }
    const err1 = validateStep(1);
    if (err1) { setError(err1); return; }

    // Normaliser les champs date vides en null plutôt qu'en chaîne vide —
    // une chaîne vide n'est pas une date valide et fait échouer la validation backend.
    const payload: FormData = {
      ...form,
      dateDebut: form.dateDebut || null,
      dateFin: form.dateFin || null,
    };

    try { await onSubmit(payload); }
    catch (err) { setError((err as Error).message); }
  };

  const field = (label: string, key: keyof FormData, type = 'text', required = false, min?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={(form[key] as string | number | undefined) ?? ''}
        onChange={e => set(key, type === 'number' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)}
        onWheel={type === 'number' ? (e => (e.target as HTMLInputElement).blur()) : undefined}
        required={required}
        min={min}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );

  const textarea = (label: string, key: keyof FormData) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={3}
        value={(form[key] as string) ?? ''}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );

  const showStep0 = !isWizard || currentStep === 0;
  const showStep1 = !isWizard || currentStep === 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

      {showStep0 && (
        <>
          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations générales</h2>
            {field('Titre de la campagne', 'titre', 'text', true)}
            {textarea('Description', 'description')}
            {field('Budget (XOF)', 'budget', 'number', true, '1')}
            {typeof soldeDisponible === 'number' && !!form.budget && form.budget > soldeDisponible && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-2">
                ⚠️ Solde disponible : {fmtFCFA(soldeDisponible)}. Ce budget ne pourra pas être publié tant que
                vous n'aurez pas rechargé votre compte (vous pourrez toujours l'enregistrer en brouillon).
              </p>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.budgetVisible !== false}
                onChange={e => set('budgetVisible', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Afficher le budget aux créateurs (sinon masqué, campagne quand même visible)
            </label>
            {textarea('Objectif principal', 'objectifPrincipal')}
          </section>

          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={(form.dateDebut as string) ?? ''}
                  onChange={e => set('dateDebut', e.target.value)}
                  min={today()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={(form.dateFin as string) ?? ''}
                  onChange={e => set('dateFin', e.target.value)}
                  min={form.dateDebut ? lendemain(form.dateDebut as string) : today()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {showStep1 && (
        <>
          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Contenu et créateurs</h2>
            {textarea('Consignes de contenu', 'consignesContenu')}
            {textarea('Contraintes de contenu', 'contraintesContenu')}
            {textarea('Exemple de contenu', 'exempleContenu')}
            {field('Nombre de créateurs voulus', 'nombreCreateursVoulus', 'number', false, '1')}
          </section>

          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Plateformes cibles</h2>
            <div className="flex flex-wrap gap-3">
              {PLATEFORMES.map(p => {
                const active = (form.plateformes ?? []).includes(p);
                return (
                  <button key={p} type="button" onClick={() => togglePlateforme(p)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      active ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600 hover:border-brand-400'
                    }`}>
                    {p}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      <div className="flex gap-3">
        {isWizard && currentStep === 1 && (
          <button type="button" onClick={onBack}
            className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            ← Retour
          </button>
        )}
        <button type="submit" disabled={isLoading}
          className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
          {isLoading ? 'Enregistrement…' : isWizard && currentStep === 0 ? 'Continuer →' : submitLabel}
        </button>
      </div>
    </form>
  );
}
