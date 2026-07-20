'use client';
import { useEffect, useState } from 'react';
import DashboardEntreprise from '@/components/layout/DashboardEntreprise';
import AuthGuard from '@/components/auth/AuthGuard';
import { soldeApi, getMonProfilEntreprise, formatFCFA, type Transaction } from '@/lib/api';

const TYPE_LABELS: Record<string, { label: string; color: string; signe: '+' | '-' }> = {
  RECHARGE:           { label: 'Recharge',              color: 'text-brand-600', signe: '+' },
  REMBOURSEMENT:       { label: 'Remboursement',         color: 'text-brand-600', signe: '+' },
  DEBIT_CAMPAGNE:      { label: 'Publication campagne',  color: 'text-red-600',     signe: '-' },
  PAIEMENT_CREATEUR:   { label: 'Paiement créateur',     color: 'text-red-600',     signe: '-' },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function SoldePage() {
  const [solde, setSolde] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [montant, setMontant] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const charger = () => {
    setLoading(true);
    Promise.all([getMonProfilEntreprise(), soldeApi.historique()])
      .then(([e, h]) => { setSolde(Number(e.solde ?? 0)); setTransactions(h.transactions); })
      .catch(e => showToast('❌ ' + e.message))
      .finally(() => setLoading(false));
  };

  useEffect(charger, []);

  const handleRecharger = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(montant);
    if (!val || val <= 0) return showToast('❌ Montant invalide.');
    setRecharging(true);
    try {
      await soldeApi.recharger(val);
      setMontant('');
      showToast('✅ Compte rechargé (simulation).');
      charger();
    } catch (err: any) {
      showToast('❌ ' + err.message);
    } finally {
      setRecharging(false);
    }
  };

  return (
    <AuthGuard roles={['ENTREPRISE', 'PARTICULIER']}>
      <DashboardEntreprise>
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50">
            {toast}
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="font-display text-2xl font-bold text-brand-600">Mon solde</h1>

          {/* Solde actuel */}
          <div className="bg-white rounded-3xl shadow-bento p-6">
            <p className="text-sm text-gray-500 mb-1">Solde disponible</p>
            <p className="font-display text-4xl font-bold text-gray-900">
              {loading ? '—' : formatFCFA(solde ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Ce solde est débité à la publication de chaque campagne et remboursé si elle est annulée avant qu'un créateur n'y travaille. Transactions simulées, aucun paiement réel.
            </p>
          </div>

          {/* Recharger */}
          <div className="bg-white rounded-3xl shadow-bento p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recharger mon compte</h2>
            <form onSubmit={handleRecharger} className="flex gap-3">
              <input
                type="number"
                min="1"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                placeholder="Montant en FCFA"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={recharging}
                className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {recharging ? 'Rechargement…' : 'Recharger'}
              </button>
            </form>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-3xl shadow-bento overflow-hidden">
            <h2 className="font-semibold text-gray-900 p-6 pb-4">Historique des transactions</h2>
            {loading ? (
              <p className="text-center text-gray-400 py-10">Chargement…</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Aucune transaction pour l'instant.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map(t => {
                  const meta = TYPE_LABELS[t.type] ?? { label: t.type, color: 'text-gray-700', signe: '+' as const };
                  return (
                    <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-400">{t.description}</p>
                        <p className="text-xs text-gray-300 mt-0.5">{fmtDate(t.dateTransaction)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold ${meta.color}`}>
                          {meta.signe}{formatFCFA(Number(t.montant))}
                        </p>
                        <p className="text-xs text-gray-400">solde : {formatFCFA(Number(t.soldeApres))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardEntreprise>
    </AuthGuard>
  );
}
