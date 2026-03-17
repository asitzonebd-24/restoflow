
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
    <div className="p-6 md:p-10 space-y-10 bg-[#f8fafc] min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wider text-xs uppercase">
            <LayoutPanelTop size={16} />
            <span>Management Console</span>
          </div>
          <h1 className="text-5xl font-light text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Overview of your restaurant's performance and operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/expenses')}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Add Expense</span>
          </button>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <Bot size={18} />
            <span>{loadingAi ? 'Analyzing...' : 'AI Insights'}</span>
          </button>
        </div>
      </div>

      {/* AI Insight Section */}
      {insight && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-indigo-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Bot size={18} />
              Strategic Intelligence
            </h3>
            <div className="prose prose-slate prose-sm text-slate-600 whitespace-pre-line font-normal leading-relaxed max-w-none">
              {insight}
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} className="mr-1" /> 12%
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
          <h3 className="text-3xl font-medium text-slate-900">
            {currentTenant?.currency}{totalRevenue.toLocaleString()}
          </h3>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Wallet size={24} />
            </div>
            <span className="flex items-center text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded-lg">
              <ArrowDownRight size={14} className="mr-1" /> 5%
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Expenses</p>
          <h3 className="text-3xl font-medium text-slate-900">
            {currentTenant?.currency}{totalExpenses.toLocaleString()}
          </h3>
        </div>

        {/* Profit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="flex items-center text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} className="mr-1" /> 8%
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Net Profit</p>
          <h3 className={`text-3xl font-medium ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {currentTenant?.currency}{netProfit.toLocaleString()}
          </h3>
        </div>

        {/* Inventory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <span className="text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-1 rounded-lg uppercase">
              {lowStockCount} Alerts
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Inventory Status</p>
          <h3 className="text-3xl font-medium text-slate-900">
            {lowStockCount > 0 ? 'Low Stock' : 'Healthy'}
          </h3>
        </div>
      </div>

      {/* Charts & Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Financial Performance</h3>
              <p className="text-slate-500 text-xs">Weekly sales vs expenses overview</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-bold uppercase text-slate-400">Sales</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                 <span className="text-[10px] font-bold uppercase text-slate-400">Expense</span>
               </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expense" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Payouts</h3>
            <History className="text-slate-300" size={20} />
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                <Wallet size={40} className="mb-2 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-widest">No recent costs</p>
              </div>
            ) : expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 truncate max-w-[120px]">{exp.title}</h4>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{exp.category}</p>
                  </div>
                </div>
                <span className="font-bold text-rose-600 text-sm">-{currentTenant?.currency}{exp.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/expenses')}
            className="mt-6 w-full py-3 bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
          >
            View Full Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
