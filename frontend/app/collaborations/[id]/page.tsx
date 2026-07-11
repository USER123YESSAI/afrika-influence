'use client';
// frontend/app/collaborations/[id]/page.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { collabApi, messageApi, formatFCFA, getUser } from '@/lib/api';


interface Message {
  id: string;
  contenu: string;
  fichierUrl?: string;
  dateEnvoi: string;
  lu: boolean;
  expediteur: { id: string; nom: string; role: string };
}

export default function CollabDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [collab, setCollab] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [contenuUrl, setContenuUrl] = useState('');
  const [showSoumettre, setShowSoumettre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [toast, setToast] = useState('');
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
    if (!confirm('Refuser cette collaboration ?')) return;
    try {
      await collabApi.refuser(id);
      setCollab((c: any) => ({ ...c, statut: 'REFUSEE' }));
      showToast('Collaboration refusée.');
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleSoumettre = async () => {
    if (!contenuUrl.trim()) return showToast('Entrez l\'URL de votre contenu.');
    try {
      await collabApi.soumettre(id, contenuUrl.trim());
      setCollab((c: any) => ({ ...c, statut: 'CONTENU_SOUMIS', contenuUrl: contenuUrl.trim() }));
      setShowSoumettre(false);
      showToast('🎉 Contenu soumis ! En attente de validation.');
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const handleValider = async () => {
    if (!confirm('Valider le contenu soumis par le créateur ?')) return;
    try {
      await collabApi.valider(id);
      setCollab((c: any) => ({ ...c, statut: 'CONTENU_VALIDE' }));
      showToast('✅ Contenu validé !');
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
            {collab.statut === 'INVITATION_ENVOYEE' && currentUserRole === 'CREATEUR' && (
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
            {collab.statut === 'TRAVAIL_EN_COURS' && currentUserRole === 'CREATEUR' && (
              <>
                <Link href={`/collaborations/${id}/contenus`}
                  className="px-4 py-2 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-2xl hover:bg-emerald-50 transition-all">
                  + Ajouter contenus
                </Link>
                <button onClick={() => setShowSoumettre(true)}
                  className="px-4 py-2 bg-gradient-emerald text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all shadow-bento hover-lift">
                  Soumettre le contenu
                </button>
              </>
            )}
            {collab.statut === 'CONTENU_SOUMIS' && (currentUserRole === 'ENTREPRISE' || currentUserRole === 'PARTICULIER') && (
              <button onClick={handleValider}
                className="px-4 py-2 bg-gradient-emerald text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all shadow-bento hover-lift">
                Valider le contenu ✓
              </button>
            )}
            {collab.statut === 'CONTENU_VALIDE' && (currentUserRole === 'ENTREPRISE' || currentUserRole === 'PARTICULIER') && (
              <Link href={`/collaborations/${id}/paiement`}
                className="px-4 py-2 bg-gradient-emerald text-white text-sm font-semibold rounded-2xl hover:opacity-90 transition-all shadow-bento hover-lift">
                Payer le créateur 💳
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

            {/* Contenu soumis */}
            {collab.contenuUrl && (
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-bento p-5">
                <h2 className="font-semibold text-gray-900 mb-2">Contenu soumis</h2>
                <a href={collab.contenuUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-emerald-600 hover:underline break-all">
                  🔗 {collab.contenuUrl}
                </a>
              </div>
            )}

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
                {campagne.nombrePostsParCreateur && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Publications</span>
                    <span className="font-medium">{campagne.nombrePostsParCreateur}</span>
                  </div>
                )}
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
          </div>
        </div>
      </div>

      {/* Modal soumettre contenu */}
      {showSoumettre && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-6">
            <h2 className="font-display text-lg font-bold text-emerald-600 mb-4">
              Soumettre mon contenu
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Partagez le lien vers votre contenu publié (Instagram, TikTok, YouTube, Drive…)
            </p>
            <input
              value={contenuUrl}
              onChange={e => setContenuUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSoumettre(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleSoumettre}
                className="flex-1 py-3 bg-gradient-emerald text-white font-semibold rounded-2xl hover:opacity-90 transition-all hover-lift">
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
