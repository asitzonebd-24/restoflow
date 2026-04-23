
import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutPanelTop, PlusCircle, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { currentTenant } = useApp();
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen font-sans flex flex-col items-center">
      <div className="flex-1 flex flex-col items-center justify-start pt-4 md:pt-8 w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-12">
          {currentTenant?.logo ? (
            <img src={currentTenant.logo} alt={currentTenant.name} className="w-24 h-24 object-contain mb-6 rounded-full border-2 border-slate-300 p-2" />
          ) : (
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-2 border-slate-300">
              <LayoutPanelTop size={40} />
            </div>
          )}
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2 text-center px-4">
            Welcome To {currentTenant?.name || 'Restaurant'}
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] max-w-md">
            Admin Panel
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full flex-wrap">
          <button 
            onClick={() => navigate(`/${currentTenant?.id}/reports`)}
            className="w-full sm:w-48 px-4 py-4 bg-white border-2 border-emerald-500 text-slate-900 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest group"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-200 shrink-0">
              <PieChart size={20} />
            </div>
            <span className="text-left">View Reports</span>
          </button>

          <button 
            onClick={() => navigate(`/${currentTenant?.id}/expenses`)}
            className="w-full sm:w-48 px-4 py-4 bg-white border-2 border-purple-500 text-slate-900 rounded-2xl font-black text-xs shadow-lg shadow-purple-100 hover:bg-purple-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest group"
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-200 shrink-0">
              <PlusCircle size={20} />
            </div>
            <span className="text-left">Add Expense</span>
          </button>
        </div>
      </div>

    </div>
  );
};
