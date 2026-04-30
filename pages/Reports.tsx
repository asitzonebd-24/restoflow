
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, Calendar, Search, ChevronDown, BarChart3, Clock, ShoppingBag, Sparkles, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { OrderStatus } from '../types';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export const Reports = () => {
    const { transactions, expenses, currentTenant, orders, menu } = useApp();
    const [dateFilter, setDateFilter] = useState<DateFilter>('month');
    const [customRange, setCustomRange] = useState({
        start: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const filterFn = (item: { date?: string; createdAt?: string }) => {
            const dateStr = item.date || item.createdAt;
            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
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
            expenses: expenses.filter(filterFn),
            orders: orders.filter(o => o.status === OrderStatus.COMPLETED).filter(filterFn)
        };
    }, [transactions, expenses, orders, dateFilter, customRange]);

    const totalIncome = filteredData.transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const orderCount = filteredData.orders.length;
    const avgOrderValue = orderCount > 0 ? totalIncome / orderCount : 0;
    const netProfit = totalIncome - totalExpense;

    // 1. Sales Trend (Daily Revenue)
    const salesTrendData = useMemo(() => {
        const dailyData: Record<string, number> = {};
        filteredData.transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyData[date] = (dailyData[date] || 0) + t.amount;
        });

        return Object.keys(dailyData).map(date => ({
            date,
            revenue: dailyData[date]
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredData.transactions]);

    // 2. Top Selling Items
    const topItemsData = useMemo(() => {
        const itemCounts: Record<string, { name: string, quantity: number }> = {};
        filteredData.orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemCounts[item.itemId]) {
                    itemCounts[item.itemId] = { name: item.name, quantity: 0 };
                }
                itemCounts[item.itemId].quantity += item.quantity;
            });
        });

        return Object.values(itemCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 8);
    }, [filteredData.orders]);

    // 3. Hourly Sales (Peak Times)
    const hourlyData = useMemo(() => {
        const hours: Record<number, number> = {};
        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) hours[i] = 0;

        filteredData.orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });

        return Object.keys(hours).map(h => ({
            hour: `${h}:00`,
            orders: hours[Number(h)]
        }));
    }, [filteredData.orders]);

    // 4. Sales by Category
    const categoryData = useMemo(() => {
        const catSales: Record<string, number> = {};
        filteredData.orders.forEach(order => {
            order.items.forEach(item => {
                const menuItem = menu.find(m => m.id === item.itemId);
                const cat = menuItem?.category || 'Uncategorized';
                catSales[cat] = (catSales[cat] || 0) + (item.price * item.quantity);
            });
        });

        return Object.keys(catSales).map(name => ({
            name,
            value: catSales[name]
        })).sort((a, b) => b.value - a.value);
    }, [filteredData.orders, menu]);

    // Data for Expense Categories Pie Chart
    const expenseByCategory = filteredData.expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(expenseByCategory).map(key => ({
        name: key,
        value: expenseByCategory[key]
    }));

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    const filterOptions: { label: string; value: DateFilter }[] = [
        { label: 'Today', value: 'today' },
        { label: 'Last 7 Days', value: 'week' },
        { label: 'Last 30 Days', value: 'month' },
        { label: 'Custom Range', value: 'custom' },
        { label: 'All Time', value: 'all' },
    ];

    // Simulated Insights
    const insights = useMemo(() => {
        const list = [];
        if (totalIncome > totalExpense * 1.5) list.push({ text: "Healthy profit margin detected for this period.", type: "positive" });
        if (hourlyData.some(h => h.orders > (orderCount / 24) * 2)) {
            const peak = [...hourlyData].sort((a, b) => b.orders - a.orders)[0];
            list.push({ text: `Peak traffic typically occurs around ${peak.hour}.`, type: "neutral" });
        }
        if (topItemsData.length > 0) {
            list.push({ text: `"${topItemsData[0].name}" is currently your most popular item.`, type: "positive" });
        }
        if (totalExpense > totalIncome * 0.7) {
            list.push({ text: "High expense ratio. Consider reviewing operational costs.", type: "warning" });
        }
        return list;
    }, [totalIncome, totalExpense, hourlyData, topItemsData, orderCount]);

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <PieChartIcon className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            Analytics <span className="text-indigo-600">Hub</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Advanced Business Intelligence Dashboard</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
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
                    
                    <div className="relative w-full md:w-64">
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full appearance-none bg-white border-2 border-slate-900 rounded-2xl pl-5 pr-12 py-3.5 outline-none font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 cursor-pointer transition-all"
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

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Revenue", value: totalIncome, icon: TrendingUp, color: "emerald", iconColor: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-500" },
                    { label: "Expenses", value: totalExpense, icon: TrendingDown, color: "rose", iconColor: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-500" },
                    { label: "Net Profit", value: netProfit, icon: Layers, color: "indigo", iconColor: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-500" },
                    { label: "Avg Ticket", value: avgOrderValue, icon: ShoppingBag, color: "amber", iconColor: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-500" }
                ].map((stat, idx) => (
                    <div key={idx} className={`bg-white p-6 rounded-[2rem] shadow-lg border-2 ${stat.borderColor} flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl group`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 ${stat.bgColor} ${stat.iconColor} rounded-2xl border-2 border-white shadow-sm transition-transform group-hover:scale-110`}>
                                <stat.icon size={22} strokeWidth={3} />
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${stat.iconColor} ${stat.bgColor} px-3 py-1 rounded-full border opacity-80`}>{stat.label}</span>
                        </div>
                        <div className="mt-2">
                             <h2 className={`text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none ${stat.label === "Net Profit" && stat.value < 0 ? "!text-rose-600" : ""}`}>
                                {currentTenant?.currency}{stat.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Performance Trend */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-900 shadow-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50"></div>
                    <div className="relative z-10 flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                                <TrendingUp size={22} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Performance Trend</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Revenue growth over time</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-72 md:h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrendData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                                    tickFormatter={(val) => `${currentTenant?.currency}${val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1.5rem', border: '2px solid #0f172a', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${currentTenant?.currency}${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popular Items */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-900 shadow-slate-100">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                            <BarChart3 size={22} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Top Performers</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Most ordered by quantity</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {topItemsData.length > 0 ? topItemsData.map((item, idx) => {
                            const maxQty = Math.max(...topItemsData.map(i => i.quantity));
                            const percentage = (item.quantity / maxQty) * 100;
                            return (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                        <span className="text-slate-800 truncate max-w-[150px]">{item.name}</span>
                                        <span className="text-indigo-600">{item.quantity} Qty</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                                        <div 
                                            className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-200 border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                                <ShoppingBag size={48} className="opacity-20 mb-4" />
                                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No sales items data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Insights & Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Insights Panel */}
                <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden lg:col-span-1">
                    <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-white/10">
                            <Sparkles size={20} strokeWidth={3} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">Hub Insights</h3>
                    </div>
                    <div className="space-y-4">
                        {insights.length > 0 ? insights.map((insight, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-3">
                                {insight.type === 'positive' ? <ArrowUpRight className="text-emerald-400 shrink-0" size={18} /> : 
                                 insight.type === 'warning' ? <ArrowDownRight className="text-rose-400 shrink-0" size={18} /> : 
                                 <ChevronDown className="text-indigo-400 shrink-0" size={18} />}
                                <p className="text-[10px] font-bold leading-relaxed">{insight.text}</p>
                            </div>
                        )) : (
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center py-10">Waiting for more data to generate insights...</p>
                        )}
                    </div>
                </div>

                {/* Peak Hours Chart */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-900 shadow-slate-100 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                            <Clock size={22} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Peak Hours</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">When are you busiest?</p>
                        </div>
                    </div>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="hour" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} 
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '1rem', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-900 shadow-slate-100 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                            <PieChartIcon size={22} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Expense Mix</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cost distribution</p>
                        </div>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="h-64 relative flex flex-col items-center">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        strokeWidth={3}
                                        stroke="#fff"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1.2rem', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
                                {pieData.slice(0, 4).map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                            <PieChartIcon size={40} className="opacity-10 mb-4" />
                            <p className="font-black uppercase tracking-widest text-[8px]">No data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
