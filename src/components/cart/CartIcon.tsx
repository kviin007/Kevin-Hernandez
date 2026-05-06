import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore, selectItemCount } from '../../stores/cartStore';

export const CartIcon = () => {
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);
  const itemCount = useCartStore(selectItemCount);

  return (
    <button 
      onClick={toggleDrawer}
      className="relative p-3 text-slate-800 hover:text-pink-600 bg-white hover:bg-pink-50 rounded-2xl transition-all hover:scale-105"
    >
      <ShoppingBag size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
          {itemCount}
        </span>
      )}
    </button>
  );
};
