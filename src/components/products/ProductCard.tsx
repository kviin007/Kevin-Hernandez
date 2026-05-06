import React, { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { ShoppingBag, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export const ProductCard: React.FC<{ product: any, onSelect?: (p: any) => void }> = ({ product, onSelect }) => {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    
    addItem({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      imageUrl: product.image || product.imageUrl, // Handle variations in data
      stock: product.stock 
    });
    
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1000);
    openDrawer();
  };

  return (
    <div 
      className="bg-white rounded-[32px] overflow-hidden border border-pink-50 shadow-sm professional-shadow group cursor-pointer hover:border-pink-200 transition-all duration-500 hover:-translate-y-2 flex flex-col"
      onClick={() => onSelect?.(product)}
    >
      <div className="relative h-64 overflow-hidden bg-slate-50">
        {product.image || product.imageUrl ? (
          <img 
            src={product.image || product.imageUrl} 
            alt={product.name} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-pink-50 flex items-center justify-center">
            <ShoppingBag size={48} className="text-pink-200 opacity-50" />
          </div>
        )}
        {(product.stock <= (product.minStock || 5) && product.stock > 0) && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            ¡Sólo {product.stock}!
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute top-4 left-4 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            Agotado
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{product.category || 'Producto'}</p>
        <h3 className="text-xl font-black text-slate-800 mb-2 font-h1">{product.name}</h3>
        <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-black text-primary font-h1 italic">{formatCurrency(product.price)}</span>
          <button 
            disabled={product.stock <= 0 || isAdded}
            onClick={handleAdd}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              product.stock <= 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : isAdded
                  ? 'bg-emerald-500 text-white scale-110'
                  : 'bg-pink-100 text-pink-600 hover:bg-pink-200 hover:scale-110'
            }`}
          >
            {isAdded ? <Check size={20} /> : <ShoppingBag size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
