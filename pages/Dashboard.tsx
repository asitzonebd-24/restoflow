
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, LayoutPanelTop, History, Globe, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { orders, inventory, currentTenant, expenses: allExpenses, transactions: allTransactions } = useApp();
  const navigate = useNavigate();

  // Date range state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [customRange, setCustomRange] = useState({
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    })(),
    end: new Date().toISOString().split('T')[0]
  });

  // Filtered data based on date range
  const { transactions, expenses, startDate, endDate } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let start = new Date(0); // All time
    let end = new Date();

    if (dateFilter === 'today') {
      start = startOfToday;
    } else if (dateFilter === 'week') {
      start = startOfWeek;
    } else if (dateFilter === 'month') {
      start = startOfMonth;
    } else if (dateFilter === 'custom') {
      start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
    }

    const filteredTransactions = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const filteredExpenses = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { 
      transactions: filteredTransactions, 
      expenses: filteredExpenses,
      startDate: start,
      endDate: end
    };
  }, [allTransactions, allExpenses, dateFilter, customRange]);

  // Calculate stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.minThreshold).length;

  // Dynamic chart data based on selected range
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const rangeDays: Date[] = [];
    let current = new Date(startDate);
    if (dateFilter === 'all' && allTransactions.length > 0) {
      // For "All Time", just show last 30 days of activity
      current = new Date();
      current.setDate(current.getDate() - 30);
    }
    
    // Limit to 31 days for chart performance if range is too long
    const diffTime = Math.abs(endDate.getTime() - current.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
      current = new Date(endDate);
      current.setDate(current.getDate() - 30);
    }

    while (current <= endDate) {
      rangeDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return rangeDays.map(date => {
      const dayName = days[date.getDay()];
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const daySales = allTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate >= dayStart && tDate <= dayEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const dayExpenses = allExpenses
        .filter(e => {
          const eDate = new Date(e.date);
          return eDate >= dayStart && eDate <= dayEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: dayName,
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sales: daySales,
        expense: dayExpenses
      };
    });
  }, [allTransactions, allExpenses, startDate, endDate, dateFilter]);

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
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-48">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full pl-11 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
          </div>

          <button 
            onClick={() => navigate(`/${currentTenant?.id}/expenses`)}
            className="px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-[10px] shadow-sm hover:border-slate-300 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <PlusCircle size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Custom Range Inputs */}
      {dateFilter === 'custom' && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-xl shadow-indigo-100 animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
            <input 
              type="date" 
              value={customRange.start}
              onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
              className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="hidden sm:block text-slate-200 mt-6">
            <ChevronRight size={20} />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">End Date</label>
            <input 
              type="date" 
              value={customRange.end}
              onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
              className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
            />
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
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
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
