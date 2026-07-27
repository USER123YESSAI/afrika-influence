'use client';
// frontend/app/reinitialiser-mdp/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ReinitialisationPage() {
  const [form, setForm]       = useState({ email: '', nouveauMotDePasse: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ msg: '', ok: true });

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast({ msg: '', ok: true }), 4000); };

  const handleSubmit = async () => {
    if (!form.email || !form.nouveauMotDePasse)
      return showToast('Tous les champs sont requis.', false);
    if (form.nouveauMotDePasse !== form.confirm)
      return showToast('Les mots de passe ne correspondent pas.', false);
    if (form.nouveauMotDePasse.length < 8)
      return showToast('Le mot de passe doit contenir au moins 8 caractères.', false);

    setLoading(true);
    try {
      await authApi.reinitialiserMdp({ email: form.email, nouveauMotDePasse: form.nouveauMotDePasse });
      showToast('✅ Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      setForm({ email: '', nouveauMotDePasse: '', confirm: '' });
    } catch (e: any) {
      showToast(e.message, false);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">

      {toast.msg && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-xl shadow-lg text-sm z-50 text-white ${toast.ok ? 'bg-brand-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
<<<<<<< Updated upstream
          <h1 className="font-display text-4xl font-bold text-brand-600">Afrika Influence Hub</h1>
=======
          <h1 className="font-display text-4xl font-bold text-brand-900">Afrika Influence Hub</h1>
>>>>>>> Stashed changes
          <p className="text-gray-600 mt-2">Réinitialisez votre mot de passe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-bento p-8 space-y-4">
<<<<<<< Updated upstream
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email du compte</label>
            <input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="vous@exemple.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nouveau mot de passe</label>
            <input type="password" value={form.nouveauMotDePasse} onChange={e => setF('nouveauMotDePasse', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="8 caractères minimum" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmer le mot de passe</label>
            <input type="password" value={form.confirm} onChange={e => setF('confirm', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Répétez le mot de passe" />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 bg-gradient-brand hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift">
            {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            <Link href="/connexion" className="text-brand-600 hover:underline font-medium">← Retour à la connexion</Link>
=======
          {envoye ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl mx-auto">📧</div>
              <p className="text-gray-700">
                Si un compte existe avec l'adresse <span className="font-medium">{email}</span>, un lien de réinitialisation vient de lui être envoyé.
              </p>
              <p className="text-sm text-gray-400">Pensez à vérifier vos spams. Le lien expire dans 30 minutes.</p>
              <Link href="/connexion" className="btn-primary inline-flex w-full justify-center">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {erreur && <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{erreur}</div>}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email du compte</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="vous@exemple.com" autoFocus />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 bg-brand-900 hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift">
                {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-400 pt-2">
            <Link href="/connexion" className="text-brand-700 hover:underline font-medium">← Retour à la connexion</Link>
>>>>>>> Stashed changes
          </p>
        </div>
      </div>
    </div>
  );
}
