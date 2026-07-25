'use client';

import { useEffect, useState } from 'react';
import { avisApi } from '@/lib/api';

interface Avis {
  id: string;
  cibleId: string;
  note: number;
  commentaire?: string;
  dateCreation: string;
  auteur?: { nom: string; photoProfilUrl?: string };
}

interface Props {
  cibleId: string;
}

export default function AvisList({ cibleId }: Props) {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvis();
  }, [cibleId]);

  const loadAvis = async () => {
    setLoading(true);
    try {
      const data = await avisApi.getRecus(cibleId) as Avis[];
      setAvis(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const averageNote = avis.length > 0
    ? avis.reduce((sum, a) => sum + a.note, 0) / avis.length
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-bento p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-bento p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-bento p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Avis reçus ({avis.length})</h3>
        {avis.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-600">{averageNote.toFixed(1)}</span>
            <span className="text-yellow-500">⭐</span>
          </div>
        )}
      </div>

      {avis.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Aucun avis pour le moment
        </div>
      ) : (
        <div className="space-y-4">
          {avis.map((a) => (
            <div key={a.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  {a.auteur?.photoProfilUrl ? (
                    <img
                      src={a.auteur.photoProfilUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-brand-600 font-semibold">
                      {a.auteur?.nom?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {a.auteur?.nom || 'Anonyme'}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold text-gray-700">{a.note}</span>
                    </div>
                  </div>
                  {a.commentaire && (
                    <p className="text-sm text-gray-600 mb-2">{a.commentaire}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(a.dateCreation).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
