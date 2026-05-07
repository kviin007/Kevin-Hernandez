import React, { useState } from 'react';
import { Calendar, Clock, Star } from 'lucide-react';
import { ReviewModal } from '../reviews/ReviewModal';

interface BookingCardProps {
  booking: any;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewedLocally, setHasReviewedLocally] = useState(false);

  const isCompleted = booking.status === 'completada' || booking.status === 'confirmed'; // Depending on the data structure used
  const canReview = isCompleted && !booking.reviewId && !hasReviewedLocally;

  return (
    <div className="bg-white rounded-[32px] p-6 border border-pink-50 shadow-sm transition-all hover:border-pink-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-black text-slate-800 text-lg font-h1 italic">{booking.serviceName}</h3>
          <p className="text-[10px] font-bold text-slate-400 pos-right uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
             <Calendar size={12} /> {booking.date}
          </p>
        </div>
        <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full ${
          isCompleted ? 'bg-emerald-100 text-emerald-600' : 
          booking.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {isCompleted ? 'Completada' : booking.status === 'pending' ? 'Pendiente' : booking.status}
        </span>
      </div>

      {canReview && (
        <div className="mt-6 bg-pink-50/50 p-5 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-pink-600">
             <Star size={20} className="fill-current" />
             <div>
               <p className="text-sm font-black italic">¿Cómo quedaron tus uñas?</p>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">¡Cuéntanos tu experiencia! 💅</p>
             </div>
          </div>
          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-white border border-pink-200 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all whitespace-nowrap shadow-sm"
          >
            Dejar reseña
          </button>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={booking}
        onSuccess={() => setHasReviewedLocally(true)}
      />
    </div>
  );
};
