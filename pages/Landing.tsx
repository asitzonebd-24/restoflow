import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, ArrowRight, ChefHat } from 'lucide-react';

export const Landing = () => {
  const { business } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col items-center justify-center p-6">
      {/* Branding Header */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 p-4">
          <img src={business.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
          Welcome to <span className="text-indigo-600">{business.name}</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Integrated Dining Experience</p>
      </div>

      {/* Portal Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Customer Portal Card */}
        <button 
          onClick={() => navigate('/order/auth')}
          className="group bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-left transition-all hover:shadow-md hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-[320px]"
        >
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Utensils size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              I want to <span className="text-indigo-600">Order</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Browse our digital menu, customize your meal, and track your token live.
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
            Open Customer App <ArrowRight size={16} />
          </div>
        </button>

        {/* Staff Terminal Card */}
        <button 
          onClick={() => navigate('/login')}
          className="group bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-10 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-[320px]"
        >
          <div>
            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
              Staff <span className="text-indigo-400">Terminal</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              POS, Kitchen Display, Inventory, and Business Analytics for authorized staff.
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-white/30 group-hover:text-white transition-colors">
            Enter Management <ArrowRight size={16} />
          </div>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-20 flex items-center gap-2 opacity-20">
         <ChefHat size={16} />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">RestoFlow Professional OS</p>
      </div>
    </div>
  );
};
