import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Star, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceReviewsProps {
  serviceId: string;
}

export const ServiceReviews = ({ serviceId }: ServiceReviewsProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });
  const [limitCount, setLimitCount] = useState(5);

  useEffect(() => {
    // Only fetch active (approved) reviews
    const q = query(
      collection(db, 'reviews'),
      where('serviceId', '==', serviceId),
      where('status', '==', 'approved'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side
      revs.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });
      setReviews(revs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serviceId, limitCount]);

  useEffect(() => {
    // Fetch all for stats (in a real app, you might want to use aggregation queries or a cloud function)
    const statsQuery = query(
      collection(db, 'reviews'),
      where('serviceId', '==', serviceId),
      where('status', '==', 'approved')
    );

    const unsubStats = onSnapshot(statsQuery, (snap) => {
      const allRevs = snap.docs.map(d => d.data());
      const total = allRevs.length;
      if (total === 0) {
        setStats({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });
        return;
      }

      const sum = allRevs.reduce((acc, r) => acc + (r.rating || 0), 0);
      const dist = [0, 0, 0, 0, 0];
      allRevs.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
      });

      setStats({
        average: sum / total,
        total,
        distribution: dist
      });
    });

    return () => unsubStats();
  }, [serviceId]);

  if (loading && reviews.length === 0) {
    return <div className="py-10 text-center text-slate-400 font-medium">Cargando reseñas...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-10 text-center">
        <h4 className="text-xl font-black text-slate-300 font-h1 italic">Aún no hay reseñas</h4>
        <p className="text-sm text-slate-400 mt-2">¡Sé la primera en compartir tu experiencia!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Stats Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center bg-pink-50/30 p-8 rounded-[32px]">
        <div className="text-center md:text-left flex flex-col items-center md:items-start shrink-0">
           <p className="text-6xl font-black text-slate-800 tracking-tighter">{stats.average.toFixed(1)}</p>
           <div className="flex items-center gap-1 my-2 text-yellow-400">
             {[1, 2, 3, 4, 5].map(star => (
               <Star key={star} size={20} className={star <= Math.round(stats.average) ? 'fill-current' : 'text-slate-200 fill-slate-200'} />
             ))}
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.total} Reseña{stats.total !== 1 && 's'}</p>
        </div>

        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.distribution[star - 1];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 w-4">{star}</span>
                <Star size={12} className="text-yellow-400 fill-current shrink-0" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map(review => {
          const firstName = review.userName ? review.userName.split(' ')[0] : 'Clienta';
          const dateStr = review.createdAt?.toDate ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: es }) : 'hace poco';
          const hasPhotos = review.isPublic && (review.photoBeforeUrl || review.photoAfterUrl);

          return (
            <div key={review.id} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-pink-50 transition-colors shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt={firstName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-primary flex items-center justify-center font-black text-sm">
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700 text-sm">{firstName}</p>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                         <CheckCircle size={10} /> Visita Verificada
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 text-yellow-400">
                        {[1, 2, 3, 4, 5].map(star => (
                           <Star key={star} size={10} className={star <= review.rating ? 'fill-current' : 'text-slate-200 fill-slate-200'} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.comment}</p>

              {hasPhotos && (
                <div className="flex gap-4">
                   {review.photoBeforeUrl && (
                     <div className="relative group cursor-pointer" onClick={() => window.open(review.photoBeforeUrl, '_blank')}>
                       <img src={review.photoBeforeUrl} alt="Antes" className="w-24 h-24 object-cover rounded-2xl border border-slate-100 shadow-sm" />
                       <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full backdrop-blur-sm">Antes</span>
                     </div>
                   )}
                   {review.photoAfterUrl && (
                     <div className="relative group cursor-pointer" onClick={() => window.open(review.photoAfterUrl, '_blank')}>
                       <img src={review.photoAfterUrl} alt="Después" className="w-24 h-24 object-cover rounded-2xl border border-pink-100 shadow-sm" />
                       <span className="absolute bottom-2 left-2 bg-primary/80 text-white text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full backdrop-blur-sm">Después</span>
                     </div>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stats.total > limitCount && (
        <div className="text-center pt-4">
          <button 
            onClick={() => setLimitCount(prev => prev + 5)}
            className="px-8 py-3 rounded-full border-2 border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
          >
            Ver más reseñas
          </button>
        </div>
      )}
    </div>
  );
};
