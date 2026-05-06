import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  where
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { 
  Grid3X3, 
  ShoppingBag, 
  Calendar, 
  Award, 
  Sparkles, 
  Plus, 
  CreditCard, 
  Clock, 
  Trash2, 
  Phone, 
  MessageSquare,
  Upload,
  Paperclip,
  CheckCircle2,
  Bell,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminView = () => {
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'services' | 'products' | 'customers' | 'promos' | 'slots' | 'bookings' | 'orders'>('services');
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

  const updateItem = async (col: string, id: string, data: any) => {
    try {
      await updateDoc(doc(db, col, id), data);
    } catch (e) {
      showStatus('error', 'Error al actualizar elemento. Verifica permisos.');
      handleFirestoreError(e, OperationType.UPDATE, `${col}/${id}`);
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
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'promotions'); }
  };

  const updatePromoField = async (id: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'promotions', id), { [field]: value });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `promotions/${id}`); }
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
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'products'); }
  };

  const updateProductField = async (id: string, field: string, value: any) => {
    try {
      await updateDoc(doc(db, 'products', id), { [field]: value });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `products/${id}`); }
  };

  const addAvailability = async (date: string, slots: string[]) => {
    try {
      await addDoc(collection(db, 'availability'), { date, slots, createdAt: serverTimestamp() });
      showStatus('success', 'Agenda actualizada.');
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'availability'); }
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await updateDoc(doc(db, itemToDelete.col, itemToDelete.id), { deleted: true });
      showStatus('success', 'Elemento eliminado.');
      setItemToDelete(null);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `${itemToDelete.col}/${itemToDelete.id}`); }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalBookings = bookings.length;

  const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.minStock || 5));

  // Real-time chart data
  const revenueData = orders.map(o => ({
    name: o.createdAt?.toDate?.()?.toLocaleDateString() || 'Hoy',
    total: o.total || (o.price * o.quantity)
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
          { label: 'Citas Totales', value: totalBookings, trend: `${pendingBookings} pendientes`, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
          { label: 'Clientes Base', value: customers.length, trend: 'Crecimiento constante', icon: Award, color: 'bg-purple-50 text-purple-600' },
          { label: 'Ventas Productos', value: orders.length, trend: 'Nuevos pedidos hoy', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
          { label: 'Recaudado (E-Shop)', value: `$${revenueData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}`, trend: 'Mensual estimado', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
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
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
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
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  cursor={{ fill: '#fdf2f8', radius: 12 }}
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
            { id: 'customers', label: 'Clientes', icon: Award },
            { id: 'bookings', label: 'Citas', icon: Calendar },
            { id: 'orders', label: 'Pedidos', icon: ShoppingBag }
          ].map((tab) => (
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
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Gestión de Cupones</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const msg = "¡Nueva promoción en Yulied Play! Mira nuestras ofertas actuales en la app.";
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="btn-secondary px-6 py-4 rounded-[24px] text-[10px] flex items-center gap-2 bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <Phone size={16} /> DIFUSIÓN WHATSAPP
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
                    className="text-2xl font-black text-slate-800 font-h1 italic bg-transparent outline-none w-full"
                    value={promo.title}
                    onChange={(e) => updatePromoField(promo.id, 'title', e.target.value)}
                    placeholder="Título de promo"
                  />
                  <button 
                    onClick={() => {
                      const msg = `¡Hola! Tenemos una promoción para ti: ${promo.title}. Usa el código ${promo.code} para un descuento especial.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="text-emerald-500 hover:scale-110 transition-transform"
                  >
                    <Phone size={20} />
                  </button>
                </div>
                <input 
                  className="text-xs font-black text-primary uppercase tracking-widest bg-pink-50/50 px-4 py-2 rounded-lg w-full outline-none"
                  value={promo.code}
                  onChange={(e) => updatePromoField(promo.id, 'code', e.target.value)}
                  placeholder="CÓDIGO"
                />
                <textarea 
                  className="w-full bg-slate-50 p-4 rounded-2xl text-xs italic outline-none min-h-[80px]"
                  value={promo.description}
                  onChange={(e) => updatePromoField(promo.id, 'description', e.target.value)}
                  placeholder="Descripción..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Desde</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 px-4 py-3 rounded-xl text-[10px] outline-none"
                      value={promo.startDate || ''}
                      onChange={(e) => updatePromoField(promo.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hasta</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 px-4 py-3 rounded-xl text-[10px] outline-none"
                      value={promo.endDate || ''}
                      onChange={(e) => updatePromoField(promo.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center bg-pink-50/30 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</span>
                  <button 
                    onClick={() => updatePromoField(promo.id, 'active', !promo.active)}
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
                const s = e.target.slots.value.split(',').map((item: string) => item.trim());
                if (d && s.length > 0) addAvailability(d, s);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {availability.map(day => (
                  <div key={day.id} className="bg-white p-8 rounded-[32px] border border-pink-50 shadow-sm relative group hover:shadow-xl transition-all duration-500">
                    <button 
                      onClick={() => setItemToDelete({ col: 'availability', id: day.id })}
                      className="absolute top-6 right-6 w-8 h-8 bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-100"
                    >
                      <Plus size={16} className="rotate-45" />
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar size={18} className="text-primary" />
                      <h5 className="text-sm font-black text-slate-800">{day.date}</h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.slots?.map((s: string) => (
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
              <h3 className="text-xl font-black text-slate-800 font-h1 italic tracking-tight">Directorio de Clientes</h3>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-pink-50 bg-pink-50/10">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cliente</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Puntos</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Historial</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nivel</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Última Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {customers.map(c => {
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
                        <td className="px-10 py-6 text-sm font-black text-primary italic">
                          {c.points || 0}
                        </td>
                        <td className="px-10 py-6">
                          <button 
                            onClick={() => setSelectedCustomer(c)}
                            className="bg-slate-100 text-slate-600 text-[10px] font-black px-4 py-2 rounded-full border border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all"
                          >
                            VER FICHA
                          </button>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`status-pill ${c.points > 5000 ? 'pill-green' : 'pill-pink'}`}>
                            {c.points > 5000 ? 'Platinum' : 'Standard'}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-[10px] font-medium text-slate-500 italic">
                            {c.lastLogin?.toDate?.()?.toLocaleDateString() || 'Reciente'}
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
                              <MapPinIcon size={10} /> {selectedCustomer.address}
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
                      <button onClick={() => setSelectedCustomer(null)} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
                        <Plus className="rotate-45" size={24} />
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="border-b border-pink-50 pb-4 mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Citas</h3>
                        {bookings.filter(b => b.userId === selectedCustomer.id).length === 0 ? (
                          <p className="py-4 text-slate-400 italic text-xs">No hay historial de citas disponible.</p>
                        ) : (
                          bookings.filter(b => b.userId === selectedCustomer.id).map((b, i) => (
                            <div key={i} className="flex justify-between items-center p-6 bg-pink-50/20 rounded-[32px] border border-pink-50 mb-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-lg font-h1 italic">{b.serviceName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                  <Calendar size={10} /> {b.date} • {b.time}
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
                        {orders.filter(o => o.userId === selectedCustomer.id).length === 0 ? (
                          <p className="py-4 text-slate-400 italic text-xs">No hay historial de compras disponible.</p>
                        ) : (
                          orders.filter(o => o.userId === selectedCustomer.id).map((o, i) => (
                            <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-sm italic">{o.productName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  Cod: {o.id.substring(0,8)} • {o.createdAt?.toDate?.()?.toLocaleDateString()}
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
              Catálogo de {viewType === 'services' ? 'Servicios' : 'Productos'}
            </h3>
            <button 
              onClick={viewType === 'services' ? addService : addProduct}
              className="flex items-center gap-3 text-[10px] font-black text-white bg-emerald-500 px-8 py-4 rounded-[24px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 scale-100 hover:scale-105 active:scale-95"
            >
              <Plus size={20} /> AGREGAR NUEVO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(viewType === 'services' ? services : products).map(item => (
              <div key={item.id} className="bg-white rounded-[40px] p-10 border border-pink-50 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden professional-shadow">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-20 transition-opacity group-hover:opacity-100"></div>
                <div className="flex justify-between items-start mb-8">
                  <input 
                    className="text-2xl font-black text-slate-800 font-h1 italic bg-transparent focus:bg-pink-50/30 px-3 py-1 rounded-xl outline-none w-[80%] transition-colors"
                    value={item.name}
                    onChange={(e) => viewType === 'services' ? updateServiceField(item.id, 'name', e.target.value) : updateProductField(item.id, 'name', e.target.value)}
                  />
                  <button 
                    onClick={() => setItemToDelete({ col: viewType === 'services' ? 'services' : 'products', id: item.id })}
                    className="text-slate-300 hover:text-red-500 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="mb-8 space-y-4">
                  <div className="relative group/upload">
                    <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
                    <input 
                      className="w-full bg-slate-50/50 rounded-2xl pl-12 pr-12 py-3 text-xs text-slate-500 font-medium italic border border-transparent focus:border-primary outline-none"
                      value={item.image || ''}
                      onChange={(e) => viewType === 'services' ? updateServiceField(item.id, 'image', e.target.value) : updateProductField(item.id, 'image', e.target.value)}
                      placeholder={viewType === 'products' ? 'URL de imagen de producto' : 'URL de imagen de servicio'}
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
                             // Simular subida para demo, en prod usar Firebase Storage
                             alert("Subida de archivos deshabilitada en esta demo. Usa una URL.");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <textarea 
                    className="w-full bg-slate-50/50 rounded-[24px] p-6 text-sm text-slate-500 min-h-[100px] outline-none focus:ring-4 focus:ring-primary/5 italic leading-relaxed"
                    value={item.description}
                    onChange={(e) => viewType === 'services' ? updateServiceField(item.id, 'description', e.target.value) : updateProductField(item.id, 'description', e.target.value)}
                    placeholder="Escribe la descripción aquí..."
                  />
                </div>

                <div className={viewType === 'services' ? 'flex flex-col gap-6' : 'grid grid-cols-2 gap-6'}>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 pl-1 italic">Precio (COP)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
                      <input 
                        type="number"
                        className="w-full bg-pink-50/20 border border-pink-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-primary outline-none focus:border-primary transition-colors italic"
                        value={item.price}
                        onChange={(e) => viewType === 'services' ? updateServiceField(item.id, 'price', parseInt(e.target.value)) : updateProductField(item.id, 'price', parseInt(e.target.value))}
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
                          onChange={(e) => updateProductField(item.id, 'stock', parseInt(e.target.value))}
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
                      onChange={(e) => updateProductField(item.id, 'minStock', parseInt(e.target.value))}
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

      {viewType === 'bookings' && (
        <div className="grid grid-cols-1 gap-14">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              Agenda de Citas Activas ({bookings.length})
            </h3>
          </div>
          <div className="bg-white rounded-[40px] border border-pink-50 shadow-sm professional-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-pink-50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Servicio</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha/Hora</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => {
                    const customer = customers.find(c => c.id === booking.userId);
                    return (
                      <tr key={booking.id} className="border-b border-pink-50/50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{customer?.displayName || 'Cliente'}</p>
                          <p className="text-[10px] text-slate-400">{customer?.email}</p>
                        </td>
                        <td className="p-6 text-sm font-bold text-slate-600">{booking.serviceName}</td>
                        <td className="p-6">
                          <p className="text-xs font-black text-slate-800">{booking.date}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-1">{booking.time}</p>
                        </td>
                        <td className="p-6">
                           <select 
                             className={`text-xs font-bold uppercase tracking-widest border-none outline-none rounded-xl px-3 py-1 cursor-pointer
                               ${booking.status === 'confirmed' || booking.status === 'pagada' ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-pink-600'}
                             `}
                             value={booking.status}
                             onChange={(e) => updateItem('bookings', booking.id, { status: e.target.value })}
                           >
                             <option value="pending">Pendiente</option>
                             <option value="confirmed">Confirmada</option>
                             <option value="pagada">Pagada</option>
                             <option value="completed">Completada</option>
                             <option value="cancelled">Cancelada</option>
                           </select>
                        </td>
                        <td className="p-6 text-center">
                          {booking.status === 'confirmada' && (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${booking.reminderSent ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {booking.reminderSent ? 'ENVIADO' : 'PENDIENTE'}
                              </span>
                              <button
                                onClick={async () => {
                                  try {
                                    const functions = getFunctions();
                                    const resendReminder = httpsCallable(functions, 'resendReminder');
                                    await resendReminder({ bookingId: booking.id });
                                    alert("Recordatorio enviado con éxito.");
                                  } catch (e: any) {
                                    alert("Error enviando recordatorio: " + e.message);
                                  }
                                }}
                                className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold hover:bg-emerald-100 transition-colors"
                              >
                                Reenviar
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => setItemToDelete({ col: 'bookings', id: booking.id })}
                            className="text-slate-200 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewType === 'orders' && (
        <div className="grid grid-cols-1 gap-14">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              Pedidos de Productos ({orders.length})
            </h3>
          </div>
          <div className="bg-white rounded-[40px] border border-pink-50 shadow-sm professional-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-pink-50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cod. Pedido</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const customer = customers.find(c => c.id === order.userId);
                    return (
                      <tr key={order.id} className="border-b border-pink-50/50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 font-mono text-[10px] font-black text-primary">#{order.id.substring(0,8).toUpperCase()}</td>
                        <td className="p-6">
                          <p className="font-bold text-slate-800 text-sm">{customer?.displayName || 'Invitado'}</p>
                          <p className="text-[10px] text-slate-400">{order.phone || 'Sin tel.'}</p>
                        </td>
                        <td className="p-6 text-sm font-black text-slate-700">${(order.total || 0).toLocaleString()}</td>
                        <td className="p-6">
                          <span className={`status-pill ${order.status === 'pagado' ? 'pill-green' : 'pill-pink'}`}>
                            {order.status || 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{order.deliveryMethod === 'pickup' ? 'Recogida' : 'Domicilio'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 font-h1 italic mb-2">¿Estás segura?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Esta acción ocultará el elemento para los clientes permanentemente.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={deleteItem}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-600 transition-all font-h1"
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

const MapPinIcon = ({ size }: { size: number }) => <Sparkles size={size} />;
