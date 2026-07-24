'use client';
// frontend/app/reinitialiser-mdp/page.tsx
//
// CORRECTION SÉCURITÉ : cette page envoyait auparavant email + nouveau mot
// de passe directement, sans aucune preuve que la personne possède la boîte
// mail — n'importe qui connaissant l'email d'un compte pouvait donc le
// prendre. Elle ne demande désormais qu'un email ; le lien de confirmation
// (avec le jeton à usage unique) est envoyé par email et traité sur
// /reinitialiser-mdp/confirmer.
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ReinitialisationPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye]   = useState(false);
  const [erreur, setErreur]   = useState('');

  const handleSubmit = async () => {
    if (!email) return setErreur('Merci de renseigner votre email.');
    setLoading(true); setErreur('');
    try {
      await authApi.reinitialiserMdp({ email });
      // Le message est volontairement générique (voir authService côté
      // backend) : on ne révèle jamais si l'email correspond à un compte.
      setEnvoye(true);
    } catch (e: any) {
      setErreur(e.message || 'Une erreur est survenue.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-emerald-600">Afrika Influence Hub</h1>
          <p className="text-gray-600 mt-2">Réinitialisez votre mot de passe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-bento p-8 space-y-4">
          {envoye ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl mx-auto">📧</div>
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
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="vous@exemple.com" autoFocus />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3.5 bg-gradient-emerald hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all shadow-bento hover-lift">
                {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-400 pt-2">
            <Link href="/connexion" className="text-emerald-600 hover:underline font-medium">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
