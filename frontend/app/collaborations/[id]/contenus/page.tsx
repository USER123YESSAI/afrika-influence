'use client';
// frontend/app/collaborations/[id]/contenus/page.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { collabApi, offreApi, formatFCFA } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

interface Offre { id: string; reseau: string; typeContenu: string; prix: number; delaiLivraison: number; }
interface Ligne { id: string; offreId: string; typeContenu: string; quantite: number; prixUnitaire: number; sousTotal: number; offre?: Offre; }

export default function ContenusPage() {
  const { id } = useParams<{ id: string }>();
  const [collab, setCollab] = useState<any>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [selectedOffre, setSelectedOffre] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      collabApi.detail(id),
      offreApi.lister(),
      collabApi.listerContenus(id),
    ]).then(([c, o, l]: any) => {
      setCollab(c); setOffres(o); setLignes(l);
      if (o.length > 0) setSelectedOffre(o[0].id);
    }).catch(console.error);
  }, [id]);

  const offre = offres.find(o => o.id === selectedOffre);
  const previewSousTotal = offre ? offre.prix * quantite : 0;
  const totalActuel = lignes.reduce((s, l) => s + parseFloat(String(l.sousTotal)), 0);
  const budgetCampagne = collab?.campagne?.budget || 0;
  const budgetDepense = parseFloat(collab?.campagne?.budgetDepense || 0);
  const budgetDisponible = budgetCampagne - budgetDepense;
  const pctUtilise = budgetCampagne > 0 ? Math.min(100, (budgetDepense / budgetCampagne) * 100) : 0;
  const depassement = previewSousTotal > budgetDisponible;

  const handleAjouter = async () => {
    if (!selectedOffre || quantite < 1) return;
    if (depassement) return showToast('⚠️ Budget campagne insuffisant.');
    setAdding(true);
    try {
      const ligne: any = await collabApi.ajouterContenu(id, { offreId: selectedOffre, quantite });
      setLignes(prev => [...prev, { ...ligne, offre }]);
      setQuantite(1);
      // Rafraîchir la collab pour mettre à jour budgetDepense
      const updated: any = await collabApi.detail(id);
      setCollab(updated);
      showToast('✅ Contenu ajouté !');
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setAdding(false); }
  };

  if (!collab) {
    return (
      <AuthGuard roles={['CREATEUR']}>
        <DashboardCreateur>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 animate-pulse">Chargement…</div>
          </div>
        </DashboardCreateur>
      </AuthGuard>
    );
  }


  return (
    <DashboardCreateur>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/collaborations" className="hover:text-emerald-600">Collaborations</Link>
          <span>›</span>
          <Link href={`/collaborations/${id}`} className="hover:text-emerald-600">
            {collab.campagne?.titre}
          </Link>
          <span>›</span>
          <span className="text-gray-700">Contenus</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Définir les contenus
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Sélectionnez vos offres et la quantité pour calculer votre rémunération.
        </p>

        {/* Budget progress */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Budget campagne utilisé</span>
            <span className="text-sm font-bold text-gray-900">
              {formatFCFA(budgetDepense)} / {formatFCFA(budgetCampagne)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${pctUtilise > 85 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${pctUtilise}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{pctUtilise.toFixed(0)}% utilisé</span>
            <span className="text-xs text-emerald-600 font-medium">
              {formatFCFA(budgetDisponible)} disponible
            </span>
          </div>
        </div>

        {/* Formulaire ajout */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-5">Ajouter une ligne</h2>

          {offres.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-3">Aucune offre créée.</p>
              <Link href="/createur/offres"
                className="text-sm text-emerald-600 hover:underline font-medium">
                → Créer mes offres d'abord
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Offre *</label>
                  <select
                    value={selectedOffre}
                    onChange={e => setSelectedOffre(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {offres.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.reseau} – {o.typeContenu} ({formatFCFA(o.prix)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantité *</label>
                  <input
                    type="number"
                    value={quantite}
                    onChange={e => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={50}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Preview sous-total */}
              {offre && (
                <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
                  depassement ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-100'
                }`}>
                  <div className="text-sm text-gray-600">
                    {quantite} × {formatFCFA(offre.prix)}
                    {offre.delaiLivraison && (
                      <span className="text-xs text-gray-400 ml-2">
                        (⏱ {offre.delaiLivraison * quantite} jours estimés)
                      </span>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${depassement ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatFCFA(previewSousTotal)}
                  </div>
                </div>
              )}

              {depassement && (
                <p className="text-xs text-red-500 mb-4">
                  ⚠️ Ce montant dépasse le budget disponible ({formatFCFA(budgetDisponible)}).
                </p>
              )}

              <button
                onClick={handleAjouter}
                disabled={adding || depassement || !selectedOffre}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all"
              >
                {adding ? 'Ajout en cours…' : '+ Ajouter cette ligne'}
              </button>
            </>
          )}
        </div>

        {/* Tableau récapitulatif */}
        {lignes.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Récapitulatif</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {lignes.map((ligne) => (
                <div key={ligne.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{ligne.typeContenu}</div>
                    <div className="text-xs text-gray-400">
                      {ligne.quantite} × {formatFCFA(ligne.prixUnitaire)}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">{formatFCFA(ligne.sousTotal)}</div>
                </div>
              ))}
              <div className="px-6 py-4 flex items-center justify-between bg-emerald-50">
                <span className="font-bold text-gray-900">Total rémunération</span>
                <span className="text-xl font-bold text-emerald-700">{formatFCFA(totalActuel)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Retour */}
        <div className="mt-6">
          <Link href={`/collaborations/${id}`}
            className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
            ← Retour à la collaboration
          </Link>
        </div>
      </div>
    </DashboardCreateur>
  );
}