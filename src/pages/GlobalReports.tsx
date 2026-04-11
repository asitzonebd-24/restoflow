import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Expense, Role } from '../types';
import { PieChart, Building2, TrendingUp, TrendingDown, DollarSign, Calendar, ChevronDown } from 'lucide-react';

type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all' | '';

export const GlobalReports = () => {
  const { currentUser, tenants } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dateFilter, setDateFilter] = useState<DateFilter | ''>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const convertData = (data: any) => {
      const cleaned = { ...data };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] && typeof cleaned[key].toDate === 'function') {
          cleaned[key] = cleaned[key].toDate().toISOString();
        }
      });
      return cleaned;
    };

    const fetchData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        let allowedTenantIds: string[] = [];
        if (currentUser.role === Role.SUPER_ADMIN) {
          allowedTenantIds = tenants.map(t => t.id);
        } else {
          allowedTenantIds = Array.from(new Set([
            ...(currentUser.tenantIds || []),
            currentUser.tenantId
          ].filter(Boolean) as string[]));
        }

        if (allowedTenantIds.length === 0) {
          setTransactions([]);
          setExpenses([]);
          setIsLoading(false);
          return;
        }

        const chunkArray = (arr: string[], size: number) => {
          const chunks = [];
          for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
          }
          return chunks;
        };

        const tenantChunks = chunkArray(allowedTenantIds, 10);
        
        let allTransactions: Transaction[] = [];
        let allExpenses: Expense[] = [];

        for (const chunk of tenantChunks) {
          const txQuery = query(collection(db, 'transactions'), where('tenantId', 'in', chunk));
          const txSnapshot = await getDocs(txQuery);
          txSnapshot.forEach(doc => {
            allTransactions.push({ id: doc.id, ...convertData(doc.data()) } as Transaction);
          });

          const exQuery = query(collection(db, 'expenses'), where('tenantId', 'in', chunk));
          const exSnapshot = await getDocs(exQuery);
          exSnapshot.forEach(doc => {
            allExpenses.push({ id: doc.id, ...convertData(doc.data()) } as Expense);
          });
        }

        setTransactions(allTransactions);
        setExpenses(allExpenses);
      } catch (error) {
        console.error("Error fetching global reports data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, tenants]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filterFn = (item: { date: string, tenantId: string }) => {
      if (!item.date || !dateFilter || !selectedTenantId) return false;
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime())) return false;
      
      const matchesDate = 
        dateFilter === 'today' ? itemDate >= startOfToday :
        dateFilter === 'week' ? itemDate >= startOfWeek :
        dateFilter === 'month' ? itemDate >= startOfMonth :
        dateFilter === 'custom' ? (
          itemDate >= new Date(customRange.start + 'T00:00:00') && 
          itemDate <= new Date(customRange.end + 'T23:59:59')
        ) : dateFilter === 'all' ? true : false;
      
      const matchesTenant = selectedTenantId === 'all' || item.tenantId === selectedTenantId;
      
      return matchesDate && matchesTenant;
    };

    return {
      transactions: transactions.filter(filterFn),
      expenses: expenses.filter(filterFn)
    };
  }, [transactions, expenses, dateFilter, customRange, selectedTenantId]);

  const statsByTenant = useMemo(() => {
    const stats: Record<string, { income: number, expense: number, name: string }> = {};
    
    tenants.forEach(t => {
      stats[t.id] = { income: 0, expense: 0, name: t.name };
    });

    filteredData.transactions.forEach(t => {
      if (!stats[t.tenantId]) stats[t.tenantId] = { income: 0, expense: 0, name: 'Unknown' };
      stats[t.tenantId].income += t.amount;
    });

    filteredData.expenses.forEach(e => {
      if (!stats[e.tenantId]) stats[e.tenantId] = { income: 0, expense: 0, name: 'Unknown' };
      stats[e.tenantId].expense += e.amount;
    });

    return Object.entries(stats)
      .filter(([id, data]) => (selectedTenantId === 'all' || id === selectedTenantId) && (data.income > 0 || data.expense > 0))
      .map(([id, data]) => ({
        id,
        name: data.name,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredData, tenants, selectedTenantId]);

  const totalIncome = statsByTenant.reduce((sum, s) => sum + s.income, 0);
  const totalExpense = statsByTenant.reduce((sum, s) => sum + s.expense, 0);
  const totalProfit = totalIncome - totalExpense;

  const filterOptions: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'week' },
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Custom Range', value: 'custom' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-full space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
            <PieChart className="text-indigo-600" size={30} /> Global Reports
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Multi-Restaurant Overview</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative">
            <select 
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Select Restaurant</option>
              <option value="all">All Restaurants</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
          </div>

          <div className="relative">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="appearance-none w-full sm:w-40 pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Select Date</option>
              {filterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Calendar className="absolute right-3 top-3 text-slate-400" size={16} />
          </div>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <input type="date" value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
            <span className="text-slate-400 font-black">TO</span>
            <input type="date" value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Global Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-6 rounded-3xl border-[3px] border-emerald-500 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Income</h3>
              <div className="text-2xl font-black text-emerald-600">৳{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border-[3px] border-rose-500 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Expense</h3>
              <div className="text-2xl font-black text-rose-600">৳{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border-[3px] border-indigo-500 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Profit</h3>
              <div className={`text-2xl font-black ${totalProfit >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>৳{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Restaurant Breakdown */}
          {statsByTenant.length > 0 ? (
            <div className="bg-white rounded-3xl border-[3px] border-slate-900 shadow-2xl overflow-hidden">
              <div className="p-6 border-b-[3px] border-slate-900 bg-slate-50">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  Restaurant Breakdown
                </h2>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr className="border-b-[3px] border-slate-900">
                      <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest border-r-[2px] border-slate-900">Restaurant</th>
                      <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right border-r-[2px] border-slate-900">Income</th>
                      <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right border-r-[2px] border-slate-900">Expense</th>
                      <th className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsByTenant.map((stat) => (
                      <tr key={stat.id} className="border-b-[2px] border-slate-900 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 text-xs border-r-[2px] border-slate-900">{stat.name}</td>
                        <td className="p-4 text-right font-black text-emerald-700 text-xs border-r-[2px] border-slate-900">৳{stat.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-black text-rose-700 text-xs border-r-[2px] border-slate-900">৳{stat.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`p-4 text-right font-black text-xs ${stat.profit >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>৳{stat.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border-[3px] border-slate-900 shadow-2xl flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <PieChart size={40} className="text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Data Found</h2>
              <p className="text-slate-500 max-w-sm font-bold text-sm">
                We couldn't find any transactions or expenses for the selected filters.
                Try changing the date range or restaurant selection.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
