
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { generateBusinessInsight } from '../services/geminiService';
import { Bot, TrendingUp, AlertTriangle, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, LayoutPanelTop, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { orders, inventory, currentTenant, expenses } = useApp();
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const navigate = useNavigate();

  // Calculate stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  const handleAiAnalysis = async () => {
    if (!currentTenant) return;
    setLoadingAi(true);
    const result = await generateBusinessInsight(currentTenant.name, orders, inventory);
    setInsight(result);
    setLoadingAi(false);
  };

  // Mock chart data based on weekly outlook
  const chartData = [
    { name: 'Mon', sales: 400, expense: 200 },
    { name: 'Tue', sales: 300, expense: 150 },
    { name: 'Wed', sales: 550, expense: 300 },
    { name: 'Thu', sales: 450, expense: 400 },
    { name: 'Fri', sales: 800, expense: 500 },
    { name: 'Sat', sales: 1200, expense: 600 },
    { name: 'Sun', sales: 900, expense: 450 },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
            <LayoutPanelTop className="text-indigo-600" size={36} /> Admin Panel
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Real-time operational overview</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/expenses')}
            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:border-indigo-500 transition-all flex items-center gap-2"
          >
            <PlusCircle size={18} /> Add Expense
          </button>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition disabled:opacity-50 border-4 border-white"
          >
            <Bot size={20} />
            {loadingAi ? 'Analyzing...' : 'Gemini Insights'}
          </button>
        </div>
      </div>

      {insight && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-indigo-500 border-x-4 border-b-4 border-black animate-in fade-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-tighter relative z-10">
            <Bot size={24} className="text-indigo-600" /> Strategic Intelligence
          </h3>
          <div className="prose prose-slate prose-sm text-slate-600 whitespace-pre-line font-medium leading-relaxed relative z-10">
            {insight}
          </div>
        </div>
      )}

      {/* Primary KPI Cards - Re-designed to match reference image */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Total Revenue Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border-[3px] border-emerald-500 border-b-[12px] shadow-sm flex flex-col justify-between h-56 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border-2 border-emerald-100">
              <DollarSign size={28} strokeWidth={3} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-black text-xs uppercase">
              <ArrowUpRight size={16} strokeWidth={3} /> 12%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">Total Revenue</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              {currentTenant?.currency}{totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border-[3px] border-red-500 border-b-[12px] shadow-sm flex flex-col justify-between h-56 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border-2 border-red-100">
              <Wallet size={28} strokeWidth={3} />
            </div>
            <div className="flex items-center gap-1 text-red-600 font-black text-xs uppercase">
              <ArrowDownRight size={16} strokeWidth={3} /> 5%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">Total Expenses</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              {currentTenant?.currency}{totalExpenses.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border-[3px] border-indigo-500 border-b-[12px] shadow-sm flex flex-col justify-between h-56 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border-2 border-indigo-100">
              <TrendingUp size={28} strokeWidth={3} />
            </div>
            <div className="flex items-center gap-1 text-indigo-600 font-black text-xs uppercase">
              <ArrowUpRight size={16} strokeWidth={3} /> 8%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">Net Profit</p>
            <h3 className={`text-4xl font-black tracking-tighter leading-none ${netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {currentTenant?.currency}{netProfit.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Stock Alerts Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border-[3px] border-amber-500 border-b-[12px] shadow-sm flex flex-col justify-between h-56 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border-2 border-amber-100">
              <AlertTriangle size={28} strokeWidth={3} />
            </div>
            <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">
              {lowStockCount} Action Items
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">Inventory Status</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Low Supply</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-900">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Financial Trend</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black uppercase text-slate-400">Sales</span>
               </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Expenses List */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-slate-900 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Recent Payouts</h3>
            <History className="text-slate-200" size={24} />
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Wallet size={48} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No recent costs</p>
              </div>
            ) : expenses.slice(0, 6).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-slate-900 transition-all group">
                <div>
                  <h4 className="font-black text-[10px] text-slate-900 uppercase tracking-tight truncate max-w-[120px]">{exp.title}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{exp.category}</p>
                </div>
                <span className="font-black text-red-600 text-sm">-{currentTenant?.currency}{exp.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/expenses')}
            className="mt-8 w-full py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all border-2 border-transparent hover:border-slate-900"
          >
            View Full Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
