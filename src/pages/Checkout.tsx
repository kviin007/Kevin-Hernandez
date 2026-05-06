import React, { useState } from 'react';
import { useCartStore, selectSubtotal, selectDiscountAmount, selectTotal } from '../stores/cartStore';
import { ArrowLeft, MapPin, Truck, Store, ShieldCheck, Star } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { WompiCheckout } from '../components/checkout/WompiCheckout'; // Verify path
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const Checkout = ({ setView, onPaymentSuccess }: { setView: (v: string) => void, onPaymentSuccess: (orderId: string) => void }) => {
  const { user } = useAuth();
  const { items, clearCart, pointsToRedeem } = useCartStore();
  
  const subtotal = useCartStore(selectSubtotal);
  const discountAmount = useCartStore(selectDiscountAmount);
  const total = useCartStore(selectTotal);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 mb-6">Tu carrito está vacío.</p>
        <button onClick={() => setView('shop')} className="btn-primary">Volver a la tienda</button>
      </div>
    );
  }

  const handleWompiSuccess = async (txInfo: any) => {
    setIsProcessing(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      
      // Deduct points first
      if (pointsToRedeem > 0) {
        const functions = getFunctions();
        const redeemPointsFn = httpsCallable(functions, 'redeemPoints');
        await redeemPointsFn({ pointsToRedeem, orderId: orderRef.id });
      }

      await setDoc(orderRef, {
        userId: user?.uid || 'guest',
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || ''
        })),
        total,
        subtotal,
        discount: discountAmount,
        pointsRedeemed: pointsToRedeem,
        deliveryMethod,
        address: deliveryMethod === 'delivery' ? address : null,
        phone,
        notes,
        status: 'pagado',
        transactionId: txInfo.id || 'N/A',
        paymentMethod: txInfo.paymentMethod || 'Wompi',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      clearCart();
      onPaymentSuccess(orderRef.id);
    } catch (e) {
      console.error(e);
      setError('Error al registrar la orden. Por favor contáctanos con tu comprobante.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    if (!phone) return false;
    if (deliveryMethod === 'delivery' && !address) return false;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <button 
        onClick={() => setView('shop')}
        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Volver a la tienda
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg">
          <ShieldCheck className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 font-h1 tracking-tight italic">Finalizar Pedido</h2>
          <p className="text-slate-500 text-sm">Pago seguro procesado por Wompi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column - Form */}
        <div className="space-y-8">
          {/* Delivery Method */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-bl-[100px] opacity-20 -z-0"></div>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
              <Truck className="text-primary" size={20} />
              Método de Entrega
            </h3>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all ${
                  deliveryMethod === 'pickup' 
                    ? 'border-primary bg-pink-50' 
                    : 'border-slate-100 hover:border-pink-200'
                }`}
              >
                <div className={`p-3 rounded-full ${deliveryMethod === 'pickup' ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                  <Store size={24} className={deliveryMethod === 'pickup' ? 'text-primary' : 'text-slate-400'} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">Recoger en el salón</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Gratis</p>
                </div>
              </button>
              
              <button
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all ${
                  deliveryMethod === 'delivery' 
                    ? 'border-primary bg-pink-50' 
                    : 'border-slate-100 hover:border-pink-200'
                }`}
              >
                <div className={`p-3 rounded-full ${deliveryMethod === 'delivery' ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                  <MapPin size={24} className={deliveryMethod === 'delivery' ? 'text-primary' : 'text-slate-400'} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">Envío a Domicilio</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Gratis &gt; $100k</p>
                </div>
              </button>
            </div>
          </div>

          {/* Details Form */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-50 relative overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
              <MapPin className="text-primary" size={20} />
              Tus Datos
            </h3>
            
            <div className="space-y-4 relative z-10">
              {deliveryMethod === 'delivery' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-4">Dirección Completa *</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Calle 123 #45-67, Apto 8"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-4">Teléfono de Contacto *</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu número de celular"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-4">Notas adicionales (opcional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones para la entrega..."
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-700 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

            <h3 className="text-xl font-black mb-8 italic">Resumen de tu Orden</h3>
            
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold tracking-wide">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6 pb-8">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-sm uppercase tracking-widest font-bold">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                    <Store size={16} />
                    Descuento
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {pointsToRedeem > 0 && (
                <div className="flex justify-between items-center text-orange-400">
                  <span className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                    <Star size={16} />
                    Puntos (-{pointsToRedeem})
                  </span>
                  <span>-{formatCurrency((pointsToRedeem / 100) * 1000)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-sm uppercase tracking-widest font-bold">Envío</span>
                <span className={deliveryMethod === 'pickup' || subtotal > 100000 ? 'text-emerald-400 font-bold' : ''}>
                  {deliveryMethod === 'pickup' || subtotal > 100000 ? 'GRATIS' : formatCurrency(10000)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-8 mb-10">
              <span className="text-lg uppercase tracking-[0.2em] font-black text-slate-300">Total</span>
              <span className="text-5xl font-black text-white italic font-h1 leading-none">{formatCurrency(total)}</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Wompi Checkout Button */}
            <div className="relative z-20">
              {!isFormValid() ? (
                <button 
                  disabled
                  className="w-full py-5 rounded-2xl font-black text-lg text-slate-400 bg-slate-800 cursor-not-allowed border border-slate-700 uppercase tracking-widest"
                >
                  Completa tus datos
                </button>
              ) : total === 0 ? (
                <button 
                  onClick={() => handleWompiSuccess({ id: 'PUNTOS', paymentMethod: 'PUNTOS_YULIEDPLAY' })}
                  disabled={isProcessing}
                  className="w-full py-5 rounded-2xl font-black text-lg text-white bg-orange-500 hover:bg-orange-600 transition-colors uppercase tracking-widest"
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Orden (Pagada con Puntos)'}
                </button>
              ) : (
                <WompiCheckout 
                  amount={total} 
                  currency="COP"
                  reference={`ORD-${Date.now()}-${user?.uid?.substring(0,4) || 'GST'}`}
                  onSuccess={handleWompiSuccess}
                  onError={(err) => setError(err.message || 'Error en el pago')}
                  disabled={isProcessing}
                />
              )}
            </div>
            
            <p className="mt-6 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
              <ShieldCheck size={14} />
              Tus pagos están protegidos al 100%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
