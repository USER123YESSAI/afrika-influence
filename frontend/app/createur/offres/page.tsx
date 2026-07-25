'use client';
// frontend/app/createur/offres/page.tsx
import { useEffect, useState } from 'react';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { offreApi, formatFCFA, RESEAUX, TYPES_CONTENU } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

interface Offre {
  id: string;
  reseau: string;
  typeContenu: string;
  prix: number;
  delaiLivraison: number;
  description: string;
}

const RESEAU_EMOJI: Record<string, string> = {
  Instagram: '📸', TikTok: '🎵', YouTube: '▶️',
  Facebook: '👥', Twitter: '🐦', LinkedIn: '💼',
};

const vide = { reseau: 'Instagram', typeContenu: 'Story', prix: '', delaiLivraison: '', description: '' };

export default function OffresPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Offre | null>(null);
  const [form, setForm] = useState<any>(vide);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    offreApi.lister().then((d: any) => setOffres(d)).catch(console.error);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm(vide); setModal(true); };
  const openEdit = (o: Offre) => { setEditing(o); setForm({ ...o }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const handleSubmit = async () => {
    if (!form.prix || !form.delaiLivraison) return showToast('Remplissez tous les champs obligatoires.');
    setSaving(true);
    try {
      const payload = { ...form, prix: parseFloat(form.prix), delaiLivraison: parseInt(form.delaiLivraison) };
      if (editing) {
        const updated: any = await offreApi.modifier(editing.id, payload);
        setOffres(prev => prev.map(o => o.id === editing.id ? updated : o));
        showToast('✅ Offre modifiée !');
      } else {
        const created: any = await offreApi.creer(payload);
        setOffres(prev => [...prev, created]);
        showToast('✅ Offre créée !');
      }
      closeModal();
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return;
    try {
      await offreApi.supprimer(id);
      setOffres(prev => prev.filter(o => o.id !== id));
      showToast('🗑️ Offre supprimée.');
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <DashboardCreateur>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-emerald-600">
              Mes offres
            </h1>
            <p className="text-gray-600 mt-1">Définissez vos tarifs par format et réseau</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-emerald hover:opacity-90 text-white text-sm font-semibold rounded-2xl transition-all shadow-bento hover-lift"
          >
            + Nouvelle offre
          </button>
        </div>

        {/* Grille des offres */}
        {offres.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune offre pour le moment</h3>
            <p className="text-gray-400 text-sm mb-6">Créez votre grille tarifaire pour recevoir des propositions de collaboration.</p>
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-gradient-emerald text-white font-semibold rounded-2xl hover:opacity-90 transition-all hover-lift"
            >
              Créer ma première offre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offres.map((offre) => (
              <div
                key={offre.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-bento p-5 hover-lift transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{RESEAU_EMOJI[offre.reseau] || '📱'}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{offre.reseau}</div>
                      <div className="text-xs text-gray-400">{offre.typeContenu}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(offre)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Modifier"
                    >✏️</button>
                    <button
                      onClick={() => handleDelete(offre.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Supprimer"
                    >🗑️</button>
                  </div>
                </div>
                {offre.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{offre.description}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="font-display text-lg font-bold text-emerald-600">{formatFCFA(offre.prix)}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    ⏱ {offre.delaiLivraison} jour{offre.delaiLivraison > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal create/edit */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-emerald-600">
                {editing ? 'Modifier l\'offre' : 'Nouvelle offre'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Réseau *</label>
                  <select
                    value={form.reseau}
                    onChange={e => setF('reseau', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {RESEAUX.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type *</label>
                  <select
                    value={form.typeContenu}
                    onChange={e => setF('typeContenu', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {TYPES_CONTENU.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix (FCFA) *</label>
                  <input
                    type="number"
                    value={form.prix}
                    onChange={e => setF('prix', e.target.value)}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="50000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Délai (jours) *</label>
                  <input
                    type="number"
                    value={form.delaiLivraison}
                    onChange={e => setF('delaiLivraison', e.target.value)}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="5"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setF('description', e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="Décrivez ce qui est inclus dans cette offre…"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-emerald hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all hover-lift"
              >
                {saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardCreateur>
  );
}