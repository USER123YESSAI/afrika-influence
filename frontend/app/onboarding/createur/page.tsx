'use client';
import { useEffect, useRef, useState } from 'react';
import { createurApi, NICHES_DISPONIBLES, RESEAUX, getToken, getImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PAYS_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' }, { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'CM', label: '🇨🇲 Cameroun' }, { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' }, { value: 'GN', label: '🇬🇳 Guinée' },
  { value: 'TG', label: '🇹🇬 Togo' }, { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'NE', label: '🇳🇪 Niger' }, { value: 'CD', label: '🇨🇩 RDC' },
];

import { ArrowLeft } from 'lucide-react';

export default function OnboardingCreateurPage() {
  const [profil, setProfil]   = useState<any>(null);
  const [createurId, setId]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const set = (k: string, v: any) => setProfil((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (user?.profilComplet) {
      router.replace('/createur/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    createurApi.getMonProfil()
      .then((data: any) => {
        let res = data.reseaux;
        if (typeof res === 'string') {
          try { res = JSON.parse(res); } catch { res = {}; }
        }
        setProfil({ ...data, reseaux: res || {} });
        setId(data.id);
      })
      .catch(e => showToast('❌ Profil introuvable : ' + e.message));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImgError(false);
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
      router.push('/createur/dashboard');
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
    <AuthGuard roles={['CREATEUR']}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
          Chargement du profil…
        </div>
      </div>
    </AuthGuard>
  );

  const niches: string[] = profil.niches?.map((n: any) => n.niche) || [];

  return (
    <AuthGuard roles={['CREATEUR']}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 relative">
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="max-w-3xl mx-auto mt-8">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">Bienvenue sur Afrika Influence ! </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Pour accéder à votre espace et commencer à collaborer avec des marques, veuillez compléter votre profil. C'est votre vitrine !
            </p>
          </div>

          {toast && (
            <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">
              {toast}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          <div className="space-y-6">
            {/* Photo + infos de base */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-8 space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2">1. Informations générales</h2>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <button onClick={() => fileRef.current?.click()}
                  className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-brand-50 border-2 border-brand-200 flex-shrink-0 mx-auto sm:mx-0">
<<<<<<< Updated upstream
                  {(previewUrl || profil.photoProfilUrl)
                    ? <img src={previewUrl || getImageUrl(profil.photoProfilUrl)} alt="" className="w-full h-full object-cover" />
=======
                  {(previewUrl || profil.photoProfilUrl) && !imgError
                    ? <img
                        src={previewUrl || getImageUrl(profil.photoProfilUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
>>>>>>> Stashed changes
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📸</div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-semibold">Modifier</span>
                  </div>
                </button>
                <div className="flex-1 w-full space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</label>
                      <input value={profil.nom || ''} onChange={e => set('nom', e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        placeholder="Votre nom" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio courte</label>
                    <textarea rows={3} value={profil.bio || ''} onChange={e => set('bio', e.target.value)}
                      className="w-full mt-1.5 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                      placeholder="Décrivez votre univers créatif en quelques mots…" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pays de résidence</label>
                    <select value={profil.pays || 'SN'} onChange={e => set('pays', e.target.value)}
                      className="w-full mt-1.5 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                      {PAYS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Niches */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-8">
              <h2 className="font-semibold text-gray-900 mb-1">2. Vos centres d'intérêt</h2>
              <p className="text-sm text-gray-500 mb-6">Sélectionnez les domaines qui correspondent le mieux à votre contenu.</p>
              <div className="flex flex-wrap gap-2.5">
                {NICHES_DISPONIBLES.map(niche => {
                  const active = niches.includes(niche);
                  return (
                    <button key={niche} onClick={() => toggleNiche(niche)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all hover-lift ${
                        active ? 'bg-brand-600 text-white shadow-bento' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}>
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-8">
              <h2 className="font-semibold text-gray-900 mb-1">3. Vos Réseaux sociaux</h2>
              <p className="text-sm text-gray-500 mb-6">Sélectionnez les réseaux sociaux sur lesquels vous êtes actif.</p>
              <div className="flex flex-wrap gap-2.5">
                {RESEAUX.map(reseau => {
                  const active = !!(profil.reseaux && profil.reseaux[reseau]);
                  return (
                    <button key={reseau} onClick={() => {
                      setProfil((p: any) => {
                        const newReseaux = { ...(p.reseaux || {}) };
                        if (newReseaux[reseau]) delete newReseaux[reseau];
                        else newReseaux[reseau] = { handle: '' };
                        return { ...p, reseaux: newReseaux };
                      });
                    }}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all hover-lift ${
                        active ? 'bg-brand-600 text-white shadow-bento' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}>
                      {reseau}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6">
              <button onClick={handleSave} disabled={saving || !createurId}
                className="w-full py-4 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift text-lg">
                {saving ? 'Enregistrement en cours…' : 'Accéder à mon espace créateur '}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
