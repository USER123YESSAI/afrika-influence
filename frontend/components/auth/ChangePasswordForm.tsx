'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordForm() {
  const { logout } = useAuth();
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (nouveauMotDePasse !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSaving(true);
    try {
      await authApi.changerMdp({ ancienMotDePasse, nouveauMotDePasse });
      setSuccess('Mot de passe modifié avec succès ! Veuillez vous reconnecter.');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmation('');
      
      // Auto-logout after 3 seconds so they log in with the new password
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-bento p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
          <Lock size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Sécurité</h2>
          <p className="text-xs text-gray-400">Modifier votre mot de passe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-brand-50 text-brand-600 text-sm border border-brand-100 animate-fade-in">
            {success}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ancien mot de passe</label>
          <input 
            type="password" 
            value={ancienMotDePasse} 
            onChange={e => setAncienMotDePasse(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="••••••••" 
            required 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nouveau mot de passe</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={nouveauMotDePasse} 
              onChange={e => setNouveauMotDePasse(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
              placeholder="••••••••" 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[28px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmer le nouveau</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={confirmation} 
              onChange={e => setConfirmation(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••" 
              required 
            />
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={saving || !ancienMotDePasse || !nouveauMotDePasse || !confirmation}
            className="px-6 py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50 font-medium rounded-xl transition-colors text-sm"
          >
            {saving ? 'Modification...' : 'Mettre à jour le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}
