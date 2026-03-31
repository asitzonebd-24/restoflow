import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, ArrowRight, ChefHat, ShoppingBag, UserPlus } from 'lucide-react';
import { RegistrationModal } from '../src/components/RegistrationModal';
import { useState } from 'react';

export const Landing = () => {
  const { business } = useApp();
  const navigate = useNavigate();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col items-center justify-center p-6">
      {/* Branding Header */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 p-4">
          {business.logo ? (
            <img src={business.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <Utensils size={32} className="text-slate-200" />
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
          Welcome to <span className="text-indigo-600">{business.name}</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Integrated Dining Experience</p>
      </div>

      {/* Portal Selection */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Staff Terminal Card */}
        <button 
          onClick={() => navigate('/login')}
          className="group w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-10 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-[320px]"
        >
          <div>
            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
              Admin <span className="text-indigo-400">Portal</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Global management terminal for portal administrators only.
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-white/30 group-hover:text-white transition-colors">
            Enter Administrator Terminal <ArrowRight size={16} />
          </div>
        </button>

        {/* Customer Portal Card */}
        <button 
          onClick={() => navigate('/order/auth')}
          className="group w-full bg-white rounded-3xl border border-slate-100 shadow-lg p-10 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-[320px]"
        >
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Customer <span className="text-indigo-600">Portal</span>
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Integrated ordering experience for valued customers.
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-slate-300 group-hover:text-indigo-600 transition-colors">
            Enter Customer Portal <ArrowRight size={16} />
          </div>
        </button>
      </div>

      {/* Registration Option */}
      <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-95 group"
        >
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <UserPlus size={16} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">New to the platform?</p>
            <p className="text-sm font-bold text-slate-900">Create a New Account</p>
          </div>
          <ArrowRight size={16} className="ml-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <RegistrationModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

      {/* Footer Branding */}
      <div className="mt-20 flex items-center gap-2 opacity-20">
         <ChefHat size={16} />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">RestoKeep Professional OS</p>
      </div>
    </div>
  );
};
