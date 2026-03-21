
import React, { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Utensils, ShieldCheck, User, ArrowRight, Store, Globe, MapPin, Phone } from 'lucide-react';

export const TenantLanding = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { tenants, setCurrentTenantId } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (tenantId) {
      setCurrentTenantId(tenantId);
    }
    return () => setCurrentTenantId(null);
  }, [tenantId, setCurrentTenantId]);

  const tenant = tenants.find(t => t.id === tenantId);

  if (!tenant) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding & Info */}
        <div className="space-y-8 text-center md:text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm">
            <Store size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Official Restaurant Portal</span>
          </div>
          
          <div className="space-y-4">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl p-4 border border-slate-100 mx-auto md:mx-0 flex items-center justify-center overflow-hidden">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Utensils size={40} className="text-indigo-600" />
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-none tracking-tighter uppercase">
              {tenant.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <MapPin size={14} className="text-indigo-500" /> {tenant.address || 'Global Presence'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <Phone size={14} className="text-indigo-500" /> {tenant.phone || 'Contact Support'}
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
            Welcome to our unified digital ecosystem. Choose your portal below to continue with your personalized experience.
          </p>
        </div>

        {/* Right Side: Portal Selection */}
        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          {/* Customer Portal */}
          <button 
            onClick={() => navigate(`/${tenantId}/order/auth?tenantId=${tenantId}`)}
            className="w-full group bg-white hover:bg-indigo-600 p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center border-4 border-black group-hover:bg-white transition-colors">
                <User size={32} className="text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-white uppercase tracking-tight">Customer Portal</h3>
                <p className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-100 uppercase tracking-widest">Order food & track history</p>
              </div>
            </div>
            <ArrowRight size={24} className="text-slate-300 group-hover:text-white transition-colors" />
          </button>

          {/* Staff Portal */}
          <button 
            onClick={() => navigate(`/login?tenantId=${tenantId}`)}
            className="w-full group bg-slate-900 hover:bg-slate-800 p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border-4 border-white/10 group-hover:bg-white/20 transition-colors">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Staff Terminal</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Manage orders & inventory</p>
              </div>
            </div>
            <ArrowRight size={24} className="text-white/20 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 opacity-20 grayscale">
          <Utensils size={12} />
          <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em]"> Resto Keep Ecosystem </p>
        </div>
      </div>
    </div>
  );
};
