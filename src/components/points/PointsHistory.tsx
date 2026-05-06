import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { Star, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PointLog {
  id: string;
  points: number;
  type: 'earned' | 'redeemed';
  reason: string;
  createdAt: any;
}

export const PointsHistory = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (useLastDoc = false) => {
    if (!user) return;
    setLoading(true);
    try {
      let q = query(
        collection(db, 'points_logs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (useLastDoc && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointLog));

      if (docs.length < 10) {
        setHasMore(false);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (useLastDoc) {
        setLogs(prev => [...prev, ...docs]);
      } else {
        setLogs(docs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
        <Star className="text-primary" size={20} fill="currentColor" />
        Historial de Puntos
      </h3>

      {logs.length === 0 && !loading ? (
        <div className="text-center py-10 text-slate-400">
          No tienes movimientos de puntos aún.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="flex items-start justify-between p-4 rounded-2xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.type === 'earned' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {log.type === 'earned' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.reason}</p>
                  <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium mt-1">
                    {log.createdAt ? format(log.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Reciente'}
                  </p>
                </div>
              </div>
              <div className={`font-black tracking-tight ${log.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {log.type === 'earned' ? '+' : '-'}{log.points} pts
              </div>
            </div>
          ))}
          
          {hasMore && (
            <button 
              onClick={() => fetchLogs(true)}
              disabled={loading}
              className="w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar Más'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
