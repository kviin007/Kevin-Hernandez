import React, { useEffect, useState } from 'react';
import { WOMPI_CONFIG } from '../../config/wompi';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, Shield } from 'lucide-react';

interface WompiCheckoutProps {
  amount: number;
  reference: string;
  email?: string;
  onSuccess: (info: any) => void;
  onError: (error: any) => void;
  currency?: string;
  disabled?: boolean;
}

export const WompiCheckout: React.FC<WompiCheckoutProps> = ({ 
  amount, 
  reference, 
  email, 
  onSuccess, 
  onError,
  currency = 'COP',
  disabled = false
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Wompi Script
    const scriptId = 'wompi-checkout-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        setScriptLoaded(true);
      };
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const openCheckout = () => {
    if (!scriptLoaded || !(window as any).WidgetCheckout) {
      alert("Cargando pasarela de pagos, por favor espera un momento.");
      return;
    }

    const checkout = new (window as any).WidgetCheckout({
      currency: currency || WOMPI_CONFIG.currency,
      amountInCents: amount,
      reference: reference,
      publicKey: WOMPI_CONFIG.publicKey,
      customerData: {
        email: email || '',
      }
    });

    checkout.open(function (result: any) {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        onSuccess(transaction);
      } else if (transaction.status === 'ERROR' || transaction.status === 'DECLINED') {
        onError(transaction);
      }
    });
  };

  return (
    <div className="w-full">
      <button 
        onClick={openCheckout}
        disabled={!scriptLoaded || disabled}
         className="w-full btn-primary py-5 flex items-center justify-center gap-3 text-xs shadow-xl shadow-pink-100 disabled:opacity-50 transition-all font-black uppercase tracking-widest"
      >
        <CreditCard size={20} />
        {scriptLoaded ? 'Pagar de forma segura con Wompi' : 'Cargando pagos...'}
      </button>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex justify-center items-center gap-2 mt-4">
         <Shield size={12} className="text-emerald-500" /> Transacción encriptada
      </p>
    </div>
  );
};
