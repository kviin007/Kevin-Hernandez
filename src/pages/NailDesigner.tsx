import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Sparkles, Heart, Clock, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { generateNailDesigns, NailDesign, NailDesignPrompt } from '../services/geminiNailService';
import { saveMoodboardItem, getAIGeneratedHistory, MoodboardItem } from '../services/moodboardService';
import { useAuth } from '../components/AuthContext';

const OCCASIONS = ['Cotidiano', 'Trabajo', 'Cita', 'Fiesta', 'Grado', 'Quinceañera', 'Boda'];
const SHAPES = [
  { id: 'Ovalada', icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg> },
  { id: 'Cuadrada', icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> },
  { id: 'Almendra', icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> }, // Placeholder SVG
  { id: 'Stiletto', icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2L2 22h20L12 2z"/></svg> },
  { id: 'Coffin', icon: (props: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 2h10l4 20H3L7 2z"/></svg> }
];
const LENGTHS = ['Corta', 'Media', 'Larga', 'Extra larga'];

export const NailDesigner = ({ setView }: { setView: (view: string) => void }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [shape, setShape] = useState(SHAPES[0].id);
  const [length, setLength] = useState(LENGTHS[1]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [designs, setDesigns] = useState<NailDesign[]>([]);
  const [history, setHistory] = useState<MoodboardItem[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    const items = await getAIGeneratedHistory(user.uid);
    setHistory(items);
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert("Por favor descríbenos qué tipo de diseño buscas.");
      return;
    }
    
    setIsGenerating(true);
    setDesigns([]);
    
    try {
      const prompt: NailDesignPrompt = {
        description,
        occasion,
        shape,
        length
      };
      
      const newDesigns = await generateNailDesigns(prompt);
      setDesigns(newDesigns);
      setSavedDesigns(new Set());
    } catch (error: any) {
      alert(error.message || "Lo sentimos, hubo un error generando tus diseños.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToMoodboard = async (design: NailDesign, index: number) => {
    if (!user) return;
    const designKey = `${design.name}-${index}`;
    
    if (savedDesigns.has(designKey)) return;
    
    try {
      await saveMoodboardItem(user.uid, design);
      setSavedDesigns(prev => new Set(prev).add(designKey));
      loadHistory(); // Reload history to show the newly saved item
      alert("¡Diseño guardado en tu Moodboard! 💖");
    } catch (error) {
       alert("Error al guardar el diseño. Intenta de nuevo.");
    }
  };

  const handleBookAppointment = () => {
    setView('booking');
  };

  return (
    <div className="min-h-screen bg-[#fff5f8] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-primary">
              <Wand2 size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 font-h1 italic tracking-tight">Nail Designer AI</h1>
              <p className="text-pink-600 font-medium">✨ Tu estilista personal de uñas powered by Gemini ✨</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Section A - Formulario */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-pink-50">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Descríbeme tu diseño ideal
          </h2>
          
          <div className="space-y-8">
            <div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: uñas nude con flores rosadas y pequeños brillos para una cita romántica..."
                className="w-full bg-slate-50 border-2 border-transparent focus:border-pink-200 outline-none rounded-2xl p-4 min-h-[120px] resize-none text-slate-700 transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Ocasión</label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(occ => (
                  <button 
                    key={occ}
                    onClick={() => setOccasion(occ)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${occasion === occ ? 'border-primary bg-pink-50 text-primary' : 'border-slate-100 text-slate-500 hover:border-pink-200 hover:text-pink-400'}`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Forma</label>
                <div className="flex flex-wrap gap-2">
                  {SHAPES.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setShape(s.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${shape === s.id ? 'border-primary bg-pink-50 text-primary' : 'border-slate-100 text-slate-500 hover:border-pink-200 hover:text-pink-400'}`}
                    >
                      <s.icon className="w-4 h-4 opacity-70" />
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Largo</label>
                <div className="flex flex-wrap gap-2">
                  {LENGTHS.map(l => (
                    <button 
                      key={l}
                      onClick={() => setLength(l)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${length === l ? 'border-primary bg-pink-50 text-primary' : 'border-slate-100 text-slate-500 hover:border-pink-200 hover:text-pink-400'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-5 rounded-[20px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98]'}`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Inspirando a Gemini...
                </>
              ) : (
                <>
                  Generar ideas <Sparkles size={18} />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Section B - Resultados */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex gap-6 animate-pulse">
                  <div className="w-2 bg-slate-200 rounded-full h-24"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                      <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                      <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {!isGenerating && designs.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                Propuestas para ti
              </h2>

              {designs.map((design, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={index} 
                  className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex overflow-hidden relative group"
                >
                  {/* Accent Border */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-3" 
                    style={{ backgroundColor: design.colors[0]?.hex || '#e91e8c' }} 
                  />
                  
                  <div className="pl-4 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="text-2xl font-black font-h1 italic text-slate-800 tracking-tight">{design.name}</h3>
                         <p className="text-slate-500 text-sm mt-1">{design.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paleta</h4>
                        <div className="flex items-center gap-2">
                          {design.colors.map((color, i) => (
                            <div key={i} className="group/color relative cursor-pointer">
                              <div 
                                className="w-8 h-8 rounded-full shadow-inner border border-slate-200" 
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/color:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {color.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Técnicas</h4>
                         <div className="flex flex-wrap gap-1">
                           {design.techniques.map((tech, i) => (
                             <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold">
                               {tech}
                             </span>
                           ))}
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-8 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                        <DollarSign size={16} className="text-slate-400" />
                        Nivel: <span className="text-primary">{design.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        {design.estimatedTime}
                      </div>
                    </div>

                    <div className="flex grid-cols-2 flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => handleSaveToMoodboard(design, index)}
                        disabled={savedDesigns.has(`${design.name}-${index}`)}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${savedDesigns.has(`${design.name}-${index}`) ? 'bg-pink-50 text-pink-400 cursor-not-allowed' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'}`}
                      >
                        <Heart size={16} className={savedDesigns.has(`${design.name}-${index}`) ? "fill-current" : ""} />
                        {savedDesigns.has(`${design.name}-${index}`) ? 'Guardado' : 'Guardar en Moodboard'}
                      </button>
                      <button 
                        onClick={handleBookAppointment}
                        className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                      >
                        <Calendar size={16} />
                        Pedir esta cita
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        {history.length > 0 && !isGenerating && designs.length === 0 && (
          <section className="pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Heart className="text-pink-500" size={18} fill="currentColor" /> 
                Tus diseños generados
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {history.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50 flex flex-col h-full hover:border-pink-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    {item.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} title={c.name} />
                    ))}
                  </div>
                  <h3 className="font-h1 italic font-black text-xl text-slate-800 mb-2 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                  
                  <button onClick={() => {
                     setDescription(`Hazme un diseño inspirado en ${item.name}: ${item.description}`);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-between group">
                    Inspirarme en este
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
