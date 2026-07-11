'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import { getMonProfilEntreprise, updateEntreprise, getToken, type Entreprise } from '@/lib/api';

const SECTEURS = ['MODE', 'BEAUTE', 'TECH', 'AGROALIMENTAIRE', 'SANTE', 'FINANCE', 'EDUCATION', 'TOURISME', 'AUTRE'];
const PAYS     = ['SENEGAL', 'COTE_DIVOIRE', 'CAMEROUN', 'MALI', 'BURKINA_FASO', 'GUINEE', 'TOGO', 'BENIN', 'NIGER', 'RDC', 'AUTRE'];
const PAYS_LABELS: Record<string, string> = {
  SENEGAL: 'Sénégal', COTE_DIVOIRE: "Côte d'Ivoire", CAMEROUN: 'Cameroun',
  MALI: 'Mali', BURKINA_FASO: 'Burkina Faso', GUINEE: 'Guinée',
  TOGO: 'Togo', BENIN: 'Bénin', NIGER: 'Niger', RDC: 'RD Congo', AUTRE: 'Autre',
};

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProfilEntreprisePage() {
  const [form, setForm]         = useState<Partial<Entreprise>>({});
  const [entrepriseId, setId]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]       = useState('');
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE}${url}`;
  };

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const set = (k: keyof Entreprise, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    getMonProfilEntreprise()
      .then(e => { setForm(e); setId(e.id); })
      .catch(e => showToast('❌ Profil introuvable : ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!entrepriseId) return;
    setSaving(true);
    try {
      if (selectedLogoFile) {
        const fd = new FormData();
        fd.append('logo', selectedLogoFile);
        const res = await fetch(`${BASE}/api/entreprises/${entrepriseId}/logo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        form.logoUrl = json.data?.logoUrl ?? json.data;
        setSelectedLogoFile(null);
      }

      await updateEntreprise(entrepriseId, form);
      showToast('✅ Profil mis à jour avec succès');
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  const handleLogoChange = (file: File) => {
    setSelectedLogoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <DashboardEntreprise title="Mon profil" subtitle="Complétez vos informations pour gagner la confiance des créateurs">
      {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-fade-in">{toast}</div>}

      {loading ? (
        <div className="page-container space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 card animate-pulse" />)}</div>
      ) : (
        <div className="page-container space-y-6">
          {/* Logo */}
          <div className="card flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border flex items-center justify-center flex-shrink-0">
              {(previewUrl || form.logoUrl)
                ? <img src={previewUrl || getImageUrl(form.logoUrl!)} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-3xl text-gray-300">🏢</span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Logo de votre marque</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary">
                {uploading ? 'Upload…' : '📤 Changer le logo'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="card space-y-5">
            <h2 className="font-semibold text-gray-900">Informations générales</h2>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom *</label>
              <input type="text" value={form.nom ?? ''} onChange={e => set('nom', e.target.value)} required className="input-base mt-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Secteur</label>
                <select value={form.secteur ?? ''} onChange={e => set('secteur', e.target.value)} className="input-base mt-1.5">
                  <option value="">— Choisir —</option>
                  {SECTEURS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pays</label>
                <select value={form.pays ?? ''} onChange={e => set('pays', e.target.value)} className="input-base mt-1.5">
                  <option value="">— Choisir —</option>
                  {PAYS.map(p => <option key={p} value={p}>{PAYS_LABELS[p]}</option>)}
                </select>
              </div>
            </div>

            {form.secteur === 'AUTRE' && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Précisez votre secteur</label>
                <input type="text" value={form.secteurPersonnalise ?? ''} onChange={e => set('secteurPersonnalise', e.target.value)} className="input-base mt-1.5" />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
              <textarea rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value)} className="input-base mt-1.5 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Site web</label>
                <input type="url" value={form.siteWeb ?? ''} onChange={e => set('siteWeb', e.target.value)} className="input-base mt-1.5" placeholder="https://monsite.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</label>
                <input type="tel" value={form.telephone ?? ''} onChange={e => set('telephone', e.target.value)} className="input-base mt-1.5" placeholder="+221 77 000 00 00" />
              </div>
            </div>

            <button type="submit" disabled={saving || !entrepriseId} className="btn-primary w-full py-3">
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </form>
        </div>
      )}
    </DashboardEntreprise>
  );
}
