'use client';
import { useEffect, useState } from 'react';
import DashboardAdmin from '@/components/layout/DashboardAdmin';
import { adminApi, formatFCFA, type Transaction, type TypeTransaction } from '@/lib/api';

const TYPES: { value: TypeTransaction | ''; label: string }[] = [
  { value: '', label: 'Tous les types' },
  { value: 'RECHARGE', label: 'Recharge' },
  { value: 'DEBIT_CAMPAGNE', label: 'Débit campagne' },
  { value: 'REMBOURSEMENT', label: 'Remboursement' },
  { value: 'PAIEMENT_CREATEUR', label: 'Paiement créateur' },
];

const TYPE_STYLE: Record<string, string> = {
  RECHARGE:          'bg-emerald-50 text-emerald-700',
  REMBOURSEMENT:      'bg-emerald-50 text-emerald-700',
  DEBIT_CAMPAGNE:      'bg-red-50 text-red-700',
  PAIEMENT_CREATEUR:  'bg-red-50 text-red-700',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TypeTransaction | ''>('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const query: Record<string, string> = { page: String(page), limit: '30' };
      if (type) query.type = type;
      const d = await adminApi.getTransactions(query);
      setTransactions(d.transactions || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, type]);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  return (
    <DashboardAdmin title="Transactions" subtitle="Traçabilité complète des mouvements de solde des entreprises">
      <div className="bg-white rounded-3xl shadow-card p-6">
        {/* Filtre */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as TypeTransaction | ''); setPage(1); }}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Entreprise</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Solde après</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Chargement...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucune transaction trouvée.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-xs">{fmtDate(t.dateTransaction)}</td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{t.entreprise?.nom || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${TYPE_STYLE[t.type] || 'bg-gray-50 text-gray-700'}`}>
                        {TYPES.find(x => x.value === t.type)?.label || t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{formatFCFA(Number(t.montant))}</td>
                    <td className="py-3 px-4 text-gray-500">{formatFCFA(Number(t.soldeApres))}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate" title={t.description}>{t.description || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Total : {total} transactions</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              disabled={transactions.length < 30}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </DashboardAdmin>
  );
}
