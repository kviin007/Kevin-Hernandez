import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeParse } from '../utils/safeParse';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discount: number;
  isDrawerOpen: boolean;
  pointsToRedeem: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  applyPromo: (code: string, pctDiscount: number) => void;
  removePromo: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setPointsToRedeem: (points: number, maxUserPoints: number) => void;
  
  // Computed (accessed via getters or hooks in components, but we define them here for convenience if needed, though usually Zustand recommends separate selectors)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,
      isDrawerOpen: false,
      pointsToRedeem: 0,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id);
          const quantityToAdd = newItem.quantity || 1;
          
          if (existing) {
            const newQuantity = existing.quantity + quantityToAdd;
            if (newQuantity > existing.stock) return state; // Don't exceed stock
            
            return {
              items: state.items.map((i) => 
                i.id === newItem.id ? { ...i, quantity: newQuantity } : i
              )
            };
          }
          
          if (quantityToAdd > newItem.stock) return state;
          
          return {
            items: [...state.items, { ...newItem, quantity: quantityToAdd }]
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id)
        }));
      },

      updateQuantity: (id, delta) => {
        set((state) => {
          return {
            items: state.items.map((i) => {
              if (i.id === id) {
                const newQ = i.quantity + delta;
                if (newQ < 1 || newQ > i.stock) return i;
                return { ...i, quantity: newQ };
              }
              return i;
            })
          };
        });
      },

      clearCart: () => set({ items: [], promoCode: null, discount: 0, pointsToRedeem: 0 }),
      
      applyPromo: (code, pctDiscount) => set({ promoCode: code, discount: pctDiscount }),
      
      removePromo: () => set({ promoCode: null, discount: 0 }),

      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setPointsToRedeem: (points, maxUserPoints) => set((state) => {
        const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = subtotal * (state.discount / 100);
        const delivery = subtotal > 100000 ? 0 : (state.items.length > 0 ? 10000 : 0);
        const maxCartValueCOP = subtotal - discountAmount + delivery;
        const maxCartPoints = maxCartValueCOP > 0 ? Math.floor(maxCartValueCOP / 1000) * 100 : 0;
        
        let validPoints = Math.max(0, Math.floor(points / 100) * 100);
        validPoints = Math.min(validPoints, maxUserPoints, maxCartPoints);
        return { pointsToRedeem: validPoints };
      }),
    }),
    {
      name: 'yuliedplay-cart',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const val = localStorage.getItem(name);
          const normalized = val?.trim();
          if (!normalized || normalized === 'undefined' || normalized === 'null' || normalized === '""' || normalized === 'NaN') return null;
          if (safeParse(normalized, null)) return normalized;
          try { localStorage.removeItem(name); } catch(e) {}
          return null;
        },
        setItem: (name, value) => {
          const normalized = value?.trim();
          if (normalized && normalized !== 'undefined' && normalized !== 'null' && normalized !== '""' && normalized !== 'NaN') {
            localStorage.setItem(name, normalized);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({ 
        items: state.items, 
        promoCode: state.promoCode, 
        discount: state.discount,
        pointsToRedeem: state.pointsToRedeem
      }),
    }
  )
);

// Helper computed selectors
export const selectSubtotal = (state: CartState) => 
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectDiscountAmount = (state: CartState) => {
  const subtotal = selectSubtotal(state);
  return subtotal * (state.discount / 100);
};

export const selectTotal = (state: CartState) => {
  const subtotal = selectSubtotal(state);
  const discountAmount = selectDiscountAmount(state);
  const pointsDiscount = (state.pointsToRedeem / 100) * 1000;
  const delivery = subtotal > 100000 ? 0 : (state.items.length > 0 ? 10000 : 0);
  
  const finalTotal = subtotal - discountAmount - pointsDiscount + delivery;
  return Math.max(0, finalTotal); // Prevent negative totals
};

export const selectItemCount = (state: CartState) => 
  state.items.reduce((sum, item) => sum + item.quantity, 0);
