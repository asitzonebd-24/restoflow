
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, Calendar, Search, ChevronDown } from 'lucide-react';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export const Reports = () => {
    const { transactions, expenses, currentTenant } = useApp();
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const filterFn = (item: { date: string }) => {
            const itemDate = new Date(item.date);
            if (dateFilter === 'today') return itemDate >= startOfToday;
            if (dateFilter === 'week') return itemDate >= startOfWeek;
            if (dateFilter === 'month') return itemDate >= startOfMonth;
            if (dateFilter === 'custom') {
                const start = new Date(customRange.start);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customRange.end);
                end.setHours(23, 59, 59, 999);
                return itemDate >= start && itemDate <= end;
            }
            return true;
        };

        return {
            transactions: transactions.filter(filterFn),
            expenses: expenses.filter(filterFn)
        };
    }, [transactions, expenses, dateFilter, customRange]);

    const totalIncome = filteredData.transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Data for Income vs Expense Bar Chart
    const comparisonData = [
        { name: 'Income', amount: totalIncome },
        { name: 'Expense', amount: totalExpense },
    ];

    // Data for Expense Categories Pie Chart
    const expenseByCategory = filteredData.expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(expenseByCategory).map(key => ({
        name: key,
        value: expenseByCategory[key]
    }));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const filterOptions: { label: string; value: DateFilter }[] = [
        { label: 'Today', value: 'today' },
        { label: 'Last 7 Days', value: 'week' },
        { label: 'Last 30 Days', value: 'month' },
        { label: 'Custom Range', value: 'custom' },
        { label: 'All Time', value: 'all' },
    ];

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        <PieChartIcon className="text-indigo-600" size={36} /> Financial Reports
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Analytics & Revenue insights</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                    {/* Custom Range Selector - Visible when 'custom' is selected */}
                    {dateFilter === 'custom' && (
                        <div className="flex flex-row items-center gap-2 bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-sm animate-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col min-w-0">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-1 mb-0.5">Start</label>
                                <input 
                                    type="date" 
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black outline-none focus:border-indigo-500 min-w-0"
                                />
                            </div>
                            <div className="w-4 h-0.5 bg-slate-200 mt-4 shrink-0"></div>
                            <div className="flex flex-col min-w-0">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-1 mb-0.5">End</label>
                                <input 
                                    type="date" 
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black outline-none focus:border-indigo-500 min-w-0"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Date Filter Dropdown */}
                    <div className="relative w-full md:w-64">
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full appearance-none bg-white border-2 border-slate-900 rounded-2xl pl-5 pr-12 py-3 outline-none font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 cursor-pointer transition-all"
                        >
                            {filterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">
                            <ChevronDown size={18} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 border-emerald-500 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl shadow-emerald-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] border-2 border-emerald-100">
                            <TrendingUp size={24} md:size={28} strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Total Income</span>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">
                            {currentTenant?.currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h2>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 border-rose-500 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl shadow-rose-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 md:p-4 bg-red-50 text-red-600 rounded-[1.5rem] border-2 border-red-100">
                            <TrendingDown size={24} md:size={28} strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-200">Expenses</span>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">
                            {currentTenant?.currency}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h2>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 border-indigo-500 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl md:col-span-2 lg:col-span-1 shadow-indigo-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] border-2 border-indigo-100">
                            <TrendingUp size={24} md:size={28} strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">Net Profit</span>
                    </div>
                    <div>
                        <h2 className={`text-3xl md:text-4xl font-black tracking-tighter leading-none ${netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            {currentTenant?.currency}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 border-indigo-500 shadow-indigo-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Calendar size={20} strokeWidth={3} />
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">Income vs Expenses</h3>
                    </div>
                    <div className="h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                                    tickFormatter={(val) => `${currentTenant?.currency}${val}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '1rem', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                    formatter={(value: any) => [`${currentTenant?.currency}${value.toLocaleString()}`, 'Amount']}
                                />
                                <Bar dataKey="amount" radius={[12, 12, 0, 0]}>
                                    {comparisonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Income' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-2 border-amber-500 shadow-amber-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <PieChartIcon size={20} strokeWidth={3} />
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">Expense Breakdown</h3>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="h-64 md:h-80 relative flex flex-col items-center">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        strokeWidth={4}
                                        stroke="#fff"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                        formatter={(value: any) => [`${currentTenant?.currency}${value.toLocaleString()}`, 'Total']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
                                {pieData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 tracking-widest">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 md:h-80 flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[2rem]">
                            <PieChartIcon size={48} className="opacity-20 mb-4" />
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">No expense data for this period</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
