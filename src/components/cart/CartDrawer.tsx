import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore, selectSubtotal, selectDiscountAmount, selectTotal } from '../../stores/cartStore';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase'; // Adjust to wherever firebase is initialized, likely src/lib/firebase

export const CartDrawer = ({ onNavigateCheckout }: { onNavigateCheckout: () => void }) => {
  const { 
    items, 
    isDrawerOpen, 
    closeDrawer, 
    removeItem, 
    updateQuantity, 
    promoCode, 
    applyPromo, 
    removePromo,
    discount
  } = useCartStore();
  
  const subtotal = useCartStore(selectSubtotal);
  const discountAmount = useCartStore(selectDiscountAmount);
  const total = useCartStore(selectTotal);
  
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    
    try {
      const q = query(
        collection(db, 'promotions'), 
        where('code', '==', promoInput.trim().toUpperCase()),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setPromoError('Código inválido o inactivo');
        setIsApplyingPromo(false);
        return;
      }
      
      const promo = snapshot.docs[0].data();
      
      // Check expiration if it exists
      if (promo.endDate && new Date(promo.endDate.toDate()) < new Date()) {
        setPromoError('Este código ha expirado');
        setIsApplyingPromo(false);
        return;
      }
      
      applyPromo(promo.code, promo.discountPercent || promo.discount);
      setPromoInput('');
    } catch (e) {
      setPromoError('Error al validar el código');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckoutClick = () => {
    closeDrawer();
    onNavigateCheckout();
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]"
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col border-l border-pink-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-pink-50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <ShoppingBag className="text-pink-500" />
                Tu Carrito
              </h2>
              <button 
                onClick={closeDrawer}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-pink-300 mb-4">
                    <ShoppingBag size={48} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Tu carrito está vacío</h3>
                  <p className="text-slate-500 text-sm">¡Descubre nuestros productos y consiéntete!</p>
                  <button 
                    onClick={closeDrawer}
                    className="mt-4 px-6 py-3 bg-pink-100 text-pink-600 font-bold rounded-2xl hover:bg-pink-200 transition-colors"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-pink-50 flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={24} className="text-pink-200" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-2 pr-4">{item.name}</h4>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-pink-50">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-primary transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-primary transition-colors disabled:opacity-50"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="font-black text-primary italic font-h1">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-pink-100 p-6 bg-slate-50/50 space-y-6">
                {/* Promo Code section */}
                {!promoCode ? (
                  <div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Código de descuento"
                        className="flex-1 px-4 py-3 rounded-2xl border border-pink-100 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      />
                      <button 
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoInput.trim()}
                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {isApplyingPromo ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-2 font-medium px-2">{promoError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cupón aplicado</span>
                      <span className="font-bold text-emerald-800">{promoCode} (-{discount}%)</span>
                    </div>
                    <button onClick={removePromo} className="text-emerald-600 hover:text-emerald-800 p-1">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {/* Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                      <span>Descuento</span>
                      <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-3">
                    <span className="font-black text-slate-800 text-lg uppercase tracking-wider">Total</span>
                    <span className="font-black text-primary text-xl italic font-h1">{formatCurrency(total)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckoutClick}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-200 transition-all active:scale-[0.98]"
                >
                  Ir a pagar <ArrowRight size={20} />
                </button>
              </div>
            )}
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
