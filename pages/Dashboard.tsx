
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { generateBusinessInsight } from '../services/geminiService';
import { Bot, TrendingUp, AlertTriangle, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, LayoutPanelTop, History, Globe } from 'lucide-react';
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
    <div className="p-6 md:p-8 space-y-8 bg-[#f8fafc] min-h-full font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutPanelTop size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Admin Panel</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-0.5">Real-time operational overview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/${currentTenant?.id}/expenses`)}
            className="px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-[10px] shadow-sm hover:border-slate-300 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <PlusCircle size={16} />
            <span>Add Expense</span>
          </button>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold text-[10px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            <Bot size={16} />
            <span>{loadingAi ? 'Analyzing...' : 'Gemini Insights'}</span>
          </button>
        </div>
      </div>

      {/* AI Insight Section */}
      {insight && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-indigo-500 shadow-indigo-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-bold text-indigo-600 mb-3 flex items-center gap-2 uppercase tracking-[0.2em]">
              <Bot size={14} />
              Strategic Intelligence
            </h3>
            <div className="prose prose-slate prose-sm text-slate-600 whitespace-pre-line font-medium leading-relaxed max-w-none">
              {insight}
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-500 border-b-8 shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center text-emerald-600 text-[10px] font-black tracking-widest bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              <ArrowUpRight size={14} className="mr-1" /> 12%
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Revenue</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
            {currentTenant?.currency}{totalRevenue.toLocaleString()}
          </h3>
        </div>

        {/* Expenses */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-500 border-b-8 shadow-xl shadow-rose-100 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
              <Wallet size={24} />
            </div>
            <span className="flex items-center text-rose-600 text-[10px] font-black tracking-widest bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
              <ArrowDownRight size={14} className="mr-1" /> 5%
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Expenses</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
            {currentTenant?.currency}{totalExpenses.toLocaleString()}
          </h3>
        </div>

        {/* Profit */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 border-b-8 shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-indigo-600 text-[10px] font-black tracking-widest bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
              <ArrowUpRight size={14} className="mr-1" /> 8%
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Net Profit</p>
          <h3 className={`text-4xl font-black tracking-tighter ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {currentTenant?.currency}{netProfit.toLocaleString()}
          </h3>
        </div>

        {/* Inventory */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-amber-500 border-b-8 shadow-xl shadow-amber-100 transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
              <AlertTriangle size={24} />
            </div>
            <span className="text-[8px] font-black px-3 py-1 bg-amber-100 text-amber-700 rounded-full uppercase tracking-[0.1em] border border-amber-200">
              0 Action Items
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Inventory Status</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
            {lowStockCount > 0 ? 'Low Supply' : 'Healthy'}
          </h3>
        </div>
      </div>

      {/* Customer App Link Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border-4 border-indigo-500 shadow-xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
              <Globe size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Customer App Portal</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Share this link with your customers to order</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 font-mono text-[10px] text-slate-600 break-all select-all shadow-inner">
              {window.location.origin}/#/{currentTenant?.id}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/#/${currentTenant?.id}`);
                alert('Customer App Link copied to clipboard!');
              }}
              className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-700"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Charts & Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 transition-all hover:shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Financial Trend</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Monthly revenue analysis</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Sales</span>
               </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '900',
                    padding: '12px 20px'
                  }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-500 shadow-xl shadow-rose-100 flex flex-col transition-all hover:shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Recent Payouts</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Latest financial activity</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
              <History className="text-slate-400" size={20} />
            </div>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 py-10">
                <Wallet size={60} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No recent costs</p>
              </div>
            ) : expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 border border-indigo-100 transition-all hover:shadow-md hover:border-rose-500 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-300 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <DollarSign size={20} className="text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 truncate max-w-[120px] uppercase tracking-tight">{exp.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exp.category}</p>
                  </div>
                </div>
                <span className="font-black text-rose-600 text-sm">-{currentTenant?.currency}{exp.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate(`/${currentTenant?.id}/expenses`)}
            className="mt-8 w-full py-4 bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-slate-200 hover:bg-black transition-all border-b-4 border-slate-700"
          >
            View Full Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
