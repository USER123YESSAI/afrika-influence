'use client';
// frontend/app/collaborations/[id]/contenus/page.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import AuthGuard from '@/components/auth/AuthGuard';
import { collabApi, offreApi, formatFCFA, getUser, type LigneContenu } from '@/lib/api';

interface Offre { id: string; reseau: string; typeContenu: string; prix: number; delaiLivraison: number; }

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  PROPOSEE: { label: 'En attente de la marque', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  REFUSEE:  { label: 'Refusée',                 className: 'bg-red-50 text-red-700 border border-red-200' },
  ACCEPTEE: { label: 'Acceptée',                className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

export default function ContenusPage() {
  const { id } = useParams<{ id: string }>();
  const role = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const isEntreprise = role === 'ENTREPRISE' || role === 'PARTICULIER';
  const Shell = isEntreprise ? DashboardEntreprise : DashboardCreateur;

  const [collab, setCollab] = useState<any>(null);
  const [lignes, setLignes] = useState<LigneContenu[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  // Formulaire de proposition (créateur)
  const [selectedOffre, setSelectedOffre] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number | ''>('');
  const [proposing, setProposing] = useState(false);

  // Édition d'une ligne refusée (créateur)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantite, setEditQuantite] = useState(1);
  const [editPrix, setEditPrix] = useState<number | ''>('');

  // Refus d'une ligne avec motif (entreprise)
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [refusRaison, setRefusRaison] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const charger = () => {
    if (!id) return;
    Promise.all([
      collabApi.detail(id),
      collabApi.listerLignes(id),
      isEntreprise ? Promise.resolve([]) : offreApi.lister(),
    ]).then(([c, l, o]: any) => {
      setCollab(c); setLignes(l); setOffres(o);
      if (!isEntreprise && o.length > 0 && !selectedOffre) {
        setSelectedOffre(o[0].id);
        setPrixUnitaire(o[0].prix);
      }
    }).catch((e) => showToast('❌ ' + e.message)).finally(() => setLoading(false));
  };

  useEffect(charger, [id]);

  const offre = offres.find(o => o.id === selectedOffre);

  const handleSelectOffre = (offreId: string) => {
    setSelectedOffre(offreId);
    const o = offres.find(x => x.id === offreId);
    if (o) setPrixUnitaire(o.prix);
  };

  const handleProposer = async () => {
    if (!selectedOffre || quantite < 1 || !prixUnitaire || Number(prixUnitaire) <= 0)
      return showToast('❌ Complétez le formulaire.');
    setProposing(true);
    try {
      await collabApi.proposerLigne(id, { offreId: selectedOffre, quantite, prixUnitaire: Number(prixUnitaire) });
      setQuantite(1);
      showToast('✅ Proposition envoyée à la marque !');
      charger();
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setProposing(false); }
  };

  const startEdit = (ligne: LigneContenu) => {
    setEditingId(ligne.id);
    setEditQuantite(ligne.quantite);
    setEditPrix(ligne.prixUnitaire);
  };

  const handleReproposer = async (ligneId: string) => {
    try {
      await collabApi.modifierLigne(ligneId, { quantite: editQuantite, prixUnitaire: Number(editPrix) });
      setEditingId(null);
      showToast('✅ Nouvelle proposition envoyée !');
      charger();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleRetirer = async (ligneId: string) => {
    if (!confirm('Retirer cette ligne ?')) return;
    try {
      await collabApi.supprimerLigne(ligneId);
      showToast('Ligne retirée.');
      charger();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleTraiter = async (ligneId: string, action: 'ACCEPTER' | 'REFUSER') => {
    try {
      await collabApi.traiterLigne(ligneId, action);
      showToast(action === 'ACCEPTER' ? '✅ Ligne acceptée !' : 'Ligne refusée.');
      charger();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleRefuserLigne = async (ligneId: string) => {
    try {
      await collabApi.traiterLigne(ligneId, 'REFUSER', refusRaison.trim() || undefined);
      setRefusingId(null); setRefusRaison('');
      showToast('Ligne refusée.');
      charger();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  if (loading || !collab) {
    return (
      <AuthGuard roles={['CREATEUR', 'ENTREPRISE', 'PARTICULIER']}>
        <Shell>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400 animate-pulse">Chargement…</div>
          </div>
        </Shell>
      </AuthGuard>
    );
  }

  const budgetCampagne = Number(collab.campagne?.budget || 0);
  const budgetDepense = Number(collab.campagne?.budgetDepense || 0);
  const budgetDisponible = budgetCampagne - budgetDepense;
  const pctUtilise = budgetCampagne > 0 ? Math.min(100, (budgetDepense / budgetCampagne) * 100) : 0;
  const previewSousTotal = quantite && prixUnitaire ? quantite * Number(prixUnitaire) : 0;
  const depassement = previewSousTotal > budgetDisponible;

  return (
    <AuthGuard roles={['CREATEUR', 'ENTREPRISE', 'PARTICULIER']}>
      <Shell>
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50">
            {toast}
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/collaborations" className="hover:text-emerald-600">Collaborations</Link>
            <span>›</span>
            <Link href={`/collaborations/${id}`} className="hover:text-emerald-600">{collab.campagne?.titre}</Link>
            <span>›</span>
            <span className="text-gray-700">Lignes de contenu</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
            {isEntreprise ? 'Propositions du créateur' : 'Négocier mes tarifs'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isEntreprise
              ? 'Acceptez ou refusez chaque ligne proposée. La livraison du contenu se gère depuis la page de la collaboration.'
              : 'Proposez vos tarifs par type de contenu. Si une ligne est refusée, ajustez-la et re-proposez. La livraison se fait ensuite depuis la page de la collaboration.'}
          </p>

          {/* Budget progress */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Budget campagne engagé</span>
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
              <span className="text-xs text-gray-400">{pctUtilise.toFixed(0)}% engagé</span>
              <span className="text-xs text-emerald-600 font-medium">{formatFCFA(budgetDisponible)} disponible</span>
            </div>
          </div>

          {/* Formulaire de proposition — créateur uniquement */}
          {!isEntreprise && collab.statut === 'TRAVAIL_EN_COURS' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-5">Proposer une ligne</h2>

              {offres.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-3">Aucune offre créée.</p>
                  <Link href="/createur/offres" className="text-sm text-emerald-600 hover:underline font-medium">
                    → Créer mes offres d'abord
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Offre de base</label>
                      <select
                        value={selectedOffre}
                        onChange={e => handleSelectOffre(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        {offres.map(o => (
                          <option key={o.id} value={o.id}>{o.reseau} – {o.typeContenu} ({formatFCFA(o.prix)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantité</label>
                      <input
                        type="number" min={1} max={50}
                        value={quantite}
                        onChange={e => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                        onWheel={e => (e.target as HTMLInputElement).blur()}
                        className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Votre prix pour cette ligne (FCFA) — modifiable
                    </label>
                    <input
                      type="number" min={1}
                      value={prixUnitaire}
                      onChange={e => setPrixUnitaire(e.target.value ? Number(e.target.value) : '')}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                      className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    {offre && Number(prixUnitaire) !== offre.prix && (
                      <p className="text-xs text-amber-600 mt-1">Différent de votre tarif catalogue ({formatFCFA(offre.prix)})</p>
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
                    depassement ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-100'
                  }`}>
                    <div className="text-sm text-gray-600">{quantite} × {formatFCFA(Number(prixUnitaire) || 0)}</div>
                    <div className={`text-lg font-bold ${depassement ? 'text-red-600' : 'text-emerald-700'}`}>
                      {formatFCFA(previewSousTotal)}
                    </div>
                  </div>
                  {depassement && (
                    <p className="text-xs text-red-500 mb-4">⚠️ Dépasse le budget disponible ({formatFCFA(budgetDisponible)}).</p>
                  )}

                  <button
                    onClick={handleProposer}
                    disabled={proposing || !selectedOffre}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all"
                  >
                    {proposing ? 'Envoi…' : '+ Proposer cette ligne'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Liste des lignes */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Lignes ({lignes.length})</h2>
            </div>
            {lignes.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">Aucune ligne proposée pour l'instant.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {lignes.map((ligne) => {
                  const badge = STATUT_BADGE[ligne.statut];
                  return (
                    <div key={ligne.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{ligne.typeContenu}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                          </div>
                          <div className="text-xs text-gray-400">{ligne.quantite} × {formatFCFA(ligne.prixUnitaire)}</div>
                        </div>
                        <div className="font-semibold text-gray-900 shrink-0">{formatFCFA(ligne.sousTotal)}</div>
                      </div>

                      {/* Actions entreprise : accepter/refuser une proposition */}
                      {isEntreprise && ligne.statut === 'PROPOSEE' && refusingId !== ligne.id && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setRefusingId(ligne.id)}
                            className="flex-1 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                            Refuser
                          </button>
                          <button onClick={() => handleTraiter(ligne.id, 'ACCEPTER')}
                            className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                            Accepter
                          </button>
                        </div>
                      )}
                      {isEntreprise && ligne.statut === 'PROPOSEE' && refusingId === ligne.id && (
                        <div className="flex gap-2 mt-3">
                          <input value={refusRaison} onChange={e => setRefusRaison(e.target.value)}
                            placeholder="Motif du refus (optionnel)" autoFocus
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                          <button onClick={() => { setRefusingId(null); setRefusRaison(''); }}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
                          <button onClick={() => handleRefuserLigne(ligne.id)}
                            className="px-3 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700">
                            Confirmer le refus
                          </button>
                        </div>
                      )}

                      {ligne.statut === 'REFUSEE' && ligne.raisonRefus && (
                        <p className="text-xs text-red-500 mt-2">Motif du refus : {ligne.raisonRefus}</p>
                      )}

                      {/* Créateur : ligne en attente, peut retirer */}
                      {!isEntreprise && ligne.statut === 'PROPOSEE' && (
                        <button onClick={() => handleRetirer(ligne.id)}
                          className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors">
                          Retirer la proposition
                        </button>
                      )}

                      {/* Créateur : ligne refusée, éditer et re-proposer */}
                      {!isEntreprise && ligne.statut === 'REFUSEE' && editingId !== ligne.id && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => startEdit(ligne)}
                            className="flex-1 py-2 text-sm font-medium border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors">
                            Ajuster et re-proposer
                          </button>
                          <button onClick={() => handleRetirer(ligne.id)}
                            className="px-3 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
                            Retirer
                          </button>
                        </div>
                      )}
                      {!isEntreprise && ligne.statut === 'REFUSEE' && editingId === ligne.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" min={1} value={editQuantite}
                              onChange={e => setEditQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                              onWheel={e => (e.target as HTMLInputElement).blur()}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Quantité" />
                            <input type="number" min={1} value={editPrix}
                              onChange={e => setEditPrix(e.target.value ? Number(e.target.value) : '')}
                              onWheel={e => (e.target as HTMLInputElement).blur()}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Prix unitaire" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)}
                              className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100">Annuler</button>
                            <button onClick={() => handleReproposer(ligne.id)}
                              className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                              Re-proposer
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Ligne acceptée : la livraison se gère depuis la page de la collaboration */}
                      {ligne.statut === 'ACCEPTEE' && (() => {
                        const soumissions = ligne.soumissions ?? [];
                        const validees = soumissions.filter(s => s.dateValidation).length;
                        return (
                          <Link href={`/collaborations/${id}`}
                            className="mt-3 flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3 py-2 hover:bg-emerald-100 transition-colors">
                            <span>{validees}/{ligne.quantite} livrée(s) et validée(s)</span>
                            <span className="font-medium">Gérer la livraison →</span>
                          </Link>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6">
            <Link href={`/collaborations/${id}`} className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
              ← Retour à la collaboration
            </Link>
          </div>
        </div>
      </Shell>
    </AuthGuard>
  );
}
