
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Role } from '../types';
import { LogIn, ChefHat, Mail, Lock, AlertCircle, Utensils, ArrowRight, User as UserIcon, ShoppingBag, UserPlus, Chrome } from 'lucide-react';
import { RegistrationModal } from '../src/components/RegistrationModal';
import { toast } from 'sonner';

export const Login = () => {
  const { login, loginWithGoogle, business, dbStatus, setCurrentTenantId, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
  }, [tenantId, setCurrentTenantId]);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const success = await login(email, password, tenantId);
    if (success) {
      navigate('/');
    } else {
      setStaffError('Access denied. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Branding Header */}
        <div className="bg-slate-900 text-white p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl p-2.5 border border-white/10 shadow-lg flex items-center justify-center">
            {tenantId && business.logo ? (
              <img src={business.logo} className="w-full h-full object-contain rounded-lg" alt="Logo" />
            ) : (
              <ChefHat className="text-white w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              {tenantId ? business.name : 'Super Admin Portal'}
            </h1>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">
              {tenantId ? 'Restaurant Access Terminal' : 'Portal Administrator Access'}
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col flex-1 gap-10">
          {/* Staff Section */}
          <div className="w-full bg-white flex flex-col justify-center">
            <div className="mb-6 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest mb-3">
                 <Lock size={10} /> Staff Terminal
               </div>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                 {tenantId ? 'Staff Login' : 'Super Admin Login'}
               </h2>
               <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                 {tenantId ? 'Access POS & Kitchen' : 'Restricted Access'}
               </p>
            </div>

            {(!dbStatus.isConfigured || !dbStatus.hasTables) && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex flex-col gap-1 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Demo Mode Active</span>
                </div>
                <p className="text-[9px] font-medium opacity-80 leading-relaxed">
                  {!dbStatus.isConfigured 
                    ? "Firebase is not configured. Changes will not be saved." 
                    : "Database tables are missing. Please check your Firestore setup."}
                </p>
              </div>
            )}

            {staffError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-[9px] font-bold uppercase animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                {staffError}
              </div>
            )}
            
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email / Mobile</label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-xs"
                    placeholder={tenantId ? "staff@restaurant.com" : "admin@portal.com"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-xs"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-slate-200 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
              >
                {isLoading ? 'Connecting...' : 'Enter Terminal'} <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                type="button"
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    navigate('/');
                  } catch (error) {
                    toast.error('Google Login failed');
                  }
                }}
                className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 rounded-xl transition-all duration-300 border border-slate-200 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
              >
                Login with Google <Chrome size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-4 bg-white text-[9px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
              </div>

              <button 
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 rounded-xl transition-all duration-300 border border-slate-200 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
              >
                Create New Account <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
              </button>
            </form>

            <RegistrationModal 
              isOpen={isRegisterModalOpen} 
              onClose={() => setIsRegisterModalOpen(false)} 
            />

            {tenantId && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => navigate(`/${tenantId}`)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-200 border-2 border-purple-800 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest group"
                >
                  <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Restaurant
                </button>
              </div>
            )}

            {!tenantId && (
              <div className="mt-10 pt-6 border-t border-slate-50">
                 <p className="text-[9px] text-slate-400 text-center leading-relaxed italic">
                   Please use your authorized credentials to access the terminal.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
