import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { uploadReviewPhoto, createReview } from '../../services/reviewService';
import { useAuth } from '../AuthContext';

interface ReviewModalProps {
  booking: {
    id: string;
    serviceId: string;
    serviceName: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal = ({ booking, isOpen, onClose, onSuccess }: ReviewModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La foto debe ser de máximo 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === 'before') {
      setBeforePhoto(file);
      setBeforePreview(previewUrl);
    } else {
      setAfterPhoto(file);
      setAfterPreview(previewUrl);
    }
  };

  const handleRemovePhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhoto(null);
      setBeforePreview(null);
      if (beforeInputRef.current) beforeInputRef.current.value = '';
    } else {
      setAfterPhoto(null);
      setAfterPreview(null);
      if (afterInputRef.current) afterInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (rating === 0) {
      alert('Por favor selecciona una calificación.');
      return;
    }
    if (comment.length < 20) {
      alert('Por favor cuéntanos un poco más (mínimo 20 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoBeforeUrl = null;
      let photoAfterUrl = null;
      
      const reviewId = crypto.randomUUID();

      if (beforePhoto) {
        photoBeforeUrl = await uploadReviewPhoto(beforePhoto, booking.serviceId, reviewId, 'before');
      }
      if (afterPhoto) {
        photoAfterUrl = await uploadReviewPhoto(afterPhoto, booking.serviceId, reviewId, 'after');
      }

      await createReview({
        id: reviewId,
        userId: user.uid,
        userName: user.displayName || 'Clienta',
        userAvatar: user.photoURL || null,
        serviceId: booking.serviceId,
        bookingId: booking.id,
        rating,
        comment,
        photoBeforeUrl,
        photoAfterUrl,
        isPublic
      });

      alert('¡Gracias por tu reseña! 💖');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Hubo un error al publicar tu reseña. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.95, y: 20 }} 
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-pink-50">
            <div>
              <h2 className="text-2xl font-black text-slate-800 font-h1 italic tracking-tight">¡Nos encanta verte!</h2>
              <p className="text-sm font-medium text-slate-500 italic">¿Cómo fue tu experiencia de {booking.serviceName}?</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            {/* Stars */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={isSubmitting}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-90"
                  >
                    <Star 
                      size={40} 
                      className={`transition-colors ${(hoveredStar || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'}`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {rating === 0 ? 'Selecciona una calificación' : 
                 rating === 1 ? 'Podría mejorar...' : 
                 rating === 2 ? 'Estuvo regular' : 
                 rating === 3 ? 'Estuvo bien' : 
                 rating === 4 ? '¡Muy bien!' : '¡Increíble, me encantó! ✨'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic block">Cuéntanos sobre tu visita...</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Me encantó cómo quedaron mis uñas, el diseño quedó espectacular y la atención fue..."
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-primary disabled:opacity-70 transition-all min-h-[120px] resize-none"
              />
              <p className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comment.length} / 20 mín</p>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic block flex items-center justify-between">
                <span>Fotos (Opcional)</span>
                <span className="text-[9px]">MÁX 5MB X FOTO</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Before Photo */}
                <div className="relative">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Antes</p>
                   {beforePreview ? (
                     <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                       <img src={beforePreview} alt="Antes" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => handleRemovePhoto('before')}
                         className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <div className="bg-white text-red-500 p-2 rounded-full"><X size={20} /></div>
                       </button>
                     </div>
                   ) : (
                     <button 
                       onClick={() => beforeInputRef.current?.click()}
                       disabled={isSubmitting}
                       className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-pink-200 hover:bg-pink-50/50 transition-all"
                     >
                        <ImageIcon size={28} />
                        <span className="text-[10px] font-bold uppercase tracking-widest px-4 text-center">Agregar foto antes</span>
                     </button>
                   )}
                   <input type="file" ref={beforeInputRef} onChange={(e) => handlePhotoSelect(e, 'before')} className="hidden" accept="image/*" />
                </div>

                {/* After Photo */}
                <div className="relative">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Después</p>
                   {afterPreview ? (
                     <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                       <img src={afterPreview} alt="Después" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => handleRemovePhoto('after')}
                         className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <div className="bg-white text-red-500 p-2 rounded-full"><X size={20} /></div>
                       </button>
                     </div>
                   ) : (
                     <button 
                       onClick={() => afterInputRef.current?.click()}
                       disabled={isSubmitting}
                       className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-pink-200 hover:bg-pink-50/50 transition-all"
                     >
                        <Upload size={28} />
                        <span className="text-[10px] font-bold uppercase tracking-widest px-4 text-center">Agregar foto después</span>
                     </button>
                   )}
                   <input type="file" ref={afterInputRef} onChange={(e) => handlePhotoSelect(e, 'after')} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

            {/* Privacy Checkbox */}
            {(beforePreview || afterPreview) && (
              <label className="flex items-start gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl cursor-pointer hover:border-pink-100 transition-colors">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-primary peer-checked:bg-primary transition-colors"></div>
                  <CheckCircle size={14} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Autorizo que mis fotos aparezcan en la galería pública</p>
                  <p className="text-xs text-slate-500 mt-1">Solo se mostrará tu primer nombre y la valoración.</p>
                </div>
              </label>
            )}
          </div>

          <div className="p-6 border-t border-pink-50 bg-slate-50/50">
            <button 
               onClick={handleSubmit}
               disabled={isSubmitting || rating === 0 || comment.length < 20}
               className="w-full btn-primary py-4 text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   PUBLICANDO...
                 </>
              ) : (
                'PUBLICAR RESEÑA'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
