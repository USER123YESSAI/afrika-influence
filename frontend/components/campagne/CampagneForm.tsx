'use client';

import { useState } from 'react';
import type { Campagne } from '@/lib/api';

const PLATEFORMES = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'FACEBOOK'];

type PlateformeValue = string | { plateforme: string };
type FormData = Omit<Partial<Campagne>, 'plateformes'> & { plateformes?: string[] };
type InitialFormData = Omit<Partial<Campagne>, 'plateformes'> & { plateformes?: PlateformeValue[] };

interface Props {
  initialData?: InitialFormData;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function CampagneForm({ initialData = {}, onSubmit, isLoading, submitLabel = 'Enregistrer' }: Props) {
  const [form, setForm] = useState<FormData>({
    titre: '', description: '', budget: undefined, objectifPrincipal: '',
    consignesContenu: '', contraintesContenu: '', exempleContenu: '',
    nombreCreateursVoulus: undefined, nombrePostsParCreateur: undefined,
    dateDebut: '', dateFin: '',
    ...initialData,
    plateformes: initialData.plateformes
      ? (typeof initialData.plateformes[0] === 'string'
          ? initialData.plateformes as string[]
          : (initialData.plateformes as { plateforme: string }[]).map(p => p.plateforme))
      : [],
  });
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const togglePlateforme = (p: string) =>
    set('plateformes', (form.plateformes ?? []).includes(p)
      ? form.plateformes!.filter(x => x !== p)
      : [...(form.plateformes ?? []), p]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try { await onSubmit(form); }
    catch (err) { setError((err as Error).message); }
  };

  const field = (label: string, key: keyof FormData, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={(form[key] as string | number | undefined) ?? ''}
        onChange={e => set(key, type === 'number' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)}
        onWheel={type === 'number' ? (e => (e.target as HTMLInputElement).blur()) : undefined}
        required={required}
        min={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Informations générales</h2>
        {field('Titre de la campagne', 'titre', 'text', true)}
        {textarea('Description', 'description')}
        {field('Budget (XOF)', 'budget', 'number', true)}
        {textarea('Objectif principal', 'objectifPrincipal')}
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Contenu et créateurs</h2>
        {textarea('Consignes de contenu', 'consignesContenu')}
        {textarea('Contraintes de contenu', 'contraintesContenu')}
        {textarea('Exemple de contenu', 'exempleContenu')}
        <div className="grid grid-cols-2 gap-4">
          {field('Nombre de créateurs voulus', 'nombreCreateursVoulus', 'number')}
          {field('Posts par créateur', 'nombrePostsParCreateur', 'number')}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Plateformes cibles</h2>
        <div className="flex flex-wrap gap-3">
          {PLATEFORMES.map(p => {
            const active = (form.plateformes ?? []).includes(p);
            return (
              <button key={p} type="button" onClick={() => togglePlateforme(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  active ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600 hover:border-emerald-400'
                }`}>
                {p}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dates</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('Date de début', 'dateDebut', 'date')}
          {field('Date de fin', 'dateFin', 'date')}
        </div>
      </section>

      <button type="submit" disabled={isLoading}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {isLoading ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}
