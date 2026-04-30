
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Promotion } from '../types';
import { Ticket, Plus, Trash2, Calendar, Megaphone, Tag, Percent, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Promotions = () => {
  const { promotions, addPromotion, deletePromotion, business } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    message: '',
    discountPercentage: 0,
    promoCode: '',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.title || !newPromo.message) return;

    await addPromotion({
        ...newPromo,
        expiryDate: new Date(newPromo.expiryDate).toISOString()
    });
    setIsAdding(false);
    setNewPromo({
        title: '',
        message: '',
        discountPercentage: 0,
        promoCode: '',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <header className="bg-white border-b-4 border-indigo-500 p-6 md:p-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-4">
              <Megaphone className="text-indigo-600" size={32} />
              Marketing & Promotions
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              Send notifications and discount offers to your customers
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition border-4 border-white"
          >
            <Plus size={20} strokeWidth={3} /> Create Promotion
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {promotions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
              <Ticket size={64} className="text-slate-100 mb-6" />
              <p className="text-slate-300 font-black uppercase tracking-[0.2em]">No active promotions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {promotions.map((promo) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={promo.id} 
                  className="bg-white rounded-[2.5rem] border-4 border-black p-8 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Tag size={24} />
                      </div>
                      <button 
                        onClick={() => deletePromotion(promo.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2 leading-none">{promo.title}</h3>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">{promo.message}</p>

                    <div className="mt-auto space-y-4">
                      {promo.promoCode && (
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest shrink-0">Code:</span>
                          <span className="text-sm font-black text-indigo-600 tracking-widest uppercase">{promo.promoCode}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-slate-300" />
                           <span className="text-[9px] font-black text-slate-400 uppercase">Expires {new Date(promo.expiryDate).toLocaleDateString()}</span>
                        </div>
                        {promo.discountPercentage && (
                          <div className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                            {promo.discountPercentage}% OFF
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Promotion Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[3rem] border-8 border-indigo-500 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b-4 border-slate-50 bg-slate-50 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tighter">New Promotion</h2>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Offer Title</label>
                    <input 
                      type="text" 
                      required
                      value={newPromo.title}
                      onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                      placeholder="e.g. Eid Mega Sale!"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Message / Details</label>
                    <textarea 
                      required
                      value={newPromo.message}
                      onChange={(e) => setNewPromo({...newPromo, message: e.target.value})}
                      placeholder="e.g. Get 20% off on all items this weekend!"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner h-24 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Discount %</label>
                      <div className="relative">
                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          type="number" 
                          value={newPromo.discountPercentage}
                          onChange={(e) => setNewPromo({...newPromo, discountPercentage: parseInt(e.target.value) || 0})}
                          className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Promo Code</label>
                      <input 
                        type="text" 
                        value={newPromo.promoCode}
                        onChange={(e) => setNewPromo({...newPromo, promoCode: e.target.value.toUpperCase()})}
                        placeholder="EID2026"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[12px] font-black tracking-widest uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Expiry Date</label>
                    <input 
                      type="date"
                      value={newPromo.expiryDate}
                      onChange={(e) => setNewPromo({...newPromo, expiryDate: e.target.value})}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-100">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[9px] font-black text-amber-700 uppercase leading-tight">
                            Saving this will immediately send a push notification to all active customers.
                        </p>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition border-2 border-indigo-500"
                    >
                        Blast Notification <Megaphone size={20} strokeWidth={3} />
                    </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
