'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCampagne, updateCampagne, type Campagne } from '@/lib/api';
import CampagneForm from '@/components/campagne/CampagneForm';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';

export default function ModifierCampagnePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCampagne(id)
      .then(c => {
        if (!['BROUILLON', 'PUBLIEE'].includes(c.statut)) {
          setError(`Modification impossible : campagne ${c.statut}`);
        }
        setCampagne(c);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: Partial<Campagne> & { plateformes?: string[] }) => {
    setSaving(true);
    try {
      await updateCampagne(id, data);
      router.push(`/campagnes/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardEntreprise>
        <div className="text-center py-20 text-gray-400">Chargement…</div>
      </DashboardEntreprise>
    );
  }

  return (
    <DashboardEntreprise>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">

        <Link href={`/campagnes/${id}`} className="text-sm text-gray-400 hover:text-emerald-600">← Retour</Link>
        <h1 className="font-display text-2xl font-bold text-emerald-600">Modifier la campagne</h1>
      </div>

      {error && <p className="mb-4 text-red-700 bg-red-50 px-4 py-3 rounded-2xl text-sm">{error}</p>}

      {campagne && !error && (
        <CampagneForm
          initialData={campagne}
          onSubmit={handleSubmit}
          isLoading={saving}
          submitLabel="Enregistrer les modifications"
        />
      )}
      </div>
    </DashboardEntreprise>
  );
}

