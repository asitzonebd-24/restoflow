import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, ArrowRight, ChefHat } from 'lucide-react';

export const Landing = () => {
  const { business } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Branding Header */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-24 h-24 bg-white rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-6">
          <img src={business.logo} alt="Logo" className="w-16 h-16 rounded-full" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
          Welcome to <br/> <span className="text-indigo-600">{business.name}</span>
        </h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Dining Experience</p>
      </div>

      {/* Portal Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Customer Portal Card */}
        <button 
          onClick={() => navigate('/order/auth')}
          className="group bg-white rounded-[3.5rem] border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 text-left transition-all hover:-translate-y-2 hover:shadow-[20px_20px_0px_0px_rgba(79,70,229,0.2)] active:scale-95 flex flex-col justify-between h-[360px]"
        >
          <div>
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center border-4 border-black mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Utensils size={32} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">
              I want to <br/> <span className="text-indigo-600">Order</span>
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Browse our digital menu, customize your meal, and track your token live.
            </p>
          </div>
          <div className="flex items-center gap-3 font-black uppercase text-xs tracking-widest text-slate-900">
            Open Customer App <ArrowRight size={20} strokeWidth={3} />
          </div>
        </button>

        {/* Staff Terminal Card */}
        <button 
          onClick={() => navigate('/login')}
          className="group bg-slate-900 rounded-[3.5rem] border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 text-left transition-all hover:-translate-y-2 hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,0.4)] active:scale-95 flex flex-col justify-between h-[360px]"
        >
          <div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border-4 border-white/20 mb-8 group-hover:bg-white group-hover:text-slate-900 transition-colors text-white">
              <ShieldCheck size={32} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Staff <br/> <span className="text-indigo-400">Terminal</span>
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              POS, Kitchen Display, Inventory, and Business Analytics for authorized staff.
            </p>
          </div>
          <div className="flex items-center gap-3 font-black uppercase text-xs tracking-widest text-white">
            Enter Management <ArrowRight size={20} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-16 flex items-center gap-2 opacity-30 grayscale">
         <ChefHat size={18} />
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">OmniDine Professional SaaS</p>
      </div>
    </div>
  );
};