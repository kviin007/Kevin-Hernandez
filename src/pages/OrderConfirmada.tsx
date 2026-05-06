import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';

export const OrderConfirmada = ({ orderId, setView }: { orderId: string, setView: (v: string) => void }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-20 px-4">
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="w-32 h-32 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-8 relative border-8 border-white shadow-xl"
      >
        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
        <CheckCircle2 size={64} className="relative z-10" />
      </motion.div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-lg"
      >
        <h1 className="text-5xl font-black text-slate-800 font-h1 italic mb-4">¡Pago Exitoso!</h1>
        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
          Tu orden ha sido confirmada y ya estamos preparándola. Te enviamos un correo con los detalles.
        </p>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 mb-10 flex items-center gap-4 justify-center">
          <Package className="text-pink-400" size={24} />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orden No.</p>
            <p className="text-lg font-bold text-slate-800 font-mono">{orderId}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setView('shop')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-200 transition-all hover:-translate-y-1"
          >
            Seguir Comprando <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={() => setView('landing')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
          >
            Volver al Inicio <Home size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
