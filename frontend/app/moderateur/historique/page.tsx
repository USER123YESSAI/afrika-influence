'use client';
import { useEffect, useState } from 'react';
import DashboardModerateur from '@/components/layout/DashboardModerateur';
import { moderateurApi } from '@/lib/api';

export default function ModerateurHistoriquePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const d: any = await moderateurApi.getHistorique({ page: page.toString(), limit: '30' });
      setLogs(d.actions || []);
      setTotal(d.total || 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  return (
    <DashboardModerateur title="Mon Historique" subtitle="Historique de vos actions de modération">
      <div className="bg-white rounded-3xl shadow-card p-6">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type d'Action</th>
                <th className="py-3 px-4">Cible</th>
                <th className="py-3 px-4">Détails de l'intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400">Chargement...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400">Aucune action enregistrée pour le moment.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-xs">{fmtDate(log.dateAction)}</td>
                    <td className="py-3 px-4 font-medium text-violet-700">
                      <span className="bg-violet-50 px-2 py-1 rounded-lg text-xs">{log.typeAction}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {log.entiteCible ? `${log.entiteCible} (${log.idEntiteCible})` : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-sm truncate" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination logic if needed, simple prev/next for now */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Total : {total} actions</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button 
              disabled={logs.length < 30} 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </DashboardModerateur>
  );
}
