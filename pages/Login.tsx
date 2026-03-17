
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { LogIn, ChefHat, Mail, Lock, AlertCircle, Utensils, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login, business, dbStatus } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  
  const navigate = useNavigate();

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const success = login(email, password);
    if (!success) {
      setStaffError('Access denied. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-12">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border-8 border-white overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Branding Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-slate-50">
          <div className="flex items-center gap-6">
            <img src={business.logo} className="w-16 h-16 bg-white rounded-[1.5rem] p-1.5 border-4 border-white shadow-2xl" alt="Logo" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{business.name}</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Unified Access Terminal</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Operational
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1">
          {/* Staff Section */}
          <div className="p-8 md:p-16 w-full bg-white flex flex-col justify-center">
            <div className="mb-10">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-full text-slate-600 mb-6">
                  <ChefHat size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Internal Staff</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Staff Login</h2>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enter your credentials to access the terminal</p>
            </div>

            {(!dbStatus.isConfigured || !dbStatus.hasTables) && (
              <div className="mb-8 p-5 bg-amber-50 border-2 border-amber-100 text-amber-700 rounded-[1.5rem] flex flex-col gap-2 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Demo Mode Active</span>
                </div>
                <p className="text-[9px] font-bold opacity-80 leading-relaxed">
                  {!dbStatus.isConfigured 
                    ? "Supabase is not configured. Changes will not be saved." 
                    : "Database tables are missing. Please run the SQL schema in Supabase to enable saving."}
                </p>
              </div>
            )}

            {staffError && (
              <div className="mb-8 p-5 bg-red-50 border-2 border-red-100 text-red-600 rounded-[1.5rem] flex items-center gap-4 text-[10px] font-black uppercase animate-in slide-in-from-top-2">
                <AlertCircle size={24} className="shrink-0" />
                {staffError}
              </div>
            )}
            
            <form onSubmit={handleStaffSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-4 border-transparent focus:border-slate-900 rounded-[1.5rem] outline-none transition-all font-black uppercase text-sm shadow-inner"
                    placeholder="staff@bistro.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Access Key</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-4 border-transparent focus:border-slate-900 rounded-[1.5rem] outline-none transition-all font-black text-sm shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[1.5rem] transition-all duration-300 shadow-2xl flex items-center justify-center gap-4 uppercase text-sm tracking-widest group"
              >
                Enter Terminal <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-12 pt-8 border-t-4 border-dashed border-slate-50">
               <div className="flex items-center justify-center gap-4">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Demo Credentials</p>
                  <div className="h-px flex-1 bg-slate-100"></div>
               </div>
               <p className="text-[10px] font-bold text-slate-400 text-center mt-4">
                 OWNER: <span className="text-slate-900">owner@bistro.com</span> / <span className="text-slate-900">password</span>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
