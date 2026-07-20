'use client';
// frontend/app/collaborations/[id]/page.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { collabApi, messageApi, signalementApi, MOTIFS_SIGNALEMENT, formatFCFA, getUser, type LigneContenu } from '@/lib/api';


interface Message {
  id: string;
  contenu: string;
  fichierUrl?: string;
  dateEnvoi: string;
  lu: boolean;
  expediteur: { id: string; nom: string; role: string };
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const contenuUrl = (url: string) => (url.startsWith('http') ? url : `${BASE}${url}`);

export default function CollabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [collab, setCollab] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [toast, setToast] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [refusRaison, setRefusRaison] = useState('');
  const [editingSoumissionId, setEditingSoumissionId] = useState<string | null>(null);
  const [editSoumissionUrl, setEditSoumissionUrl] = useState('');
  const [editSoumissionFile, setEditSoumissionFile] = useState<File | null>(null);
  const [signalementOpen, setSignalementOpen] = useState(false);
  const [signalementMotif, setSignalementMotif] = useState('');
  const [signalementDescription, setSignalementDescription] = useState('');
  const [signalementSending, setSignalementSending] = useState(false);
  const [signalementEnvoye, setSignalementEnvoye] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId   = typeof window !== 'undefined' ? (getUser()?.id ?? '') : '';
  const currentUserRole = typeof window !== 'undefined' ? (getUser()?.role ?? '') : '';
  const Shell = (currentUserRole === 'ENTREPRISE' || currentUserRole === 'PARTICULIER') ? DashboardEntreprise : DashboardCreateur;


  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!id) return;
    
    // Chargement initial
    Promise.all([
      collabApi.detail(id),
      messageApi.historique(id),
    ]).then(([c, m]: any) => {
      setCollab(c);
      setMessages(m);
    }).catch(console.error).finally(() => setLoading(false));

    // Polling toutes les 3 secondes pour simuler le temps réel
    const intervalId = setInterval(async () => {
      try {
        const [c, m]: any = await Promise.all([
          collabApi.detail(id),
          messageApi.historique(id),
        ]);
        
        // On met à jour seulement si de nouveaux messages sont arrivés
        setMessages(prev => (prev.length !== m.length ? m : prev));
        // On met à jour la collab seulement si le statut ou autre info a changé
        setCollab(prev => (JSON.stringify(prev) !== JSON.stringify(c) ? c : prev));
      } catch (e) {
        console.error("Erreur lors de l'actualisation en temps réel:", e);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAccepter = async () => {
    try {
      await collabApi.accepter(id);
      setCollab((c: any) => ({ ...c, statut: 'TRAVAIL_EN_COURS' }));
      showToast('✅ Collaboration acceptée !');
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleRefuser = async () => {
    const message = collab.statut === 'INVITATION_ENVOYEE'
      ? 'Refuser cette invitation ?'
      : 'Refuser cette collaboration ? Le budget déjà réservé pour les lignes non livrées sera libéré.';
    if (!confirm(message)) return;
    try {
      await collabApi.refuser(id);
      setCollab((c: any) => ({ ...c, statut: 'REFUSEE' }));
      showToast('Collaboration refusée.');
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const rafraichirCollab = async () => {
    try { setCollab(await collabApi.detail(id)); } catch (e) { console.error(e); }
  };

  const handleSoumettre = async (ligneId: string) => {
    if (!submitUrl.trim() && !submitFile) return showToast('❌ Entrez un lien ou joignez un fichier.');
    try {
      await collabApi.soumettreLigne(ligneId, { contenuUrl: submitUrl.trim() || undefined, fichier: submitFile || undefined });
      setSubmittingId(null); setSubmitUrl(''); setSubmitFile(null);
      showToast('🎉 Contenu soumis !');
      rafraichirCollab();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleModifierSoumission = async (soumissionId: string) => {
    if (!editSoumissionUrl.trim() && !editSoumissionFile) return showToast('❌ Entrez un lien ou joignez un fichier.');
    try {
      await collabApi.modifierSoumission(soumissionId, { contenuUrl: editSoumissionUrl.trim() || undefined, fichier: editSoumissionFile || undefined });
      setEditingSoumissionId(null); setEditSoumissionUrl(''); setEditSoumissionFile(null);
      showToast('✅ Soumission modifiée.');
      rafraichirCollab();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleSupprimerSoumission = async (soumissionId: string) => {
    if (!confirm('Supprimer cette soumission ?')) return;
    try {
      await collabApi.supprimerSoumission(soumissionId);
      showToast('Soumission supprimée.');
      rafraichirCollab();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleSignaler = async (cibleId: string) => {
    if (!signalementMotif) return showToast('❌ Choisissez un motif.');
    if (!confirm('Confirmer l\'envoi de ce signalement à l\'équipe de modération ?')) return;
    setSignalementSending(true);
    try {
      await signalementApi.creer({ cibleId, motif: signalementMotif, description: signalementDescription.trim() || undefined });
      setSignalementEnvoye(true);
      setSignalementOpen(false);
      showToast('✅ Signalement envoyé à l\'équipe de modération.');
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setSignalementSending(false); }
  };

  const handleValider = async (soumissionId: string) => {
    if (!confirm('Valider ce contenu ?')) return;
    try {
      await collabApi.validerSoumission(soumissionId);
      showToast('✅ Contenu validé !');
      rafraichirCollab();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleRefuserSoumission = async (soumissionId: string) => {
    try {
      await collabApi.refuserSoumission(soumissionId, refusRaison.trim() || undefined);
      setRefusingId(null); setRefusRaison('');
      showToast('Contenu refusé — le créateur peut soumettre une nouvelle version.');
      rafraichirCollab();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleSendMsg = async () => {
    if (!newMsg.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const msg: any = await messageApi.envoyer(id, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setSendingMsg(false); }
  };

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Chargement…</div>
      </div>
    </Shell>
  );

  if (!collab) return (
    <Shell>
      <div className="text-center py-20 text-gray-400">Collaboration introuvable.</div>
    </Shell>
  );

  const campagne = collab.campagne || {};
  const createur = collab.createur || {};
  const totalRemuneration = collab.totalRemuneration || 0;

  return (
    <Shell>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/collaborations" className="hover:text-emerald-600">Collaborations</Link>
          <span>›</span>
          <span className="text-gray-700">{campagne.titre}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-emerald-600">
              {campagne.titre}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge statut={collab.statut} />
              {totalRemuneration > 0 && currentUserRole === 'CREATEUR' && (
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {formatFCFA(totalRemuneration)}
                </span>
              )}
            </div>
          </div>

          {/* Actions selon statut */}
          <div className="flex gap-2">
            {((collab.statut === 'INVITATION_ENVOYEE' && currentUserRole === 'CREATEUR') ||
              (collab.statut === 'CANDIDATURE_ENVOYEE' && (currentUserRole === 'ENTREPRISE' || currentUserRole === 'PARTICULIER'))) && (
              <>
                <button onClick={handleRefuser}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
                  Refuser
                </button>
                <button onClick={handleAccepter}
                  className="px-4 py-2 bg-gradient-emerald text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all shadow-bento hover-lift">
                  Accepter
                </button>
              </>
            )}
            {collab.statut === 'TRAVAIL_EN_COURS' && (
              <>
                <button onClick={handleRefuser}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-2xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
                  Refuser la collaboration
                </button>
                <Link href={`/collaborations/${id}/contenus`}
                  className="px-4 py-2 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-2xl hover:bg-emerald-50 transition-all">
                  {currentUserRole === 'CREATEUR' ? 'Négocier mes tarifs' : 'Examiner les propositions'}
                </Link>
              </>
            )}
            {collab.statut === 'TERMINEE' && (
              <Link href="/paiements"
                className="px-4 py-2 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-2xl hover:bg-emerald-50 transition-all">
                {(currentUserRole === 'ENTREPRISE' || currentUserRole === 'PARTICULIER') ? '✓ Payé automatiquement — voir le reçu' : '✓ Payé — voir mes revenus'}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Colonne principale : Brief + Messages */}
          <div className="col-span-2 space-y-5">
            {/* Brief */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Brief de campagne</h2>
              <div className="space-y-3">
                {campagne.description && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Description</div>
                    <p className="text-sm text-gray-700">{campagne.description}</p>
                  </div>
                )}
                {campagne.objectifPrincipal && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Objectif</div>
                    <p className="text-sm text-gray-700">{campagne.objectifPrincipal}</p>
                  </div>
                )}
                {campagne.consignesContenu && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Consignes</div>
                    <p className="text-sm text-gray-700 bg-amber-50 px-3 py-2 rounded-xl">{campagne.consignesContenu}</p>
                  </div>
                )}
                {campagne.contraintesContenu && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">À éviter</div>
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{campagne.contraintesContenu}</p>
                  </div>
                )}
                {collab.directiveSpeciale && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Directive spéciale</div>
                    <p className="text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-xl">{collab.directiveSpeciale}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Livraison des lignes acceptées — l'action se fait ici, pas besoin de retourner négocier */}
            {(() => {
              const contenus: LigneContenu[] = collab.contenus || [];
              const lignesAcceptees = contenus.filter(l => l.statut === 'ACCEPTEE');
              const enNegociation = contenus.filter(l => l.statut === 'PROPOSEE' || l.statut === 'REFUSEE').length;
              if (contenus.length === 0) return null;

              return (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900">Contenus à livrer</h2>
                    <span className="text-xs text-gray-400">
                      {formatFCFA(collab.totalValide || 0)} validé / {formatFCFA(totalRemuneration)} engagé
                    </span>
                  </div>

                  {lignesAcceptees.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucune ligne acceptée pour l'instant.</p>
                  ) : (
                    <div className="space-y-3">
                      {lignesAcceptees.map((ligne) => {
                        const soumissions = ligne.soumissions ?? [];
                        const validees = soumissions.filter(s => s.statut === 'VALIDEE').length;
                        const actives = soumissions.filter(s => s.statut !== 'REFUSEE');
                        const encoreASoumettre = ligne.quantite - actives.length;
                        return (
                          <div key={ligne.id} className="p-3 bg-gray-50 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{ligne.typeContenu}</span>
                              <span className="text-xs text-gray-500">{validees}/{ligne.quantite} livrée(s)</span>
                            </div>

                            {soumissions.map((s, i) => (
                              <div key={s.id} className="py-1.5 border-t border-gray-100 first:border-0">
                                <div className="flex items-center justify-between gap-2">
                                  <a href={contenuUrl(s.contenuUrl)} target="_blank" rel="noreferrer"
                                    className={`text-xs hover:underline truncate flex-1 ${s.statut === 'REFUSEE' ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                                    {s.contenuUrl.startsWith('/uploads') ? '📎' : '🔗'} Unité {i + 1} — {s.contenuUrl.startsWith('/uploads') ? 'fichier joint' : s.contenuUrl}
                                  </a>
                                  {s.statut === 'VALIDEE' && (
                                    <span className="text-xs text-emerald-600 font-medium shrink-0">✓ Validée</span>
                                  )}
                                  {s.statut === 'REFUSEE' && (
                                    <span className="text-xs text-red-600 font-medium shrink-0">✗ Refusée</span>
                                  )}
                                  {s.statut === 'EN_ATTENTE' && currentUserRole === 'CREATEUR' && editingSoumissionId !== s.id && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-amber-600">En attente</span>
                                      <button onClick={() => {
                                        setEditingSoumissionId(s.id);
                                        setEditSoumissionUrl(s.contenuUrl.startsWith('/uploads') ? '' : s.contenuUrl);
                                        setEditSoumissionFile(null);
                                      }} className="text-xs text-gray-400 hover:text-emerald-600">Modifier</button>
                                      <button onClick={() => handleSupprimerSoumission(s.id)}
                                        className="text-xs text-gray-400 hover:text-red-600">Supprimer</button>
                                    </div>
                                  )}
                                  {s.statut === 'EN_ATTENTE' && currentUserRole !== 'CREATEUR' && refusingId !== s.id && (
                                    <div className="flex gap-1.5 shrink-0">
                                      <button onClick={() => setRefusingId(s.id)}
                                        className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                                        Refuser
                                      </button>
                                      <button onClick={() => handleValider(s.id)}
                                        className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                                        Valider
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {s.statut === 'REFUSEE' && s.raisonRefus && (
                                  <p className="text-xs text-red-500 mt-1">Motif : {s.raisonRefus}</p>
                                )}
                                {s.statut === 'EN_ATTENTE' && currentUserRole === 'CREATEUR' && editingSoumissionId === s.id && (
                                  <div className="mt-1.5 space-y-1.5">
                                    <div className="flex gap-2">
                                      <input value={editSoumissionUrl}
                                        onChange={e => { setEditSoumissionUrl(e.target.value); setEditSoumissionFile(null); }}
                                        placeholder="https://instagram.com/p/..." autoFocus
                                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" />
                                      <label className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer shrink-0">
                                        📎 {editSoumissionFile ? editSoumissionFile.name.slice(0, 12) : 'Fichier'}
                                        <input type="file" className="hidden"
                                          onChange={e => { const f = e.target.files?.[0]; if (f) { setEditSoumissionFile(f); setEditSoumissionUrl(''); } }} />
                                      </label>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => { setEditingSoumissionId(null); setEditSoumissionUrl(''); setEditSoumissionFile(null); }}
                                        className="flex-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                                        Annuler
                                      </button>
                                      <button onClick={() => handleModifierSoumission(s.id)}
                                        className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                        Enregistrer
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {s.statut === 'EN_ATTENTE' && currentUserRole !== 'CREATEUR' && refusingId === s.id && (
                                  <div className="flex gap-2 mt-1.5">
                                    <input value={refusRaison} onChange={e => setRefusRaison(e.target.value)}
                                      placeholder="Motif du refus (optionnel)" autoFocus
                                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs" />
                                    <button onClick={() => setRefusingId(null)}
                                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700">Annuler</button>
                                    <button onClick={() => handleRefuserSoumission(s.id)}
                                      className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">
                                      Confirmer le refus
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {encoreASoumettre > 0 && currentUserRole === 'CREATEUR' && (
                              submittingId === ligne.id ? (
                                <div className="mt-2 space-y-1.5">
                                  <div className="flex gap-2">
                                    <input value={submitUrl}
                                      onChange={e => { setSubmitUrl(e.target.value); setSubmitFile(null); }}
                                      placeholder="https://instagram.com/p/..." autoFocus
                                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs" />
                                    <label className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer shrink-0">
                                      📎 {submitFile ? submitFile.name.slice(0, 12) : 'Fichier'}
                                      <input type="file" className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) { setSubmitFile(f); setSubmitUrl(''); } }} />
                                    </label>
                                  </div>
                                  <button onClick={() => handleSoumettre(ligne.id)}
                                    className="w-full py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                    Envoyer
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setSubmittingId(ligne.id)}
                                  className="w-full mt-2 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                  Soumettre {actives.length > 0 ? `l'unité ${actives.length + 1}/${ligne.quantite}` : 'mon contenu'}
                                </button>
                              )
                            )}
                            {encoreASoumettre > 0 && currentUserRole !== 'CREATEUR' && (
                              <p className="text-xs text-gray-400 mt-2">En attente de {encoreASoumettre} livraison(s) du créateur.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {enNegociation > 0 && (
                    <Link href={`/collaborations/${id}/contenus`}
                      className="mt-3 flex items-center justify-between text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 hover:bg-amber-100 transition-colors">
                      <span>{enNegociation} ligne(s) en négociation</span>
                      <span className="font-medium">Voir →</span>
                    </Link>
                  )}
                </div>
              );
            })()}

            {/* Messagerie */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900">Messages</h2>
              </div>

              {/* Messages list */}
              <div className="h-80 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                    Aucun message. Démarrez la conversation !
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.expediteur?.id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                          {!isMine && (
                            <div className="text-xs font-semibold mb-1 opacity-70">
                              {msg.expediteur?.nom}
                            </div>
                          )}
                          {msg.contenu && <p>{msg.contenu}</p>}
                          {msg.fichierUrl && (
                            <a href={msg.fichierUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs underline opacity-80 mt-1">
                              📎 Fichier joint
                            </a>
                          )}
                          <div className={`text-xs mt-1 opacity-50`}>
                            {new Date(msg.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input message */}
              <div className="px-4 py-3 border-t border-gray-50 flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
                  placeholder="Votre message…"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={handleSendMsg}
                  disabled={sendingMsg || !newMsg.trim()}
                  className="px-4 py-2.5 bg-gradient-emerald text-white text-sm font-semibold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-all hover-lift"
                >
                  {sendingMsg ? '…' : '↑'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar : mission + créateur */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Mission</h3>
              <div className="space-y-3">
                {campagne.budget && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget campagne</span>
                    <span className="font-medium">{formatFCFA(campagne.budget)}</span>
                  </div>
                )}
                {totalRemuneration > 0 && currentUserRole === 'CREATEUR' && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                    <span className="text-gray-700 font-medium">Votre rémunération</span>
                    <span className="font-bold text-emerald-700">{formatFCFA(totalRemuneration)}</span>
                  </div>
                )}
                {campagne.dateFin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date limite</span>
                    <span className="font-medium">{new Date(campagne.dateFin).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Chronologie</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Invitation', date: collab.dateInvitation },
                  { label: 'Acceptation', date: collab.dateAcceptation },
                  { label: 'Soumission', date: collab.dateSoumission },
                  { label: 'Validation', date: collab.dateValidation },
                ].filter(d => d.date).map(d => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-gray-400">{d.label}</span>
                    <span className="text-gray-700">
                      {new Date(d.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signalement — dépose une plainte contre l'autre partie, visible directement par la modération */}
            {(() => {
              const cibleId = currentUserRole === 'CREATEUR'
                ? collab.campagne?.entreprise?.utilisateurId
                : collab.createur?.utilisateurId;
              const cibleNom = currentUserRole === 'CREATEUR'
                ? (collab.campagne?.entreprise?.nom || 'cette entreprise')
                : (collab.createur?.nom || 'ce créateur');
              if (!cibleId) return null;

              return (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">Signaler un problème</h3>
                  <p className="text-xs text-gray-400 mb-3">Envoyé directement à l'équipe de modération.</p>
                  {signalementEnvoye ? (
                    <p className="text-sm text-emerald-600">✅ Signalement envoyé.</p>
                  ) : !signalementOpen ? (
                    <button onClick={() => setSignalementOpen(true)}
                      className="w-full py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                      🚩 Signaler {cibleNom}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <select value={signalementMotif} onChange={e => setSignalementMotif(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        <option value="">— Choisir un motif —</option>
                        {MOTIFS_SIGNALEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <textarea value={signalementDescription} onChange={e => setSignalementDescription(e.target.value)}
                        placeholder="Décrivez la situation (optionnel)" rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => { setSignalementOpen(false); setSignalementMotif(''); setSignalementDescription(''); }}
                          className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                          Annuler
                        </button>
                        <button onClick={() => handleSignaler(cibleId)} disabled={signalementSending}
                          className="flex-1 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                          {signalementSending ? 'Envoi…' : 'Envoyer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </Shell>
  );
}
