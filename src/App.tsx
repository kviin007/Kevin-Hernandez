import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Grid3X3, 
  ShoppingBag, 
  Upload,
  Calendar, 
  Award, 
  Settings, 
  MessageSquare, 
  HelpCircle,
  Menu,
  ShoppingCart,
  Bell,
  ChevronRight,
  LogOut,
  MapPin,
  Clock,
  CreditCard,
  Crown,
  CheckCircle2,
  Lock,
  Plus,
  Save,
  Phone,
  Paperclip,
  Send,
  Search,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  FileVideo,
  X,
  Camera,
  Brain,
  Instagram,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from './components/AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  where,
  limit,
  setDoc,
  getDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area 
} from 'recharts';

// --- Utilities ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const notifyWhatsApp = (phone: string | undefined, message: string) => {
  if (!phone) {
    alert("No hay teléfono registrado.");
    return;
  }
  const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const BrandLogo = ({ size = 'md', showSlogan = false }: { size?: 'sm' | 'md' | 'lg', showSlogan?: boolean }) => {
  const iconSize = size === 'lg' ? 48 : size === 'md' ? 32 : 24;
  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-xl';
  const sloganSize = size === 'lg' ? 'text-[10px]' : 'text-[8px]';

  return (
    <div className="flex flex-col items-center select-none group cursor-pointer transition-all duration-700">
      <div className={`relative ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-16 h-16' : 'w-10 h-10'} flex items-center justify-center`}>
        {/* Animated Orbs for Depth */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-pink-100/30 rounded-full blur-xl animate-pulse" />
        
        {/* The Icon Container */}
        <div className={`relative ${size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'} bg-white rounded-[35%] flex items-center justify-center shadow-2xl border border-pink-50 transition-all duration-700 group-hover:rounded-[45%] group-hover:rotate-[360deg]`}>
          <div className="text-primary flex items-center justify-center relative">
            <Crown size={iconSize} strokeWidth={1.5} className="drop-shadow-sm" />
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 -right-3 text-pink-400"
            >
              <Sparkles size={size === 'lg' ? 24 : 16} />
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center">
        <h1 className={`${textSize} font-black text-slate-800 tracking-[-0.03em] flex items-baseline gap-1.5 transition-all duration-500`}>
          <span className="font-h1 italic text-slate-900">YULIED</span>
          <span className="font-h1 italic text-primary underline decoration-pink-100 decoration-8 underline-offset-4">Studio</span>
        </h1>
        {showSlogan && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mt-3"
          >
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
            <p className={`${sloganSize} font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap`}>
              The Art of Luxury Nails
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Types ---
type View = 'landing' | 'grid' | 'shop' | 'booking' | 'loyalty' | 'settings' | 'messaging' | 'help' | 'checkout' | 'admin' | 'services_list' | 'ai_studio';

// --- New Auth Sub-component ---
const AuthView = () => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) return setError('Ingresa tu correo o usuario.');
    if (password.length < 5) return setError('La contraseña es demasiado corta.');
    
    if (!isLogin) {
      if (!displayName) return setError('Ingresa tu nombre completo.');
      if (!email.includes('@')) return setError('Ingresa un formato de correo válido.');
      if (password.length < 6) return setError('Crea una contraseña de al menos 6 caracteres.');
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, { displayName, phone, address });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo para restablecer contraseña.');
      return;
    }
    try {
      await resetPassword(email);
      setMessage('Correo de restablecimiento enviado.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50/30 p-6 py-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-pink-100"
      >
        <div className="flex flex-col items-center mb-10">
          <BrandLogo size="lg" showSlogan />
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mt-6 bg-slate-50 px-4 py-1 rounded-full">{isLogin ? 'Acceso Premium' : 'Registro de Cliente'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 bg-pink-50/20 border border-pink-100 rounded-2xl px-6 text-sm outline-none transition-all font-medium" 
                  placeholder="Ej: Kevin Hernandez"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono Celular</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 bg-pink-50/20 border border-pink-100 rounded-2xl px-6 text-sm outline-none transition-all font-medium" 
                  placeholder="+57..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-12 bg-pink-50/20 border border-pink-100 rounded-2xl px-6 text-sm outline-none transition-all font-medium" 
                  placeholder="Calle..."
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-pink-50/20 border border-pink-100 rounded-2xl px-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
              placeholder="tu@email.com o 'admin'"
            />
            {isLogin && <p className="text-[10px] text-slate-400 italic mt-1">* Para admins: usa 'admin' / 'admin'</p>}
          </div>
          <div className="space-y-2 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPass ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-pink-50/20 border border-pink-100 rounded-2xl px-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}
          {message && <p className="text-emerald-500 text-[10px] font-bold text-center uppercase tracking-widest">{message}</p>}

          <button type="submit" className="btn-primary w-full h-12 uppercase tracking-[0.2em] text-xs">
            {isLogin ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4">
          <button 
            onClick={loginWithGoogle}
            className="w-full h-12 bg-white border border-pink-100 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold text-slate-600 hover:bg-pink-50/30 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continuar con Google
          </button>
          
          <div className="flex justify-between items-center px-2">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-bold text-pink-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </button>
            {isLogin && (
              <button 
                onClick={handleReset}
                className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose, onFeedbackSubmit }: { isOpen: boolean, onClose: () => void, onFeedbackSubmit: (rating: number, comment: string) => void }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-pink-100"
      >
        <h3 className="text-2xl font-black text-slate-800 font-h1 italic mb-4 text-center">¡Tu opinión nos importa!</h3>
        <p className="text-sm text-slate-500 text-center mb-8">Ayúdanos a mejorar calificando tu experiencia reciente.</p>
        
        <div className="flex justify-center gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              onClick={() => setRating(star)}
              className={`p-2 transition-all ${rating >= star ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
            >
              <Sparkles size={32} fill={rating >= star ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>

        <textarea 
          placeholder="Cuéntanos más (opcional)..."
          className="w-full bg-pink-50/20 border border-pink-100 rounded-3xl p-6 text-sm min-h-[120px] focus:ring-4 focus:ring-primary/10 outline-none transition-all mb-8 italic"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Saltar</button>
          <button 
            disabled={rating === 0}
            onClick={() => onFeedbackSubmit(rating, comment)}
            className="flex-[2] btn-primary py-4 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            Enviar Comentarios
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => {
  const { isAdmin, logout } = useAuth();
  const menuItems = [
    { id: 'landing', label: 'Inicio', icon: Grid3X3 },
    { id: 'services_list', label: 'Servicios', icon: Zap },
    { id: 'ai_studio', label: 'AI Nail Studio', icon: Sparkles },
    { id: 'booking', label: 'Reservar Cita', icon: Calendar },
    { id: 'shop', label: 'Tienda Online', icon: ShoppingBag },
    { id: 'loyalty', label: 'Mis Puntos', icon: Award },
    { id: 'messaging', label: 'Mensajes', icon: MessageSquare },
    { id: 'help', label: 'Ayuda', icon: HelpCircle },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Panel Admin', icon: Lock });
  }

  return (
    <aside className="hidden md:flex flex-col border-r border-pink-100 h-screen w-64 fixed left-0 top-0 bg-white shadow-sm z-40 transition-all duration-300">
      <div className="p-8 cursor-pointer mb-2 border-b border-pink-50/50" onClick={() => setView('landing')}>
        <BrandLogo size="sm" />
      </div>
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-4">
        {menuItems.map((item) => (
          <Tooltip key={item.id} text={item.label}>
            <button
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-pink-50 text-primary font-bold shadow-sm' 
                  : 'text-slate-400 hover:bg-pink-50/50 hover:text-primary'
              }`}
            >
              <item.icon size={18} className={activeView === item.id ? 'text-primary' : 'text-slate-300'} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          </Tooltip>
        ))}
      </nav>
      <div className="p-6 mt-auto flex flex-col gap-3">
        <button 
          onClick={() => setView('booking')}
          className="btn-primary w-full shadow-lg shadow-pink-200"
        >
          Agendar ahora
        </button>
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

const TopBar = ({ title, onMenuClick, notifications, showNotifications, setShowNotifications }: { 
  title: string, 
  onMenuClick: () => void,
  notifications: any[],
  showNotifications: boolean,
  setShowNotifications: (v: boolean) => void
}) => {
  const { profile } = useAuth();
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-pink-50 h-24 sticky top-0 z-50 flex items-center justify-between px-10 transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <Tooltip text="Menú">
            <button onClick={onMenuClick} className="p-3 text-pink-400 md:hidden bg-pink-50 rounded-2xl scale-90 hover:scale-100 transition-transform">
              <Menu size={24} />
            </button>
          </Tooltip>
          <div className="md:hidden">
            <BrandLogo size="sm" />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-[1px] h-10 bg-slate-100 hidden md:block" />
          <h2 className="text-2xl font-black text-slate-800 font-h1 italic tracking-wide">{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="hidden lg:block relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={18} />
          <input 
            className="w-80 h-12 bg-pink-50/30 border border-pink-100 rounded-2xl pl-12 pr-6 text-xs text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all italic font-medium" 
            placeholder="Buscar tratamientos, productos..."
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Tooltip text="Notificaciones">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 text-pink-300 hover:bg-pink-50 rounded-2xl transition-all relative group"
              >
                <Bell size={24} />
                {notifications.length > 0 && (
                  <span className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm shadow-pink-200 animate-pulse"></span>
                )}
              </button>
            </Tooltip>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden z-[60]"
                >
                  <header className="px-6 py-4 border-b border-pink-50 bg-pink-50/10">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Notificaciones</h4>
                  </header>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 italic text-xs">No tienes notificaciones nuevas</div>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="p-4 border-b border-pink-50 hover:bg-pink-50/20 transition-all">
                          <p className="text-[10px] font-black text-primary uppercase mb-1">{n.title}</p>
                          <p className="text-xs text-slate-600 font-medium italic">{n.message}</p>
                          <p className="text-[8px] text-slate-300 mt-2 uppercase font-bold">{n.time.toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 pl-6 border-l border-pink-50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 font-h1 italic">{profile?.displayName || 'Jane Doe'}</p>
              <p className="text-[9px] text-pink-400 font-bold uppercase tracking-[0.2em]">{profile?.role === 'admin' ? 'Administrador' : `Nivel ${(profile?.points || 0) > 5000 ? 'Platinum' : 'Gold'}`}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 overflow-hidden cursor-pointer border-2 border-white shadow-lg hover:scale-110 transition-transform">
              <img 
                src={profile?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"} 
                alt="User" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
 const AdminView = () => {
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'services' | 'products' | 'customers' | 'promos' | 'slots'>('services');
  const [adminActionStatus, setAdminActionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setAdminActionStatus({ type, message });
    setTimeout(() => setAdminActionStatus(null), 4000);
  };

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ col: string, id: string } | null>(null);

  useEffect(() => {
    const sQuery = query(collection(db, 'services'));
    const pQuery = query(collection(db, 'products'));
    const cQuery = query(collection(db, 'users'));
    const bQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const oQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const prQuery = query(collection(db, 'promotions'));
    const aQuery = query(collection(db, 'availability'));

    const unsubS = onSnapshot(sQuery, (snap) => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'services'));
    const unsubP = onSnapshot(pQuery, (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'products'));
    const unsubC = onSnapshot(cQuery, (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'users'));
    const unsubB = onSnapshot(bQuery, (snap) => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    const unsubO = onSnapshot(oQuery, (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'orders'));
    const unsubPR = onSnapshot(prQuery, (snap) => setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'promotions'));
    const unsubA = onSnapshot(aQuery, (snap) => setAvailability(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'availability'));

    return () => { unsubS(); unsubP(); unsubC(); unsubB(); unsubO(); unsubPR(); unsubA(); };
  }, []);

  const addService = async () => {
    try {
      await addDoc(collection(db, 'services'), {
        name: 'Nuevo Servicio',
        description: 'Descripción del servicio...',
        price: 0,
        duration: 30,
        category: 'General',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop',
        createdAt: serverTimestamp()
      });
      showStatus('success', 'Servicio agregado correctamente.');
    } catch (e: any) { 
      showStatus('error', 'Error al agregar servicio. Verifica permisos.');
      handleFirestoreError(e, OperationType.CREATE, 'services'); 
    }
  };

  const updateServiceField = async (id: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'services', id), { [field]: value });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `services/${id}`); }
  };

  const addPromo = async () => {
    try {
      await addDoc(collection(db, 'promotions'), {
        title: 'Nueva Promoción',
        description: 'Detalles de la oferta...',
        discountPercent: 10,
        code: 'PROMO10',
        active: true,
        createdAt: serverTimestamp()
      });
      showStatus('success', 'Promoción creada.');
    } catch (e: any) { 
      showStatus('error', 'Error al crear promoción.');
      handleFirestoreError(e, OperationType.CREATE, 'promotions'); 
    }
  };

  const setSlot = async (date: string, slotsString: string) => {
    try {
      const slots = slotsString.split(',').map(s => s.trim());
      await setDoc(doc(db, 'availability', date), { date, slots });
      showStatus('success', 'Agenda actualizada para ' + date);
    } catch (e: any) { 
      showStatus('error', 'Error al actualizar agenda. Revisa el formato.');
      handleFirestoreError(e, OperationType.WRITE, `availability/${date}`); 
    }
  };

  const addProduct = async () => {
    try {
      await addDoc(collection(db, 'products'), {
        name: 'Nuevo Producto',
        description: 'Descripción del producto...',
        price: 0,
        stock: 0,
        image: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?q=80&w=400&auto=format&fit=crop',
        createdAt: serverTimestamp()
      });
      showStatus('success', 'Producto agregado.');
    } catch (e: any) { 
      showStatus('error', 'Error al agregar producto.');
      handleFirestoreError(e, OperationType.CREATE, 'products'); 
    }
  };

  const updateItem = async (col: string, id: string, data: any) => {
    try {
      await updateDoc(doc(db, col, id), data);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `${col}/${id}`); }
  };

  const removeItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, itemToDelete.col, itemToDelete.id));
      setItemToDelete(null);
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, `${itemToDelete.col}/${itemToDelete.id}`); }
  };

  const getCustomerBookings = (userId: string) => {
    return bookings.filter(b => b.userId === userId);
  };

  const getCustomerOrders = (userId: string) => {
    return orders.filter(o => o.userId === userId);
  };

  const lowStockProducts = products.filter(p => p.stock < (p.minStock || 5));

  const totalRevenue = orders.reduce((acc, o) => acc + (o.price * o.quantity), 0);
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  // Real-time chart data
  const revenueData = orders.slice(0, 7).reverse().map(o => ({
    name: new Date(o.createdAt?.toDate()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    total: o.price * o.quantity
  }));

  const bookingVolumeData = [
    { name: 'Lun', citas: 12 }, { name: 'Mar', citas: 19 }, { name: 'Mie', citas: 15 },
    { name: 'Jue', citas: 22 }, { name: 'Vie', citas: 30 }, { name: 'Sab', citas: 45 }, { name: 'Dom', citas: 10 }
  ];

  return (
    <div className="space-y-14">
      <AnimatePresence>
        {adminActionStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-10 left-1/2 z-[200] px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              adminActionStatus.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {adminActionStatus.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
            <p className="text-xs font-black uppercase tracking-widest leading-none">{adminActionStatus.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Bell className="text-red-500 animate-bounce" size={24} />
            <div>
              <p className="text-sm font-black text-red-800 uppercase tracking-widest">Alerta de Stock Bajo</p>
              <p className="text-xs text-red-600 italic">Tienes {lowStockProducts.length} productos por debajo del umbral mínimo.</p>
            </div>
          </div>
          <button 
            onClick={() => setViewType('products')}
            className="text-[10px] font-black underline text-red-700 uppercase tracking-widest"
          >
            Ver Productos
          </button>
        </div>
      )}

      {/* Analytics Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Ingresos Totales', value: `$${totalRevenue.toFixed(2)}`, trend: '+12% vs mes anterior', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Citas Totales', value: totalBookings, trend: `${pendingBookings} pendientes`, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
          { label: 'Clientes Base', value: customers.length, trend: 'Crecimiento constante', icon: Award, color: 'bg-purple-50 text-purple-600' },
          { label: 'Ventas Productos', value: orders.length, trend: 'Nuevos pedidos hoy', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-pink-50 shadow-sm professional-shadow flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-800 font-h1 italic">{stat.value}</h4>
              <p className="text-[10px] text-slate-400 italic mt-1">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-lg font-black text-slate-800 font-h1 italic">Evolución de Ventas</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronización en tiempo real</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData.length > 0 ? revenueData : bookingVolumeData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis hide />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey={revenueData.length > 0 ? "total" : "citas"} stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-lg font-black text-slate-800 font-h1 italic">Volumen de Citas</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actividad de la última semana</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Calendar size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                <YAxis hide />
                <RechartsTooltip 
                  cursor={{ fill: '#fdf2f8', radius: 12 }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="citas" fill="#db2777" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 font-h1 italic tracking-tight">Centro de Gestión</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Control total sobre servicios, productos y analítica de clientes.</p>
        </div>
        <div className="flex flex-wrap gap-4 bg-pink-50/30 p-2.5 rounded-[32px] border border-pink-100/50">
          {[
            { id: 'services', label: 'Servicios', icon: Sparkles },
            { id: 'products', label: 'E-Shop', icon: ShoppingBag },
            { id: 'promos', label: 'Promos', icon: Award },
            { id: 'slots', label: 'Horarios', icon: Calendar },
            { id: 'customers', label: 'Clientes', icon: Award }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setViewType(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                viewType === tab.id 
                  ? 'bg-primary text-white shadow-xl shadow-pink-200 scale-105' 
                  : 'text-slate-400 hover:bg-white hover:text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {viewType === 'promos' && (
        <div className="grid grid-cols-1 gap-14">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Promociones Activas ({promotions.length})</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const msg = "¡Nueva promoción en Yulied Play! Mira nuestras ofertas actuales en la app.";
                  customers.forEach(c => notifyWhatsApp(c.phone, msg));
                }}
                className="btn-secondary px-6 py-4 rounded-[24px] text-[10px] flex items-center gap-2 bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <Phone size={16} /> NOTIFICAR TODOS (WA)
              </button>
              <button 
                onClick={addPromo}
                className="btn-primary px-8 py-4 rounded-[24px] text-[10px] flex items-center gap-2"
              >
                <Plus size={20} /> NUEVA PROMO
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow space-y-6">
                <div className="flex justify-between items-start">
                  <input 
                    className="text-2xl font-black text-slate-800 font-h1 italic italic bg-transparent outline-none w-full"
                    value={promo.title}
                    placeholder="Título de promo"
                    onChange={(e) => updateItem('promotions', promo.id, { title: e.target.value })}
                  />
                  <button 
                    onClick={() => {
                      const msg = `¡Hola! Tenemos una promoción para ti: ${promo.title}. Usa el código ${promo.code} para un descuento especial.`;
                      notifyWhatsApp(undefined, msg); // Placeholder for targetedWA
                    }}
                    className="text-emerald-500 hover:scale-110 transition-transform"
                  >
                    <Phone size={20} />
                  </button>
                </div>
                <input 
                  className="text-xs font-black text-primary uppercase tracking-widest bg-pink-50/50 px-4 py-2 rounded-lg w-full outline-none"
                  value={promo.code}
                  placeholder="CÓDIGO"
                  onChange={(e) => updateItem('promotions', promo.id, { code: e.target.value })}
                />
                <textarea 
                  className="w-full bg-slate-50 p-4 rounded-2xl text-xs italic outline-none min-h-[80px]"
                  value={promo.description}
                  placeholder="Descripción..."
                  onChange={(e) => updateItem('promotions', promo.id, { description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Desde</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 px-4 py-3 rounded-xl text-[10px] outline-none"
                      value={promo.startDate || ''}
                      onChange={(e) => updateItem('promotions', promo.id, { startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hasta</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 px-4 py-3 rounded-xl text-[10px] outline-none"
                      value={promo.endDate || ''}
                      onChange={(e) => updateItem('promotions', promo.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center bg-pink-50/30 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</span>
                  <button 
                    onClick={() => updateItem('promotions', promo.id, { active: !promo.active })}
                    className={`w-12 h-6 rounded-full transition-all ${promo.active ? 'bg-primary' : 'bg-slate-200'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${promo.active ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <button 
                  onClick={() => setItemToDelete({ col: 'promotions', id: promo.id })}
                  className="text-[9px] font-black text-red-300 hover:text-red-500 uppercase tracking-widest w-full text-center py-2"
                >
                  Eliminar Promo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewType === 'slots' && (
        <div className="bg-white p-12 rounded-[40px] border border-pink-50 shadow-sm professional-shadow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 font-h1 italic tracking-tight">Gestión de Disponibilidad</h3>
              <p className="text-sm text-slate-500 italic mt-2">Agrega los días y horarios en los que tus especialistas están disponibles.</p>
            </div>
            <div className="flex items-center gap-4 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100">
              <Calendar className="animate-pulse" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Agenda Abierta</span>
            </div>
          </div>
          
          <div className="space-y-10">
            <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Plus className="text-primary" size={16} /> Programar Nueva Fecha
              </h4>
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const d = e.target.date.value;
                const s = e.target.slots.value;
                if(d && s) setSlot(d, s);
                e.target.reset();
              }} className="flex flex-col lg:flex-row gap-6 relative z-10">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Seleccionar Fecha</label>
                  <input name="date" type="date" className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-primary transition-all shadow-sm" required />
                </div>
                <div className="flex-[2] space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Horarios (Separados por coma)</label>
                  <input name="slots" placeholder="EJ: 09:00, 10:00, 11:30, 15:00, 17:30..." className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-primary transition-all shadow-sm placeholder:text-slate-200" required />
                </div>
                <div className="lg:pt-7 flex items-end">
                  <button type="submit" className="w-full lg:w-auto btn-primary px-12 py-4 h-[56px] text-xs shadow-2xl shadow-pink-100 uppercase tracking-[0.2em]">Actualizar Agenda</button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Calendario de Próximos Días ({availability.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {availability.sort((a,b) => a.date.localeCompare(b.date)).map(day => (
                  <div key={day.id} className="bg-white p-8 rounded-[32px] border border-pink-50 shadow-sm relative group hover:shadow-xl transition-all duration-500">
                    <button 
                      onClick={() => deleteDoc(doc(db, 'availability', day.id))}
                      className="absolute top-6 right-6 w-8 h-8 bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100"
                    >
                      <Plus size={16} className="rotate-45" />
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar size={18} className="text-primary" />
                      <p className="text-lg font-black text-slate-800 font-h1 italic">{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((s: string) => (
                        <span key={s} className="bg-pink-50/50 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary border border-pink-100/50 tracking-tighter italic">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {availability.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                     <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No hay disponibilidad configurada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewType === 'customers' && (
        <div className="grid grid-cols-1 gap-10">
          <div className="bg-white rounded-[40px] border border-pink-50 shadow-sm overflow-hidden professional-shadow">
            <header className="px-10 py-8 bg-pink-50/20 border-b border-pink-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Base de Datos de Clientes ({customers.length})</h3>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-pink-50 bg-pink-50/10">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cliente</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Puntos</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Citas Totales</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nivel</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Última Actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {customers.map((c) => {
                    const cBookings = getCustomerBookings(c.id);
                    return (
                      <tr key={c.id} className="hover:bg-pink-50/20 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-100 overflow-hidden border-2 border-white shadow-md">
                              <img src={c.photoURL || "https://i.pravatar.cc/150?u="+c.id} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 font-h1 italic">{c.displayName || 'Anonimo'}</p>
                              <p className="text-[10px] text-slate-400">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-sm font-black text-primary italic">{(c.points || 0).toLocaleString()} pts</span>
                        </td>
                        <td className="px-10 py-6">
                          <button 
                            onClick={() => setSelectedCustomer(c)}
                            className="bg-slate-100 text-slate-600 text-[10px] font-black px-4 py-2 rounded-full border border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all"
                          >
                            {cBookings.length} CITAS (VER HISTORIAL)
                          </button>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`status-pill ${c.points > 5000 ? 'pill-green' : 'pill-pink'}`}>
                            {c.points > 5000 ? 'Platinum' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-[10px] font-medium text-slate-500 italic">
                            {cBookings[0] ? new Date(cBookings[0].date).toLocaleDateString() : 'Sin actividad'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <AnimatePresence>
              {selectedCustomer && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[40px] max-w-2xl w-full p-10 shadow-2xl border border-pink-100 professional-shadow"
                  >
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[24px] bg-pink-100 overflow-hidden border-4 border-white shadow-xl">
                          <img src={selectedCustomer.photoURL || "https://i.pravatar.cc/150?u="+selectedCustomer.id} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-slate-800 font-h1 italic tracking-tight">{selectedCustomer.displayName}</h2>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">{selectedCustomer.email}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">• {selectedCustomer.phone || 'Sin Teléfono'}</p>
                          </div>
                          {selectedCustomer.address && (
                            <p className="items-center gap-1 text-[10px] text-slate-400 italic mt-2 flex">
                              <MapPin size={10} /> {selectedCustomer.address}
                            </p>
                          )}
                          {selectedCustomer.phone && (
                            <a 
                              href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                            >
                              <MessageSquare size={14} /> Contactar WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="p-4 bg-pink-50 text-slate-400 rounded-2xl hover:text-primary transition-colors">
                        <Plus className="rotate-45" size={24} />
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="border-b border-pink-50 pb-4 mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Citas</h3>
                        {getCustomerBookings(selectedCustomer.id).length === 0 ? (
                          <p className="py-4 text-slate-400 italic text-xs">No hay historial de citas disponible.</p>
                        ) : (
                          getCustomerBookings(selectedCustomer.id).map((b, i) => (
                            <div key={i} className="flex justify-between items-center p-6 bg-pink-50/20 rounded-[32px] border border-pink-50 mb-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-lg font-h1 italic">{b.serviceName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                  <Clock size={12} /> {new Date(b.date).toLocaleString()}
                                </p>
                              </div>
                              <span className={`status-pill ${b.status === 'confirmed' ? 'pill-green' : 'pill-pink'}`}>
                                {b.status === 'confirmed' ? 'Completado' : 'Pendiente'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Compras</h3>
                        {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                          <p className="py-4 text-slate-400 italic text-xs">No hay historial de compras disponible.</p>
                        ) : (
                          getCustomerOrders(selectedCustomer.id).map((o, i) => (
                            <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-sm italic">{o.productName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  {new Date(o.createdAt?.toDate()).toLocaleString()} • Cantidad: {o.quantity}
                                </p>
                              </div>
                              <span className="text-sm font-black text-primary italic">${o.price}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {(viewType === 'services' || viewType === 'products') && (
        <div className="grid grid-cols-1 gap-14">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              Catálogo de {viewType === 'services' ? 'Servicios' : 'Productos'} ({viewType === 'services' ? services.length : products.length})
            </h3>
            <button 
              onClick={viewType === 'services' ? addService : addProduct}
              className="flex items-center gap-3 text-[10px] font-black text-white bg-emerald-500 px-8 py-4 rounded-[24px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 scale-100 hover:scale-105 active:scale-95"
            >
              <Plus size={20} /> AGREGAR NUEVO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(viewType === 'services' ? services : products).map((item: any) => (
              <div key={item.id} className="bg-white rounded-[40px] p-10 border border-pink-50 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden professional-shadow">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-20 transition-opacity group-hover:opacity-100"></div>
                <div className="flex justify-between items-start mb-8">
                  <input 
                    className="text-2xl font-black text-slate-800 font-h1 italic bg-transparent focus:bg-pink-50/30 px-3 py-1 rounded-xl outline-none w-[80%] transition-colors"
                    value={item.name}
                    onChange={(e) => updateItem(viewType, item.id, { name: e.target.value })}
                  />
                  <button onClick={() => setItemToDelete({ col: viewType, id: item.id })} className="p-3 text-slate-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl">
                    <LogOut size={20} className="rotate-180" title="Eliminar" />
                  </button>
                </div>

                <div className="mb-8 space-y-4">
                  <div className="relative group/upload">
                    <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
                    <input 
                      className="w-full bg-slate-50/50 rounded-2xl pl-12 pr-12 py-3 text-xs text-slate-500 font-medium italic border border-transparent focus:border-primary outline-none"
                      value={item.image || ''}
                      placeholder={viewType === 'products' ? 'URL de imagen de producto' : 'URL de imagen de servicio'}
                      onChange={(e) => updateItem(viewType, item.id, { image: e.target.value })}
                    />
                    <label className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-primary hover:scale-110 transition-transform">
                      <Upload size={16} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             if (file.size > 800000) return alert("Archivo muy grande. Máximo 800KB para almacenamiento en DB.");
                             const base64 = await fileToBase64(file);
                             updateItem(viewType, item.id, { image: base64 });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50/50 rounded-[24px] p-6 text-sm text-slate-500 min-h-[100px] outline-none focus:ring-4 focus:ring-primary/5 italic leading-relaxed"
                    value={item.description}
                    onChange={(e) => updateItem(viewType, item.id, { description: e.target.value })}
                    placeholder="Escribe la descripción aquí..."
                  />
                </div>

                <div className={viewType === 'services' ? 'flex flex-col gap-6' : 'grid grid-cols-2 gap-6'}>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 pl-1 italic">Precio ($)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
                      <input 
                        type="number"
                        className="w-full bg-pink-50/20 border border-pink-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-primary outline-none focus:border-primary transition-colors italic"
                        value={item.price}
                        onChange={(e) => updateItem(viewType, item.id, { price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  {viewType === 'products' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 pl-1 italic">Stock</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
                        <input 
                          type="number"
                          className="w-full bg-pink-50/20 border border-pink-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-600 outline-none focus:border-primary transition-colors italic"
                          value={item.stock}
                          onChange={(e) => updateItem(viewType, item.id, { stock: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {viewType === 'products' && (
                  <div className="mt-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 pl-1 italic">Umbral Stock Mínimo</label>
                    <input 
                      type="number"
                      className="w-full bg-pink-50/20 border border-pink-100 rounded-2xl px-6 py-3 text-xs font-black text-red-400 outline-none focus:border-red-400 transition-colors italic"
                      value={item.minStock || 5}
                      onChange={(e) => updateItem(viewType, item.id, { minStock: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            ))}
            {(viewType === 'services' ? services : products).length === 0 && (
               <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No hay registrados todavía</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Global Deletion Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[50px] p-12 max-w-md w-full text-center shadow-2xl border border-pink-100"
            >
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <LogOut size={40} className="rotate-180" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 font-h1 italic mb-4">¿Estás seguro?</h3>
              <p className="text-slate-500 italic mb-10 leading-relaxed">Esta acción es irreversible y eliminará permanentemente el registro de la plataforma.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={removeItem}
                  className="py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-100 transition-all"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- View Components ---

const ServicesView = ({ setView }: { setView: (v: View) => void }) => {
  const [services, setServices] = useState<any[]>([]);
  const { isAdmin } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'services'));
    return unsubscribe;
  }, []);

  const featuredServices = services.slice(0, 3);

  return (
    <div className="space-y-20 pb-20">
      <div className="text-center space-y-6 relative">
        {isAdmin && (
          <button 
            onClick={() => setView('admin')}
            className="absolute right-0 top-0 bg-pink-50 text-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-pink-100 flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <Settings size={14} /> GESTIONAR SERVICIOS
          </button>
        )}
        <h2 className="text-5xl font-black text-slate-800 font-h1 italic tracking-tight underline decoration-pink-100 decoration-8 underline-offset-8">Experiencias Premium</h2>
        <p className="text-slate-500 max-w-2xl mx-auto italic font-medium leading-relaxed">
          Un santuario dedicado a tu perfeccionamiento. Cada técnica ha sido refinada para ofrecerte resultados excepcionales y una relajación absoluta.
        </p>
      </div>

      {/* Featured Carousel */}
      {featuredServices.length > 0 && (
        <section className="relative h-[500px] rounded-[60px] overflow-hidden shadow-2xl group professional-shadow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img src={featuredServices[activeIndex].image} className="w-full h-full object-cover" alt="Service" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent flex items-center px-10 md:px-20">
                <div className="max-w-xl space-y-6">
                  <span className="inline-block px-4 py-2 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full">Destacado</span>
                  <h3 className="text-4xl md:text-6xl font-black text-white font-h1 italic leading-tight">{featuredServices[activeIndex].name}</h3>
                  <p className="text-sm md:text-lg text-pink-50 font-medium italic leading-relaxed line-clamp-3">
                    {featuredServices[activeIndex].description}
                  </p>
                  <button 
                    onClick={() => setView('booking')}
                    className="btn-primary py-5 px-10 text-[10px] uppercase tracking-widest shadow-xl shadow-pink-900/20"
                  >
                    Reserva esta experiencia
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {featuredServices.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveIndex(i)}
                className={`w-12 h-1.5 rounded-full transition-all duration-500 ${activeIndex === i ? 'bg-primary w-20' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>

          <button 
            onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : featuredServices.length - 1))}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <button 
            onClick={() => setActiveIndex((prev) => (prev < featuredServices.length - 1 ? prev + 1 : 0))}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
          >
            <ChevronRight size={24} />
          </button>
        </section>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {services.map(s => (
          <motion.div 
            key={s.id} 
            whileHover={{ y: -10 }}
            className="bg-white rounded-[40px] border border-pink-50 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group professional-shadow flex flex-col h-full"
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <img 
                src={s.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                alt={s.name}
                loading="lazy"
              />
              <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
                <span className="text-lg font-black text-primary font-h1 italic">${s.price}</span>
              </div>
            </div>
            <div className="p-10 flex flex-col flex-1">
              <h3 className="text-2xl font-black text-slate-800 font-h1 italic leading-tight mb-4">{s.name}</h3>
              <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-3 mb-10 flex-1">{s.description}</p>
              <button 
                onClick={() => setView('booking')}
                className="w-full py-4 bg-slate-50 text-primary border border-pink-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                AGENDAR AHORA <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AIStudioView = ({ setView }: { setView: (v: View) => void }) => {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'muse' | 'moodboard'>('visualizer');
  const [handImage, setHandImage] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [musePrompt, setMusePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [moodboard, setMoodboard] = useState<any[]>([]);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'moodboards'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMoodboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'moodboards'));
    return unsub;
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setHandImage(base64);
    }
  };

  const generateDesign = async () => {
    if (!musePrompt) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres un diseñador de uñas experto de lujo. Basado en esta solicitud: "${musePrompt}", genera un concepto de diseño exclusivo. 
        Devuelve un JSON con:
        - name: Nombre creativo del diseño
        - description: Descripción poética
        - technicalDetails: Detalles técnicos (acabado, técnica)
        - colorPalette: [array de colores hex]
        - promptForImage: Un prompt detallado en inglés para generar una imagen fotorrealista de este diseño de uñas en una mano elegante.`,
        config: { responseMimeType: 'application/json' }
      });
      
      const data = JSON.parse(response.text || '{}');
      setAiSuggestion(data);
      
      // In a real scenario, we'd use the promptForImage to call an image generation API.
      // Since we have the image-generation skill, we'll simulate the "generation" 
      // by providing a relevant placeholder or using a real generation if the platform allows.
      // For this demo, we'll use a high-quality placeholder that matches the "concept".
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToMoodboard = async (item: any) => {
    try {
      await addDoc(collection(db, 'moodboards'), {
        userId: user?.uid,
        ...item,
        createdAt: serverTimestamp()
      });
      alert('¡Añadido a tu Moodboard!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'moodboards');
    }
  };

  const importPinterest = () => {
    if (!pinterestUrl) return;
    // Simulate finding the image from the URL
    const mockImage = `https://images.unsplash.com/photo-1604654894611-6973b376cbdf?q=80&w=400&auto=format&fit=crop`;
    saveToMoodboard({
      title: 'Pinterest Inspiring',
      image: mockImage,
      source: 'Pinterest',
      url: pinterestUrl
    });
    setPinterestUrl('');
  };

  return (
    <div className="space-y-14 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 font-h1 italic tracking-tight">AI Creative Studio</h2>
          <p className="text-slate-500 font-medium italic mt-2">Visualiza, diseña y colecciona inspiración con inteligencia artificial.</p>
        </div>
        <div className="flex bg-pink-50 p-2 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('visualizer')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visualizer' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-primary'}`}>Visualizador</button>
          <button onClick={() => setActiveTab('muse')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muse' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-primary'}`}>La Musa</button>
          <button onClick={() => setActiveTab('moodboard')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'moodboard' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-primary'}`}>Moodboard</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visualizer' && (
          <motion.div 
            key="visualizer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="relative aspect-video bg-slate-900 rounded-[60px] overflow-hidden border-[10px] border-white shadow-2xl professional-shadow flex items-center justify-center group">
                {handImage ? (
                  <div className="relative w-full h-full">
                    <img src={handImage} className="w-full h-full object-cover" alt="Hand" />
                    {selectedDesign && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.8, scale: 1 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        {/* Semi-transparent design overlay - conceptually showing mapping */}
                        <div className="w-full h-full flex items-center justify-center p-20">
                           <div className="w-full aspect-video bg-primary/20 backdrop-blur-sm rounded-[40px] border-4 border-white/40 shadow-inner flex items-center justify-center">
                              <Sparkles size={100} className="text-white animate-pulse" />
                           </div>
                        </div>
                      </motion.div>
                    )}
                    <button 
                      onClick={() => setHandImage(null)}
                      className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-20 space-y-8">
                    <div className="w-24 h-24 bg-white/10 rounded-[35%] flex items-center justify-center mx-auto mb-6">
                      <Camera size={40} className="text-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-white font-h1 italic">Sube tu Foto</h3>
                    <p className="text-slate-400 max-w-sm italic">Para una mejor experiencia, toma la foto con buena luz y tu mano relajada sobre una superficie plana.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary py-5 px-10 text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/20"
                    >
                      Seleccionar Archivo
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  </div>
                )}
              </div>

              <div className="bg-pink-50/30 p-10 rounded-[50px] border border-pink-100 flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50">
                  <Brain size={32} className="text-primary mb-2" />
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">IA Engine</p>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-800 italic">Mapeo Biométrico en tiempo real</h4>
                  <p className="text-xs text-slate-500 italic mt-1">Nuestro sistema identifica la forma de tus uñas para aplicar el diseño de forma natural.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sistema Listo</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10 focus-mode-trigger">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-4 border-l-4 border-primary mb-8">Diseños para probar</h3>
                <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <button 
                      key={i}
                      onClick={() => setSelectedDesign(`design-${i}`)}
                      className={`aspect-square rounded-[32px] overflow-hidden border-4 transition-all ${selectedDesign === `design-${i}` ? 'border-primary scale-95 shadow-xl shadow-pink-100' : 'border-transparent hover:border-pink-200'}`}
                    >
                      <img src={`https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=200&auto=format&fit=crop&sig=${i}`} className="w-full h-full object-cover" alt="Design" />
                    </button>
                  ))}
                </div>
              </div>
              <button 
                disabled={!handImage || !selectedDesign}
                onClick={() => setView('booking')}
                className="w-full btn-primary py-6 flex items-center justify-center gap-4 text-xs shadow-2xl shadow-pink-100 disabled:opacity-30 group"
              >
                RESERVAR ESTE ESTILO <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'muse' && (
          <motion.div 
            key="muse"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto space-y-10"
          >
            <div className="bg-white p-12 rounded-[60px] border border-pink-100 shadow-2xl professional-shadow space-y-10 relative overflow-hidden">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-50 opacity-50 rounded-full blur-3xl" />
               
               <div className="relative z-10 text-center space-y-6">
                 <div className="w-20 h-20 bg-pink-50 rounded-[35%] flex items-center justify-center mx-auto border border-pink-100">
                   <Sparkles size={32} className="text-primary" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 font-h1 italic">Consulta a la Musa</h3>
                 <p className="text-slate-500 italic max-w-lg mx-auto">Describe tu outfit, el evento o simplemente tu humor, y nuestra IA creará un diseño único para ti.</p>
               </div>

               <div className="relative z-10 space-y-6">
                 <textarea 
                   value={musePrompt}
                   onChange={(e) => setMusePrompt(e.target.value)}
                   className="w-full bg-slate-50 border-none rounded-[40px] p-10 text-lg italic text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[200px]"
                   placeholder="Ej: 'Tengo una boda en la playa, mi vestido es verde esmeralda y quiero algo bohemio pero elegante'..."
                 />
                 <button 
                   onClick={generateDesign}
                   disabled={isGenerating || !musePrompt}
                   className="w-full btn-primary py-6 flex items-center justify-center gap-4 text-xs shadow-2xl shadow-pink-100 disabled:opacity-50 overflow-hidden relative group"
                 >
                   {isGenerating ? (
                     <div className="flex items-center gap-3">
                       <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                         <Sparkles size={20} />
                       </motion.div>
                       Canalizando inspiración...
                     </div>
                   ) : (
                     <span className="flex items-center gap-3">
                       GENERAR DISEÑO PERSONALIZADO <Brain size={20} />
                     </span>
                   )}
                 </button>
               </div>

               {aiSuggestion && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="relative z-10 pt-10 border-t border-pink-50 space-y-8"
                 >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="aspect-square bg-slate-100 rounded-[40px] overflow-hidden shadow-inner border border-pink-50 relative group">
                        <img src="https://images.unsplash.com/photo-1604654894611-6973b376cbdf?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Generated Design" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                           <p className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> Renderizado por Yulied AI</p>
                        </div>
                      </div>
                      <div className="space-y-6 flex flex-col justify-center">
                        <h4 className="text-3xl font-black text-slate-800 font-h1 italic">{aiSuggestion.name}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed italic">{aiSuggestion.description}</p>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-primary decoration-4 underline-offset-4">Técnica Recomendada</p>
                           <p className="text-xs font-bold text-slate-800 italic">{aiSuggestion.technicalDetails}</p>
                        </div>
                        <div className="flex gap-3">
                          {aiSuggestion.colorPalette?.map((c: string, idx: number) => (
                            <div key={idx} className="w-8 h-8 rounded-full border border-pink-100 shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <button 
                          onClick={() => saveToMoodboard({
                            title: aiSuggestion.name,
                            description: aiSuggestion.description,
                            image: 'https://images.unsplash.com/photo-1604654894611-6973b376cbdf?q=80&w=600&auto=format&fit=crop',
                            source: 'AI-Muse'
                          })}
                          className="w-full py-4 bg-pink-50 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-pink-100 hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Save size={14} /> Guardar en Colección
                        </button>
                      </div>
                    </div>
                 </motion.div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'moodboard' && (
          <motion.div 
            key="moodboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="bg-white p-10 rounded-[50px] border border-pink-100 shadow-2xl flex flex-col md:flex-row items-center gap-8">
              <div className="bg-pink-50 p-6 rounded-[35%]">
                <Instagram size={32} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-800 italic">Vincula desde Pinterest</h3>
                <p className="text-xs text-slate-500 italic mt-1">Pega el link de la foto que te inspiró y agrégala a tu tablero de estilo.</p>
              </div>
              <div className="flex flex-1 w-full gap-3">
                <input 
                  value={pinterestUrl}
                  onChange={(e) => setPinterestUrl(e.target.value)}
                  className="flex-1 bg-pink-50/30 border border-pink-100 rounded-2xl px-6 text-xs italic focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Pega el enlace de Pinterest aquí..."
                />
                <button 
                  onClick={importPinterest}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg"
                >
                  VINCULAR
                </button>
              </div>
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {moodboard.map(item => (
                <div key={item.id} className="break-inside-avoid bg-white rounded-[40px] border border-pink-50 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group professional-shadow">
                  <div className="relative overflow-hidden aspect-[3/4]">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
                    <div className="absolute top-6 right-6 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-primary border border-pink-50">
                      {item.source}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 gap-3">
                       <button 
                        onClick={() => setView('booking')}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary hover:scale-110 transition-transform shadow-xl"
                       >
                         <Calendar size={18} />
                       </button>
                       <button 
                        onClick={() => {
                          setHandImage(item.image);
                          setActiveTab('visualizer');
                        }}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary hover:scale-110 transition-transform shadow-xl"
                       >
                         <Eye size={18} />
                       </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-sm font-black text-slate-800 italic truncate">{item.title}</h4>
                    {item.description && <p className="text-[10px] text-slate-400 italic mt-2 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
              {moodboard.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Search size={40} className="mx-auto text-pink-100" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aún no tienes inspiración guardada</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingView = ({ setView }: { setView: (v: View) => void }) => {
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'promotions'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snap) => {
      const activePromos = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((p: any) => {
           if (!p.startDate || !p.endDate) return true;
           return today >= p.startDate && today <= p.endDate;
        })
        .slice(0, 3);
      setPromos(activePromos);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'promotions'));
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-20 py-10 relative overflow-hidden">
        <div className="flex-1 space-y-10 relative z-10">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block px-6 py-2 bg-pink-100 text-primary font-black text-xs uppercase tracking-[0.3em] rounded-full">Exclusividad & Estilo</span>
              <div className="h-[2px] w-12 bg-pink-100" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-800 leading-[1.1] font-h1 italic tracking-tight">
              Definiendo la <br />
              <span className="text-primary underline decoration-pink-100 decoration-8 underline-offset-8">Belleza</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl italic leading-relaxed font-medium">
              Elevando tu esencia a través de la excelencia. Descubre un ecosistema de bienestar donde cada detalle es una obra de arte diseñada para tu confianza.
            </p>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <button onClick={() => setView('booking')} className="btn-primary px-12 py-6 text-sm flex items-center justify-center gap-3">
              <Calendar size={20} /> RESERVAR CITA
            </button>
            <button onClick={() => setView('shop')} className="border-2 border-slate-800 text-slate-800 px-12 py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-3">
              <ShoppingBag size={20} /> VER TIENDA
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div className="relative w-full aspect-square max-w-xl mx-auto">
            <div className="absolute inset-0 bg-pink-100 rounded-[80px] rotate-6"></div>
            <div className="absolute inset-0 bg-primary rounded-[80px] -rotate-3 overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop" 
                alt="Nail Art" 
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      {promos.length > 0 && (
        <section className="space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-800 font-h1 italic tracking-tight">Promociones para Ti</h2>
            <p className="text-slate-500 italic">Ofertas exclusivas por tiempo limitado.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {promos.map(promo => (
              <div key={promo.id} className="bg-pink-900 p-10 rounded-[40px] text-white space-y-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full mb-6 inline-block">Flash Sale</span>
                  <h3 className="text-2xl font-black font-h1 italic underline decoration-pink-500 decoration-4">{promo.title}</h3>
                  <p className="text-sm text-pink-100 italic mt-4">{promo.description}</p>
                  <div className="mt-10 flex items-center justify-between gap-4">
                    <div className="bg-white/10 border border-white/20 px-6 py-4 rounded-2xl text-center flex-1">
                      <p className="text-[10px] font-bold text-pink-200 uppercase tracking-widest mb-1">CÓDIGO</p>
                      <p className="text-lg font-black tracking-tighter">{promo.code}</p>
                    </div>
                    <button onClick={() => setView('booking')} className="w-14 h-14 bg-white text-pink-900 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services Highlight Section */}
      <section className="space-y-14">
        <div className="flex justify-between items-end gap-6 pb-6 border-b border-pink-50">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-800 font-h1 italic tracking-tight">Servicios Destacados</h2>
            <p className="text-slate-500 italic">Tratamientos diseñados por expertas internacionales.</p>
          </div>
          <button 
            onClick={() => setView('services_list')}
            className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-2 transition-transform"
          >
            VER CATÁLOGO COMPLETO <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="bg-white p-2 rounded-[40px] border border-pink-50 shadow-sm overflow-hidden group">
            <div className="aspect-[4/3] rounded-[38px] overflow-hidden bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Manicura" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Popular</p>
                <h4 className="text-2xl font-black font-h1 italic">Manicura Premium</h4>
              </div>
            </div>
          </div>
          <div className="bg-white p-2 rounded-[40px] border border-pink-50 shadow-sm overflow-hidden group">
            <div className="aspect-[4/3] rounded-[38px] overflow-hidden bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Pedicura" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Exclusivo</p>
                <h4 className="text-2xl font-black font-h1 italic">Pedicura Spa</h4>
              </div>
            </div>
          </div>
          <div className="bg-white p-2 rounded-[40px] border border-pink-50 shadow-sm overflow-hidden group">
            <div className="aspect-[4/3] rounded-[38px] overflow-hidden bg-slate-100 relative">
              <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Tratamientos" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Relajante</p>
                <h4 className="text-2xl font-black font-h1 italic">Tratamientos Faciales</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden flex flex-col">
          <header className="px-8 py-6 border-b border-pink-50 flex justify-between items-center bg-pink-50/20">
            <h3 className="text-lg font-bold text-slate-800 font-h1 italic">Nuestra Agenda</h3>
            <button onClick={() => setView('booking')} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Revisar Disponibilidad</button>
          </header>
          <div className="p-8">
            <div className="space-y-4">
              <p className="text-sm text-slate-500 italic leading-relaxed">
                Agenda tu cita ahora para asegurar los mejores horarios de la temporada. Disponemos de nuevos espacios para técnica de uñas 3D y manicura Spa premium.
              </p>
              <button 
                onClick={() => setView('booking')}
                className="mt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest"
              >
                Ver Calendario <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Health Section */}
        <section className="bg-pink-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold font-h1 italic mb-6">Tu Fidelidad Premia</h3>
            <p className="text-pink-100 text-sm mb-8 leading-relaxed">Cada visita te acerca a servicios gratuitos y productos exclusivos. Acumula puntos hoy.</p>
            
            <div className="space-y-6">
              <button 
                onClick={() => setView('loyalty')}
                className="w-full py-3 bg-white text-pink-900 font-bold rounded-full text-xs uppercase tracking-widest hover:bg-pink-50 transition-colors shadow-lg"
              >
                Mis Puntos
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* AI Studio Feature */}
      <section className="bg-slate-900 rounded-[80px] p-12 md:p-20 text-white relative overflow-hidden professional-shadow">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-8">
              <span className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                 <Sparkles size={14} className="text-primary" /> NUEVA EXPERIENCIA IA
              </span>
              <h2 className="text-4xl md:text-6xl font-black font-h1 italic leading-tight">Visualiza tu Próximo Diseño</h2>
              <p className="text-slate-400 text-lg italic leading-relaxed">
                 Usa nuestra tecnología de vanguardia para probarte diseños en tiempo real o deja que nuestra IA diseñe algo exclusivo según tu outfit.
              </p>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setView('ai_studio')} className="bg-white text-slate-900 py-5 px-12 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-2xl">
                   PROBAR AI STUDIO
                 </button>
              </div>
           </div>
           <div className="relative aspect-square lg:aspect-video bg-white/5 rounded-[40px] border border-white/10 p-4 group">
              <img 
                src="https://images.unsplash.com/photo-1620331713240-ed6040a6e54f?q=80&w=800&auto=format&fit=crop" 
                className="w-full h-full object-cover rounded-[32px] opacity-80 group-hover:scale-105 transition-transform duration-1000"
                alt="AI Nail Design"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-20 h-20 bg-primary/40 backdrop-blur-3xl rounded-full flex items-center justify-center animate-pulse border border-white/20">
                    <Sparkles size={40} className="text-white" />
                 </div>
              </div>
              <div className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-pink-200">Reconocimiento Biométrico Activo</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-bold italic">Detectando contorno...</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};


const GridView = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const cells = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-2 font-h1 italic">Explorar Diseños de Uñas</h2>
          <p className="text-slate-500">Selecciona un cuadrante para ver diseños exclusivos y tendencias de la temporada.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-pink-100"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Libre</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-100"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservado</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-pink-200"></div><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tu Cita</span></div>
        </div>
      </div>

      <div className="aspect-square w-full max-w-2xl mx-auto grid grid-cols-10 gap-1.5 p-3 bg-pink-50/30 rounded-3xl border border-pink-100 shadow-inner overflow-hidden">
        {cells.map((i) => {
          const isOccupied = i % 7 === 0;
          const isReserved = i % 13 === 0;
          const isSelected = selected === i;

          return (
            <button
              key={i}
              onClick={() => !isOccupied && !isReserved && setSelected(i)}
              className={`aspect-square rounded-lg text-[10px] font-black transition-all duration-300 flex items-center justify-center ${
                isSelected 
                  ? 'bg-primary text-white scale-90 shadow-lg ring-4 ring-pink-100' 
                  : isOccupied 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40'
                  : isReserved
                  ? 'bg-pink-100 text-pink-400 cursor-not-allowed'
                  : 'bg-white text-slate-400 hover:text-primary hover:border-primary border border-pink-50 shadow-sm'
              }`}
            >
              {i}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-pink-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">ESPACIO ELEGIDO</p>
                <h4 className="text-xl font-black text-slate-800 font-h1 italic">Sección {selected}</h4>
              </div>
              <button 
                className="btn-primary"
                onClick={() => setSelected(null)}
              >
                Elegir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopView = ({ setView, cart, setCart }: { setView: (v: View) => void, cart: any[], setCart: any }) => {
  const [products, setProducts] = useState<any[]>([]);
  const { isAdmin, user } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
    return unsubscribe;
  }, []);

  const addToCart = (product: any) => {
    if (product.stock <= 0) return;
    setCart((prev: any[]) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Visual feedback could be added here
  };

  const removeFromCart = (productId: string) => {
    setCart((prev: any[]) => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev: any[]) => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateProductImage = async (id: string, newUrl: string) => {
    try {
      await updateDoc(doc(db, 'products', id), { image: newUrl });
      setSelectedProduct((prev: any) => ({ ...prev, image: newUrl }));
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `products/${id}`); }
  };

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [productReviews, setProductReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedProduct) return;
    const q = query(collection(db, 'reviews'), where('targetId', '==', selectedProduct.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => setProductReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'));
    return unsubscribe;
  }, [selectedProduct]);

  const submitReview = async () => {
    if (!user || !selectedProduct || !reviewComment) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Cliente',
        targetId: selectedProduct.id,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: serverTimestamp()
      });
      setReviewComment('');
      setReviewRating(5);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'reviews'); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-14 items-start pb-20">
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-pink-100 relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary shadow-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>

              <div className="md:w-1/2 p-10 bg-pink-50/20 overflow-y-auto custom-scrollbar">
                <div className="aspect-square rounded-[32px] overflow-hidden shadow-inner bg-white mb-6 relative group">
                  <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} loading="lazy" />
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                      <div className="bg-white p-6 rounded-[32px] w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Editar URL Imagen</p>
                        <input 
                          type="text" 
                          value={selectedProduct.image}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setSelectedProduct({...selectedProduct, image: newUrl});
                            updateDoc(doc(db, 'products', selectedProduct.id), { image: newUrl });
                          }}
                          className="w-full bg-slate-50 p-3 rounded-xl text-[10px] font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Review List */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" /> Reseñas de la Comunidad
                  </h4>
                  {productReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Aún no hay reseñas. ¡Sé el primero!</p>
                  ) : (
                    productReviews.map(r => (
                      <div key={r.id} className="bg-white p-6 rounded-2xl border border-pink-50/30">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-slate-800 uppercase">{r.userName}</p>
                          <div className="flex text-amber-400">
                             {[...Array(5)].map((_, i) => <Sparkles key={i} size={10} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "" : "text-slate-200"} />)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 italic leading-relaxed">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="md:w-1/2 p-10 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex-1">
                  <span className="inline-block px-4 py-2 bg-pink-50 text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-full mb-6">Nuevo Lanzamiento</span>
                  <h2 className="text-4xl font-black text-slate-800 font-h1 italic mb-4 leading-tight">{selectedProduct.name}</h2>
                  <p className="text-3xl font-black text-primary italic font-h1 mb-8">${selectedProduct.price?.toFixed(2)}</p>
                  
                  {isAdmin && (
                    <div className="mb-8 p-6 bg-pink-50/50 rounded-2xl border border-pink-100">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest block mb-3 italic">Editar URL de Imagen (Admin)</label>
                      <input 
                        type="text"
                        value={selectedProduct.image}
                        onChange={(e) => updateProductImage(selectedProduct.id, e.target.value)}
                        className="w-full bg-white border border-pink-100 rounded-xl px-4 py-3 text-xs outline-none focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  )}

                  <div className="space-y-6 mb-10">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 border-l-4 border-primary">Descripción Detallada</h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic">{selectedProduct.description}</p>
                  </div>

                  {/* Add Review Form */}
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deja tu Opinión</h4>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} className={`transition-all ${reviewRating >= star ? 'text-amber-400' : 'text-slate-200'}`}>
                          <Sparkles size={20} fill={reviewRating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      className="w-full bg-white p-4 rounded-xl text-xs italic outline-none border border-slate-100 focus:border-primary transition-all min-h-[80px]"
                      placeholder="Cuéntanos tu experiencia..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <button 
                      onClick={submitReview}
                      className="mt-4 w-full py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> Enviar Reseña
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-10 border-t border-pink-50 sticky bottom-0 bg-white">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock Disponible</span>
                    <span className="text-sm font-black text-slate-800">{selectedProduct.stock} unidades</span>
                  </div>
                  <button 
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    className="btn-primary w-full py-6 flex items-center justify-center gap-4 text-xs shadow-xl shadow-pink-100 disabled:opacity-50"
                  >
                    <ShoppingCart size={20} />
                    {selectedProduct.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full flex flex-col gap-14">
        <div>
          <h2 className="text-4xl font-black text-slate-800 mb-4 font-h1 italic">Esenciales de Manicura</h2>
          <p className="text-slate-500 font-medium max-w-xl italic">Herramientas y esmaltes de grado profesional seleccionados por expertos para tu cuidado personal.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
          {products.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-pink-100 rounded-[40px]">
              <ShoppingBag size={48} className="mx-auto text-pink-100 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando productos...</p>
            </div>
          ) : (
            products.map(p => (
              <motion.article 
                key={p.id} 
                whileHover={{ y: -10 }}
                onClick={() => setSelectedProduct(p)} 
                className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-pink-50 flex flex-col group h-full hover:shadow-2xl transition-all duration-500 cursor-pointer"
              >
                <div className="aspect-[4/3] bg-pink-50/20 overflow-hidden relative">
                  <img 
                    src={p.image || 'https://images.unsplash.com/photo-1634712282287-14ed57b9cc89?q=80&w=400&auto=format&fit=crop'} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
                    <span className="text-lg font-black text-primary font-h1 italic">${p.price?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-10 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-tight">{p.name}</h3>
                  <p className="text-sm text-slate-500 mb-10 flex-1 line-clamp-3 leading-relaxed italic">{p.description}</p>
                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      disabled={p.stock <= 0}
                      className="flex-1 btn-primary py-4 flex items-center justify-center gap-3 text-xs disabled:opacity-50"
                    >
                      <ShoppingCart size={18} />
                      {p.stock > 0 ? 'Añadir' : 'Agotado'}
                    </button>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Disponibles</p>
                      <p className="text-sm font-black text-slate-600">{p.stock || 0}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>

      <aside className="w-full lg:w-96 lg:shrink-0 lg:sticky lg:top-32">
        <div className="bg-white rounded-[40px] border border-pink-100 shadow-2xl flex flex-col p-10 professional-shadow">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-primary">
                <ShoppingBag size={20} />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Resumen</h2>
            </div>
            <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg shadow-pink-200">{cartItemsCount} {cartItemsCount === 1 ? 'ITEM' : 'ITEMS'}</span>
          </div>
          
          <div className="space-y-6 mb-12 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart size={32} className="mx-auto text-pink-100 mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-5 p-4 bg-pink-50/20 rounded-3xl border border-pink-100/50 group relative">
                  <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm border border-pink-50">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-1">{item.name}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-black text-primary italic">${item.price?.toFixed(2)}</p>
                      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl shadow-sm border border-pink-50">
                        <button onClick={() => updateCartQuantity(item.id, -1)} className="text-slate-400 hover:text-primary"><Plus size={10} className="rotate-45" /></button>
                        <span className="text-[10px] font-black text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, 1)} className="text-slate-400 hover:text-primary"><Plus size={10} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-pink-100 pt-8 mb-10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
              <span className="font-black text-slate-800">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Envío</span>
              <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">{cartTotal > 100 ? 'Gratis' : '$10.00'}</span>
            </div>
            <div className="flex justify-between items-center border-t border-pink-50 pt-5 mt-5">
              <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Total</span>
              <span className="text-3xl font-black text-primary italic font-h1">${(cartTotal + (cartTotal > 100 ? 0 : (cart.length > 0 ? 10 : 0))).toFixed(2)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setView('checkout')} 
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 group text-xs shadow-xl shadow-pink-100 disabled:opacity-50"
          >
            Finalizar Compra
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </aside>
    </div>
  );
};

const BookingView = () => {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const sQuery = query(collection(db, 'services'));
    const aQuery = query(collection(db, 'availability'), orderBy('date', 'asc'));
    
    const unsubS = onSnapshot(sQuery, (snap) => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'services'));
    const unsubA = onSnapshot(aQuery, (snap) => {
      const today = new Date().toISOString().split('T')[0];
      const valid = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter((a: any) => a.date >= today);
      setAvailability(valid);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'availability'));
    
    return () => { unsubS(); unsubA(); };
  }, []);

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user?.uid,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: `${selectedDate} ${selectedTime}`,
        status: 'pending',
        notes: notes,
        createdAt: serverTimestamp()
      });
      alert('Cita reservada con éxito. Te avisaremos cuando sea confirmada.');
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'bookings');
    }
  };

  const getAvailableSlots = () => {
    const day = availability.find(a => a.date === selectedDate);
    return day ? day.slots : [];
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-14 py-10">
      <div className="text-center">
        <h2 className="text-5xl font-black text-slate-800 mb-4 font-h1 italic tracking-tight underline decoration-pink-100 decoration-8 underline-offset-8">Reserva tu Momento</h2>
        <p className="text-slate-500 font-medium italic mt-4">Nuestra agenda inteligente te ayuda a encontrar el espacio perfecto para tu cuidado personal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
        {/* Step 1: Services */}
        <section className="lg:col-span-4 space-y-10">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] pl-4 border-l-4 border-primary">1. Elige un Servicio</h3>
          <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedService(s)}
                className={`p-10 rounded-[40px] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden group ${
                  selectedService?.id === s.id 
                    ? 'bg-primary text-white border-primary shadow-2xl scale-[1.02]' 
                    : 'bg-white text-slate-600 border-pink-50 hover:border-primary shadow-sm hover:shadow-xl'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <h4 className="font-black text-xl font-h1 italic leading-tight">{s.name}</h4>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    selectedService?.id === s.id ? 'bg-white/20' : 'bg-pink-50 group-hover:bg-primary/10'
                  }`}>
                    <ChevronRight size={20} className={selectedService?.id === s.id ? 'text-white' : 'text-primary'} />
                  </div>
                </div>
                <p className={`text-sm font-medium italic leading-relaxed line-clamp-2 relative z-10 ${selectedService?.id === s.id ? 'text-pink-50' : 'text-slate-400'}`}>
                  {s.description}
                </p>
                <p className={`text-xs font-black uppercase tracking-widest relative z-10 mt-2 ${selectedService?.id === s.id ? 'text-white' : 'text-primary'}`}>
                  ${s.price}
                </p>
                {selectedService?.id === s.id && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Date & Slots */}
        <section className="lg:col-span-8 space-y-10">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] pl-4 border-l-4 border-primary">2. Fecha, Horario y Notas</h3>
          <div className="bg-white p-12 rounded-[50px] border border-pink-50 shadow-2xl professional-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-6 pl-2">Selecciona un Día</label>
                <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                  {availability.map(day => (
                    <button 
                      key={day.id}
                      onClick={() => { setSelectedDate(day.date); setSelectedTime(''); }}
                      className={`p-6 rounded-[24px] border-2 transition-all flex items-center justify-between group ${
                        selectedDate === day.date 
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-50 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Calendar size={18} className={selectedDate === day.date ? 'text-primary' : 'text-slate-300'} />
                        <div>
                          <span className={`text-sm font-black italic block ${selectedDate === day.date ? 'text-slate-800' : 'text-slate-500'}`}>{day.date}</span>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="flex h-1 gap-0.5">
                               {[1, 2, 3, 4, 5].map((s, idx) => (
                                 <div key={idx} className={`w-3 rounded-full ${idx < (day.slots?.length || 0) / 2 ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                               ))}
                             </div>
                             <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Ocupación Alta</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`transition-all ${selectedDate === day.date ? 'text-primary translate-x-1' : 'text-slate-200'}`} />
                    </button>
                  ))}
                  {availability.length === 0 && <p className="text-sm text-slate-400 italic text-center py-10">No hay fechas disponibles próximas.</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-6 pl-2">Horas Disponibles</label>
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 h-[350px]">
                    <Clock size={48} className="text-slate-200 mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Selecciona un día para ver horarios</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {getAvailableSlots().map((time: string) => (
                      <button 
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedTime === time 
                            ? 'bg-primary text-white shadow-xl shadow-pink-200 scale-105' 
                            : 'bg-white border border-pink-50 text-slate-500 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                    {getAvailableSlots().length === 0 && <p className="col-span-full text-xs text-slate-400 italic text-center py-10">Todo reservado para este día.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4 pl-2">Notas Especiales o Solicitudes</label>
              <textarea 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl p-6 text-sm italic outline-none focus:border-primary transition-all min-h-[120px]"
                placeholder="Ej: Alergias, diseño específico, o alguna solicitud especial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="mt-14 pt-10 border-t border-pink-50 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Resumen de Reserva</h4>
                <div className="space-y-2">
                  <p className="text-sm font-black text-slate-800 italic">
                    {selectedService?.name || '---'} {selectedDate ? `• ${selectedDate}` : ''} {selectedTime ? `• ${selectedTime}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 italic">Confirmación instantánea vía email & app.</p>
                </div>
              </div>
              <button 
                disabled={!selectedService || !selectedDate || !selectedTime}
                onClick={handleBooking}
                className="w-full md:w-auto btn-primary px-16 py-6 uppercase tracking-[0.2em] text-xs shadow-2xl shadow-pink-100 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                Confirmar ahora <ChevronRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const LoyaltyView = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // Listen for points logs
    const qLogs = query(collection(db, 'points_logs'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.LIST, 'points_logs'));

    // Listen for user data (points)
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserPoints(snap.data().points || 0);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => { unsubLogs(); unsubUser(); };
  }, [user]);

  const nextLevel = 15000;
  const progressPercent = Math.min(100, Math.floor((userPoints / nextLevel) * 100));

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-pink-900 rounded-3xl p-10 shadow-2xl border border-pink-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-10">
            <div>
              <span className="text-[10px] font-bold text-pink-300 mb-2 block uppercase tracking-[0.2em]">Membresía Activa</span>
              <div className="flex items-center gap-4">
                <Award className="text-white" size={40} />
                <h2 className="text-3xl font-black text-white font-h1 italic">{userPoints > 10000 ? 'Elite Platinum' : 'Aspirante Gold'}</h2>
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold text-pink-300 mb-2 block uppercase tracking-[0.2em]">Puntos de Belleza</span>
              <div className="text-5xl font-black text-white italic font-h1">{userPoints.toLocaleString()}</div>
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs text-pink-100">Próximo Nivel: <strong>Emerald</strong> ({nextLevel.toLocaleString()} pts)</span>
              <span className="text-[10px] font-black text-white tracking-widest bg-pink-400 px-2.5 py-1 rounded-full shadow-sm">{progressPercent}% COMPLETADO</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.6)]" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-4 grid grid-cols-1 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-pink-50 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-3xl font-black text-slate-800 italic font-h1">{(userPoints / 1000).toFixed(0)}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Recompensas Posibles</span>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-pink-50 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-pink-50 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <span className="text-3xl font-black text-slate-800 italic font-h1">x1</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Multiplicador Base</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 pl-4 border-l-4 border-primary">Historial de Puntos</h3>
          <div className="grid grid-cols-1 gap-4">
            {logs.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Aún no tienes actividad registrada</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white p-6 rounded-[32px] border border-pink-50 shadow-sm flex justify-between items-center group hover:border-primary transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-pink-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 italic text-lg font-h1">{log.reason}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.createdAt?.toDate()).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-primary italic">+{log.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { profile, user, updatePasswordDirectly } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Security State
  const [showPassChange, setShowPassChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Payment Methods (Mocked for UI)
  const [cards, setCards] = useState([
    { id: '1', last4: '4242', brand: 'visa', exp: '12/26' }
  ]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phone,
        address,
        photoURL
      });
      setIsEditing(false);
      alert("Perfil actualizado con éxito.");
    } catch (e: any) {
      console.error(e);
      alert("Error al actualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) return alert("Las contraseñas no coinciden.");
    if (newPass.length < 6) return alert("Mínimo 6 caracteres.");

    setPassLoading(true);
    try {
      await updatePasswordDirectly(newPass);
      alert("Contraseña actualizada con éxito.");
      setNewPass('');
      setConfirmPass('');
      setShowPassChange(false);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        alert("Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña.");
        signOut(auth);
      } else {
        alert("Error: " + e.message);
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow gap-6 transition-all duration-500">
        <div>
          <h2 className="text-4xl font-black text-slate-800 font-h1 italic tracking-tight">Mi Perfil</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium italic">Gestiona tus datos, seguridad y pagos.</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center gap-3 px-8 py-4 text-xs shadow-xl shadow-pink-100/50">
            <Settings size={18} /> EDITAR PERFIL
          </button>
        ) : (
          <div className="flex gap-4">
            <button onClick={() => setIsEditing(false)} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
               CANCELAR
            </button>
            <button 
              disabled={loading}
              onClick={handleSaveProfile} 
              className="btn-primary flex items-center gap-3 px-8 py-4 text-xs shadow-xl shadow-pink-100"
            >
              <Save size={18} /> {loading ? 'GUARDANDO...' : 'GUARDAR DATOS'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-10">
          {/* Profile Card */}
          <div className="bg-white rounded-[40px] p-10 border border-pink-50 shadow-sm professional-shadow">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pl-2 border-l-4 border-primary">Información Personal</h3>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="relative group mx-auto md:mx-0">
                <div className="w-40 h-40 rounded-[48px] bg-pink-100 overflow-hidden border-4 border-white shadow-2xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                  <img 
                    src={photoURL || "https://i.pravatar.cc/150?u="+user?.uid} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    alt="Profile"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2">
                         <Upload className="text-white" size={32} />
                         <span className="text-[9px] text-white font-black uppercase tracking-widest">Cambiar</span>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await fileToBase64(file);
                            setPhotoURL(base64);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Nombre Completo</label>
                    <input 
                      disabled={!isEditing}
                      className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-black italic outline-none focus:border-primary disabled:opacity-70 transition-all"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Teléfono Celular</label>
                    <input 
                      disabled={!isEditing}
                      className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-black italic outline-none focus:border-primary disabled:opacity-70 transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Dirección de Residencia</label>
                  <input 
                    disabled={!isEditing}
                    className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-black italic outline-none focus:border-primary disabled:opacity-70 transition-all"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-[40px] p-10 border border-pink-50 shadow-sm professional-shadow">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pl-2 border-l-4 border-primary">Seguridad y Acceso</h3>
            {showPassChange ? (
              <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Nueva Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'}
                        className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-black italic outline-none focus:border-primary transition-all"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Confirmar Contraseña</label>
                    <input 
                      type={showPass ? 'text' : 'password'}
                      className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-6 py-3.5 text-sm font-black italic outline-none focus:border-primary transition-all"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    disabled={passLoading}
                    type="submit" 
                    className="btn-primary px-8 py-3.5 text-xs tracking-widest shadow-lg shadow-pink-100"
                  >
                    {passLoading ? 'ACTUALIZANDO...' : 'GUARDAR CONTRASEÑA'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPassChange(false)}
                    className="px-6 py-3.5 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    CANCELAR
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-slate-50/30 rounded-3xl border border-slate-100 gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-primary">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800 italic uppercase">Autenticación</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Doble verificación en cada cambio</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPassChange(true)}
                  className="w-full md:w-auto px-10 py-4 bg-white border border-pink-100 rounded-2xl text-[10px] font-black text-primary uppercase tracking-[0.15em] hover:bg-pink-50 transition-all shadow-sm"
                >
                  CAMBIAR CONTRASEÑA
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-10">
          <div className="bg-white rounded-[40px] p-10 border border-pink-50 shadow-sm professional-shadow">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pl-2 border-l-4 border-primary">Métodos de Pago</h3>
            <div className="space-y-4 mb-8">
              {cards.map(card => (
                <div key={card.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group relative hover:border-primary transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-primary transition-colors">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700 italic">•••• {card.last4}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.brand.toUpperCase()} - {card.exp}</p>
                    </div>
                  </div>
                  <button className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full py-5 border-2 border-dashed border-pink-100 rounded-[32px] text-[10px] font-black text-primary uppercase tracking-widest hover:bg-pink-50 hover:border-primary transition-all flex items-center justify-center gap-3">
              <Plus size={18} /> AGREGAR TARJETA
            </button>
          </div>

          <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl text-white relative overflow-hidden group">
             <div className="relative z-10 transition-transform duration-500 group-hover:translate-y-[-4px]">
               <h4 className="text-2xl font-black italic mb-2 font-h1 tracking-tight">Club Platinum</h4>
               <p className="text-pink-400 text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Sparkles size={12} /> Beneficios Exclusivos
               </p>
               <ul className="space-y-5">
                 {[
                   'Prioridad Total',
                   '15% Descuento',
                   'Envíos Gratis',
                   'Eventos VIP'
                 ].map((ben, i) => (
                   <li key={i} className="flex items-center gap-4 text-[11px] font-bold text-slate-300 italic group-hover:text-white transition-colors">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {ben}
                   </li>
                 ))}
               </ul>
             </div>
             <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-700" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -ml-16 -mb-16" />
          </div>
        </section>
      </div>
    </div>
  );
};

const MessagingView = () => (
  <div className="h-[calc(100vh-160px)] flex flex-col bg-white rounded-3xl border border-pink-50 shadow-xl overflow-hidden professional-shadow">
    <header className="p-8 border-b border-pink-50 flex items-center justify-between bg-pink-50/20">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black shadow-lg">YP</div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-h1 italic">Soporte Yulied Play</h3>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span> PERSONAL EN LÍNEA
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2.5 text-pink-400 hover:bg-pink-100 rounded-full transition-all"><Phone size={20} /></button>
        <button className="p-2.5 text-pink-400 hover:bg-pink-100 rounded-full transition-all"><Settings size={20} /></button>
      </div>
    </header>
    
    <div className="flex-1 overflow-y-auto p-10 space-y-8">
      {[
        { role: 'support', text: '¡Hola! Bienvenida al canal de atención exclusiva. ¿En qué podemos ayudarte hoy?', time: '09:41 AM' },
        { role: 'user', text: 'Quisiera saber si tienen disponibilidad para una manicura spa este viernes.', time: '09:42 AM' },
        { role: 'support', text: '¡Claro! El viernes tenemos espacios disponibles a las 10:00 AM y 4:00 PM. ¿Te gustaría agendar alguno?', time: '09:43 AM' },
      ].map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-3xl px-6 py-4 text-xs shadow-sm ${
            msg.role === 'user' 
              ? 'bg-primary text-white rounded-tr-none' 
              : 'bg-pink-50 text-slate-800 rounded-tl-none border border-pink-100'
          }`}>
            <p className="leading-relaxed font-medium">{msg.text}</p>
            <p className={`text-[9px] mt-3 font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-pink-100' : 'text-pink-400'}`}>
              {msg.time}
            </p>
          </div>
        </div>
      ))}
    </div>
    
    <div className="p-8 bg-pink-50/20 border-t border-pink-50">
      <div className="flex gap-4 items-center bg-white border border-pink-100 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner">
        <button className="p-3 text-pink-300 hover:text-primary transition-colors"><Paperclip size={20} /></button>
        <input type="text" className="flex-1 h-12 px-2 text-xs text-slate-700 focus:outline-none font-medium" placeholder="Escribe tu mensaje aquí..." />
        <button className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-pink-600 shadow-lg transition-all active:scale-90">
          <Send size={18} />
        </button>
      </div>
    </div>
  </div>
);

const HelpCenterView = () => (
  <div className="space-y-16 max-w-5xl mx-auto py-10">
    <section className="text-center">
      <h2 className="text-4xl font-black text-slate-800 tracking-tight font-h1 italic">Centro de Estética & Ayuda</h2>
      <p className="text-slate-500 mt-4 max-w-xl mx-auto">Encuentra guías sobre cuidado de uñas, protocolos de higiene y gestión de tu cuenta.</p>
      <div className="mt-10 max-w-2xl mx-auto relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-200 group-focus-within:text-primary transition-colors" size={24} />
        <input className="w-full h-16 pl-16 pr-8 bg-white border-2 border-pink-50 rounded-3xl shadow-xl professional-shadow focus:border-primary outline-none text-sm transition-all focus:ring-8 focus:ring-primary/5 italic" placeholder="¿Cómo cuidar mis uñas acrílicas?..." />
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {[
        { title: 'Protocolos SPA', desc: 'Conoce nuestros estándares de higiene y esterilización.', icon: '✨' },
        { title: 'Pagos y Reembolsos', desc: 'Información sobre métodos de pago y políticas de cancelación.', icon: '💳' },
        { title: 'Guía de Tratatamientos', desc: 'Descubre qué técnica es la mejor para el tipo de tus uñas.', icon: '💅' },
      ].map((cat, i) => (
        <div key={i} className="bg-white p-10 rounded-3xl border border-pink-50 shadow-sm hover:border-primary transition-all group cursor-pointer hover:shadow-xl">
          <div className="text-4xl mb-6 group-hover:scale-125 transition-transform inline-block duration-500">{cat.icon}</div>
          <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors uppercase tracking-widest">{cat.title}</h3>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{cat.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const CheckoutView = ({ cart, setCart, setView }: { cart: any[], setCart: (c: any[]) => void, setView: (v: View) => void }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : (cart.length > 0 ? 10 : 0);
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const batch = writeBatch(db);
      
      // Create Order
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        userId: user?.uid,
        items: cart,
        subtotal,
        shipping,
        total,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update Stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      }

      await batch.commit();
      
      setCart([]);
      alert('¡Compra realizada con éxito! Recibirás los detalles por correo.');
      setView('landing');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'checkout/transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-pink-900 text-white flex items-center justify-center rounded-full text-[10px] font-black shadow-lg">1</div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-h1 italic">Datos de Envío</h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
              <input className="bg-pink-50/20 border border-pink-100 rounded-2xl h-14 px-6 text-xs focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="Tu nombre" />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
              <input className="bg-pink-50/20 border border-pink-100 rounded-2xl h-14 px-6 text-xs focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="+57 ..." />
            </div>
            <div className="flex flex-col gap-3 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección de Entrega</label>
              <input className="bg-pink-50/20 border border-pink-100 rounded-2xl h-14 px-6 text-xs focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" placeholder="Calle, ciudad, barrio..." />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-pink-900 text-white flex items-center justify-center rounded-full text-[10px] font-black shadow-lg">2</div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-h1 italic">Método de Pago</h2>
          </div>
          <div className="space-y-5">
            <div className="p-8 bg-white border-2 border-primary rounded-[32px] flex items-center justify-between shadow-xl shadow-pink-100 professional-shadow">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"><CreditCard size={20} /></div>
                <div>
                  <div className="text-xs font-black text-slate-800 uppercase tracking-widest">Tarjeta Guardada</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visa •••• 4242</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary italic">ACTIVO</span>
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14} /></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="bg-pink-900 rounded-[50px] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col border border-pink-800 professional-shadow min-h-[600px]">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-pink-500 opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-pink-400 opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <h2 className="text-3xl font-black mb-12 tracking-tight font-h1 italic relative z-10 border-b border-white/10 pb-6">Tu Pedido</h2>
        
        <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar relative z-10 mb-10">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{item.name}</p>
                  <p className="text-[10px] text-pink-300 font-medium italic mt-1">{item.quantity} unidades • ${item.price}</p>
                </div>
              </div>
              <span className="text-sm font-black font-h1 italic">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-20 opacity-40">
              <ShoppingCart size={48} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Carrito Vacío</p>
            </div>
          )}
        </div>

        <div className="space-y-6 relative z-10 bg-white/5 p-8 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center text-pink-200 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Productos</span>
            <span className="text-white text-lg">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-pink-200 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>Envío Premium</span>
            <span className={shipping === 0 ? "text-emerald-400 text-lg" : "text-white text-lg"}>
              {shipping === 0 ? 'GRATIS' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="border-t border-white/20 pt-6 mt-6 flex justify-between items-end">
            <div>
              <span className="text-[10px] text-pink-200 font-bold uppercase tracking-[0.2em] mb-2 block">Total Final</span>
              <span className="text-2xl font-black text-pink-200 line-through opacity-50 mr-3 italic">${(total * 1.2).toFixed(2)}</span>
            </div>
            <span className="text-6xl font-black text-white italic font-h1 leading-none">${total.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className="mt-12 w-full h-20 bg-white text-pink-900 font-black text-sm uppercase tracking-[0.3em] rounded-[28px] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-2xl relative z-10 group disabled:opacity-50 flex items-center justify-center gap-4 overflow-hidden"
        >
          {isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkles size={24} />
            </motion.div>
          ) : (
            <>
              Confirmar & Pagar
              <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </button>
      </aside>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { user, profile, loading, isAdmin } = useAuth();
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yulied_view');
      if (saved) return saved as View;
    }
    return 'landing';
  });

  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem('yulied_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    localStorage.setItem('yulied_cart', JSON.stringify(cart));
  }, [cart]);

  // Listen for new products or promos to simulate push notifications
  useEffect(() => {
    if (!user) return;
    const qP = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(1));
    const unsubP = onSnapshot(qP, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data() as any;
          setNotifications(prev => [{
            id: Date.now(),
            title: '¡Nueva Llegada!',
            message: `${data.name} ya está disponible en la tienda.`,
            time: new Date()
          }, ...prev].slice(0, 5));
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, 'products'));
    return () => unsubP();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('yulied_view', view);
  }, [view]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedback = async (rating: number, comment: string) => {
    try {
      await addDoc(collection(db, 'feedback'), {
        rating,
        comment,
        userId: user?.uid || 'anonymous',
        targetType: 'general',
        targetId: 'app',
        createdAt: serverTimestamp()
      });
      setShowFeedback(false);
      alert('¡Gracias por tu reseña!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'feedback');
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'landing': return 'Panel Principal';
      case 'services_list': return 'Catálogo de Servicios';
      case 'grid': return 'Explorar Diseños';
      case 'shop': return 'Tienda de Productos';
      case 'booking': return 'Calendario de Citas';
      case 'loyalty': return 'Mis Beneficios';
      case 'settings': return 'Configuración';
      case 'messaging': return 'Consultas';
      case 'help': return 'Centro de Ayuda';
      case 'checkout': return 'Finalizar Compra';
      case 'admin': return 'Panel de Administración';
      default: return 'Mi Perfil';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-primary"
        >
          <Sparkles size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderView = () => {
    switch(view) {
      case 'landing': return <LandingView setView={setView} />;
      case 'services_list': return <ServicesView setView={setView} />;
      case 'ai_studio': return <AIStudioView setView={setView} />;
      case 'grid': return <GridView />;
      case 'shop': return <ShopView setView={setView} cart={cart} setCart={setCart} />;
      case 'booking': return <BookingView />;
      case 'loyalty': return <LoyaltyView />;
      case 'settings': return <SettingsView />;
      case 'messaging': return <MessagingView />;
      case 'help': return <HelpCenterView />;
      case 'checkout': return <CheckoutView cart={cart} setCart={setCart} setView={setView} />;
      case 'admin': return isAdmin ? <AdminView /> : <LandingView setView={setView} />;
      default: return <LandingView setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-pink-100 selection:text-primary">
      <Sidebar activeView={view} setView={(v) => { setView(v); setIsSidebarOpen(false); }} />
      
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TopBar 
          title={getTitle()} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />
        
        <main className="flex-1 p-6 md:p-10 lg:p-14 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="p-10 border-t border-pink-50 bg-white/50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2024 Yulied Play Boutique. Designed with Elegance.</p>
        </footer>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55]"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-0 z-[60] bg-white w-72 md:hidden shadow-2xl"
            >
              <Sidebar activeView={view} setView={(v) => { setView(v); setIsSidebarOpen(false); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
        onFeedbackSubmit={handleFeedback}
      />

      {/* Floating Feedback Trigger */}
      <button 
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-28 md:bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-pink-50 px-6 flex items-center justify-between z-[55] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: 'landing', icon: Grid3X3, label: 'Inicio' },
          { id: 'booking', icon: Calendar, label: 'Reserva' },
          { id: 'shop', icon: ShoppingBag, label: 'Tienda' },
          { id: 'loyalty', icon: Award, label: 'Puntos' },
          { id: 'settings', icon: Settings, label: 'Menu' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col items-center gap-1 transition-all ${view === item.id ? 'text-primary' : 'text-slate-300'}`}
          >
            <item.icon size={20} className={view === item.id ? 'scale-110' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            {view === item.id && <motion.div layoutId="mobileTab" className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
