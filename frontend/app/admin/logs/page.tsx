'use client';
import { useEffect, useState } from 'react';
import DashboardAdmin from '@/components/layout/DashboardAdmin';
import { adminApi } from '@/lib/api';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeAction, setTypeAction] = useState('');
  const [acteurId, setActeurId] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const query: any = { page, limit: 30 };
      if (typeAction) query.typeAction = typeAction;
      if (acteurId) query.acteurId = acteurId;
      
      const d: any = await adminApi.getLogs(query);
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, typeAction, acteurId]);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString('fr-FR') : '—';

  return (
    <DashboardAdmin title="Journal d'audit" subtitle="Traçabilité complète des actions système">
      <div className="bg-white rounded-3xl shadow-card p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Type d'action</label>
            <input 
              type="text" 
              placeholder="Ex: PROFIL_VALIDE, AVERTISSEMENT..." 
              value={typeAction}
              onChange={(e) => { setTypeAction(e.target.value); setPage(1); }}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">ID Acteur</label>
            <input 
              type="text" 
              placeholder="UUID de l'utilisateur..." 
              value={acteurId}
              onChange={(e) => { setActeurId(e.target.value); setPage(1); }}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Acteur</th>
                <th className="py-3 px-4">Cible</th>
                <th className="py-3 px-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Chargement...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Aucun log trouvé.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-xs">{fmtDate(log.dateAction)}</td>
                    <td className="py-3 px-4 font-medium text-brand-700">
                      <span className="bg-brand-50 px-2 py-1 rounded-lg text-xs">{log.typeAction}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {log.acteur?.nom ? (
                        <div className="text-xs">
                          <p className="font-semibold">{log.acteur.nom}</p>
                          <p className="text-gray-400">{log.acteur.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{log.acteurId || 'Système'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {log.entiteCible ? `${log.entiteCible} (${log.idEntiteCible})` : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>
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
          <span className="text-sm text-gray-500">Total : {total} entrées</span>
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
    </DashboardAdmin>
  );
}
