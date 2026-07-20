'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CampagneForm from '@/components/campagne/CampagneForm';
import { createCampagne, publierCampagne, getMonProfilEntreprise, type Campagne } from '@/lib/api';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';

const ETAPES = ['Informations', 'Contenu & créateurs', 'Récapitulatif'];

export default function NouvelleCampagnePage() {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [formData, setFormData] = useState<Partial<Campagne> & { plateformes?: string[] }>({});
  const [campagneId, setCampagneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [soldeDisponible, setSoldeDisponible] = useState<number | null>(null);

  useEffect(() => {
    getMonProfilEntreprise().then(e => setSoldeDisponible(Number(e.solde ?? 0))).catch(() => {});
  }, []);

  const budgetDepasseSolde = soldeDisponible !== null && Number(formData.budget ?? 0) > soldeDisponible;

  const handleFormSubmit = async (data: typeof formData) => {
    setFormData(data);
    setEtape(2);
  };

  const handleCreer = async (publier = false) => {
    setLoading(true); setError('');
    try {
      const c = await createCampagne(formData);
      setCampagneId(c.id);
      if (publier) await publierCampagne(c.id);
      router.push(`/campagnes/${c.id}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const fmt = (n?: number) => n ? new Intl.NumberFormat('fr-FR').format(n) + ' CFA' : '—';

  return (
    <DashboardEntreprise>
      <div className="max-w-2xl mx-auto">

      <h1 className="font-display text-2xl font-bold text-brand-600 mb-6">Nouvelle campagne</h1>

      {/* Barre de progression */}
      <div className="flex items-center mb-8">
        {ETAPES.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 ${
              i <= etape ? 'bg-gradient-brand border-brand-600 text-white' : 'border-gray-300 text-gray-400'
            }`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i <= etape ? 'text-brand-600' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < ETAPES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < etape ? 'bg-gradient-brand' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mb-4 text-red-700 bg-red-50 px-4 py-3 rounded-2xl text-sm">{error}</p>}

      {etape < 2 ? (
        <CampagneForm
          mode="wizard"
          step={etape}
          onNext={() => setEtape(1)}
          onBack={() => setEtape(0)}
          initialData={formData}
          onSubmit={handleFormSubmit}
          submitLabel="Continuer →"
          soldeDisponible={soldeDisponible}
        />
      ) : (
        /* Récapitulatif */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-bento p-6 space-y-3">
            <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>
            {[
              ['Titre', formData.titre],
              ['Budget', fmt(formData.budget ?? 0)],
              ['Objectif', formData.objectifPrincipal],
              ['Créateurs voulus', formData.nombreCreateursVoulus],
              ['Plateformes', (formData.plateformes ?? []).join(', ') || '—'],
              ['Début', formData.dateDebut || '—'],
              ['Fin', formData.dateFin || '—'],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right max-w-xs truncate">{val as string ?? '—'}</span>
              </div>
            ))}
          </div>

          {budgetDepasseSolde && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              ⚠️ Solde disponible : {fmt(soldeDisponible ?? 0)}. Ce budget dépasse votre solde — vous pouvez
              l'enregistrer en brouillon, mais la publication sera bloquée tant que vous n'aurez pas{' '}
              <a href="/entreprise/solde" className="underline font-medium">rechargé votre compte</a>.
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setEtape(0)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 hover-lift">
              ← Modifier
            </button>
            <button onClick={() => handleCreer(false)} disabled={loading}
              className="flex-1 border border-brand-200 text-brand-600 py-2.5 rounded-2xl text-sm font-medium hover:bg-brand-50 disabled:opacity-50 hover-lift">
              Sauvegarder en brouillon
            </button>
            <button onClick={() => handleCreer(true)} disabled={loading || budgetDepasseSolde}
              title={budgetDepasseSolde ? 'Solde insuffisant pour publier — enregistrez en brouillon ou rechargez votre compte.' : undefined}
              className="flex-1 bg-gradient-brand text-white py-2.5 rounded-2xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-bento hover-lift">
              {loading ? 'Création…' : 'Créer et publier'}
            </button>
          </div>
        </div>
      )}
      </div>
    </DashboardEntreprise>
  );
}

