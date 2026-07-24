'use client';
import { useEffect, useRef, useState } from 'react';
import DashboardCreateur from '@/components/layout/DashboardCreateur';
import { createurApi, NICHES_DISPONIBLES, RESEAUX, getToken, getImageUrl } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PAYS_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' }, { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' }, { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' }, { value: 'GN', label: '🇬🇳 Guinée' },
  { value: 'TG', label: '🇹🇬 Togo' }, { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'NE', label: '🇳🇪 Niger' }, { value: 'CD', label: '🇨🇩 RDC' },
];

export default function ProfilCreateurPage() {
  const [profil, setProfil]   = useState<any>(null);
  const [createurId, setId]   = useState(''); // PK du modèle Createur
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { refreshUser } = useAuth();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const set = (k: string, v: any) => setProfil((p: any) => ({ ...p, [k]: v }));

  // Charger via /createurs/mon-profil (utilise utilisateurId du token)
  useEffect(() => {
    createurApi.getMonProfil()
      .then((data: any) => {
        setProfil(data);
        setId(data.id); // PK du modèle Createur
      })
      .catch(e => showToast('❌ Profil introuvable : ' + e.message));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!createurId || !profil) return;
    setSaving(true);
    try {
      if (selectedPhotoFile) {
        const fd = new FormData();
        fd.append('photo', selectedPhotoFile);
        const res = await fetch(`${BASE}/api/createurs/${createurId}/photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        // Mettre à jour l'url en local
        profil.photoProfilUrl = json.data?.photoProfilUrl ?? json.data;
        setSelectedPhotoFile(null);
      }

      await createurApi.updateProfil(createurId, {
        nom: profil.nom, handle: profil.handle, bio: profil.bio,
        pays: profil.pays, reseaux: profil.reseaux,
        numeroOrangeMoney: profil.numeroOrangeMoney,
        numeroFreeMoney: profil.numeroFreeMoney,
      });
      await refreshUser();
      showToast('✅ Profil enregistré !');
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  const toggleNiche = async (niche: string) => {
    if (!createurId) return;
    const niches: string[] = profil?.niches?.map((n: any) => n.niche) || [];
    try {
      if (niches.includes(niche)) {
        await createurApi.supprimerNiche(createurId, niche);
        setProfil((p: any) => ({ ...p, niches: p.niches.filter((n: any) => n.niche !== niche) }));
      } else {
        await createurApi.ajouterNiche(createurId, niche);
        setProfil((p: any) => ({ ...p, niches: [...(p.niches || []), { niche }] }));
      }
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  if (!profil) return (
    <DashboardCreateur>
        <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
          Chargement du profil…
        </div>
      </DashboardCreateur>
  );

  const niches: string[] = profil.niches?.map((n: any) => n.niche) || [];

  return (
    <DashboardCreateur>
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">
            {toast}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="mb-2">
            <h1 className="font-display text-3xl font-bold text-emerald-600">Mon profil</h1>
            <p className="text-gray-500 mt-1 text-sm">Complétez votre profil pour attirer plus de marques</p>
          </div>

          {/* Photo + infos de base */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 mb-2">Informations générales</h2>
            <div className="flex items-start gap-5">
              <button onClick={() => fileRef.current?.click()}
                className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border-2 border-emerald-200 flex-shrink-0">
                {(previewUrl || profil.photoProfilUrl)
                  ? <img src={previewUrl || getImageUrl(profil.photoProfilUrl)} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs">Modifier</span>
                </div>
              </button>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</label>
                  <input value={profil.nom || ''} onChange={e => set('nom', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Votre nom" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Handle</label>
                  <input value={profil.handle || ''} onChange={e => set('handle', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="@votre.handle" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio</label>
              <textarea rows={3} value={profil.bio || ''} onChange={e => set('bio', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Décrivez votre univers créatif…" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pays</label>
              <select value={profil.pays || 'SN'} onChange={e => set('pays', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Niches */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Mes niches</h2>
            <p className="text-xs text-gray-400 mb-4">Domaines qui correspondent à votre contenu</p>
            <div className="flex flex-wrap gap-2">
              {NICHES_DISPONIBLES.map(niche => {
                const active = niches.includes(niche);
                return (
                  <button key={niche} onClick={() => toggleNiche(niche)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift ${
                      active ? 'bg-emerald-600 text-white shadow-bento' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {niche}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Réseaux sociaux</h2>
            <div className="space-y-3">
              {RESEAUX.map(reseau => {
                const val = profil.reseaux?.[reseau] || {};
                return (
                  <div key={reseau} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-24 flex-shrink-0">{reseau}</span>
                    <input value={val.handle || ''}
                      onChange={e => setProfil((p: any) => ({
                        ...p, reseaux: { ...p.reseaux, [reseau]: { ...val, handle: e.target.value } }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="@handle" />
                    <input type="number" value={val.audience || ''}
                      onChange={e => setProfil((p: any) => ({
                        ...p, reseaux: { ...p.reseaux, [reseau]: { ...val, audience: parseInt(e.target.value) || 0 } }
                      }))}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                      className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Audience" min={0} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Money */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Paiement mobile</h2>
            <p className="text-xs text-gray-400 mb-4">Numéros pour recevoir vos rémunérations</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Orange Money</label>
                <input value={profil.numeroOrangeMoney || ''} onChange={e => set('numeroOrangeMoney', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="+221 77 000 0000" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Free Money</label>
                <input value={profil.numeroFreeMoney || ''} onChange={e => set('numeroFreeMoney', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="+221 76 000 0000" />
              </div>
            </div>
          </div>

          <ChangePasswordForm />

          <button onClick={handleSave} disabled={saving || !createurId}
            className="w-full py-3.5 bg-gradient-emerald hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift">
            {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
          </button>
        </div>
      </DashboardCreateur>
  );
}
