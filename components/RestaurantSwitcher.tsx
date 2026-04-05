import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, UtensilsCrossed, Building2 } from 'lucide-react';
import { Role } from '../types';

export const RestaurantSwitcher = () => {
  const { tenants, activeTenantId, setActiveTenantId, currentUser, business } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setIsOpen(false);
    navigate(`/${tenantId}/dashboard`);
  };

  // Determine which tenants to show
  const accessibleTenantIds = Array.from(new Set([
    ...(currentUser?.tenantIds || []),
    currentUser?.tenantId
  ].filter(Boolean) as string[]));

  const availableTenants = currentUser?.role === Role.SUPER_ADMIN 
    ? tenants 
    : tenants.filter(t => accessibleTenantIds.includes(t.id));

  if (availableTenants.length <= 1 && currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/20">
        {business.logo ? (
          <img src={business.logo} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
        ) : (
          <UtensilsCrossed size={24} className="text-white/20" />
        )}
      </div>
    );
  }

  const currentTenant = tenants.find(t => t.id === activeTenantId) || business;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/20 hover:bg-white/10 transition-colors relative group"
        title={currentTenant?.name || 'Switch Restaurant'}
      >
        {currentTenant?.logo ? (
          <img src={currentTenant.logo} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
        ) : (
          <Building2 size={24} className="text-white/80" />
        )}
        <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border-2 border-[#11112b]">
          <ChevronDown size={12} className="text-white" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-0 left-16 w-64 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-left-2">
          <div className="p-4 border-b-2 border-slate-100 bg-slate-50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch Restaurant</h3>
          </div>
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            {availableTenants.map(tenant => (
              <button
                key={tenant.id}
                onClick={() => handleSwitch(tenant.id)}
                className={`w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0
                  ${activeTenantId === tenant.id ? 'bg-indigo-50/50' : ''}
                `}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                  {tenant.logo ? (
                    <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={18} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm truncate ${activeTenantId === tenant.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {tenant.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{tenant.address}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
