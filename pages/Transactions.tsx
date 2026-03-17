
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, Order, Role } from '../types';
import { History, Search, Calendar, Eye, FileText, Printer, X, Hash, ChevronRight, User as UserIcon, Receipt, TrendingUp, DollarSign, Trophy, Award } from 'lucide-react';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export const Transactions = () => {
    const { transactions, currentTenant, orders, users } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [viewInvoice, setViewInvoice] = useState<Order | null>(null);

    // List of staff for the dropdown (exclude customers)
    const staffList = useMemo(() => {
        return users.filter(u => u.role !== Role.CUSTOMER);
    }, [users]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return transactions.filter(txn => {
            // Staff Filter
            const selectedStaff = staffList.find(s => s.id === selectedStaffId);
            const matchesStaff = selectedStaffId === 'all' || txn.creatorName === selectedStaff?.name;

            // Search Filter
            const matchesSearch = 
                txn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (txn.creatorName && txn.creatorName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Date Filter
            const txnDate = new Date(txn.date);
            let matchesDate = true;

            if (dateFilter === 'today') {
                matchesDate = txnDate >= startOfToday;
            } else if (dateFilter === 'week') {
                matchesDate = txnDate >= startOfWeek;
            } else if (dateFilter === 'month') {
                matchesDate = txnDate >= startOfMonth;
            } else if (dateFilter === 'custom') {
                const start = new Date(customRange.start);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customRange.end);
                end.setHours(23, 59, 59, 999);
                matchesDate = txnDate >= start && txnDate <= end;
            }

            return matchesSearch && matchesDate && matchesStaff;
        });
    }, [transactions, searchTerm, dateFilter, customRange, selectedStaffId, staffList]);

    // Summary calculations including Top Performer
    const stats = useMemo(() => {
        const count = filteredTransactions.length;
        const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Group by staff name
        const performanceMap: Record<string, { count: number; revenue: number }> = {};
        filteredTransactions.forEach(txn => {
            const name = txn.creatorName || 'Unknown';
            if (!performanceMap[name]) performanceMap[name] = { count: 0, revenue: 0 };
            performanceMap[name].count += 1;
            performanceMap[name].revenue += txn.amount;
        });

        // Find top performer by revenue
        let topName = null;
        let topRevenue = 0;
        let topCount = 0;

        Object.entries(performanceMap).forEach(([name, data]) => {
            if (data.revenue > topRevenue) {
                topRevenue = data.revenue;
                topName = name;
                topCount = data.count;
            }
        });

        return { 
            count, 
            total,
            topPerformer: topName ? { name: topName, count: topCount, revenue: topRevenue } : null
        };
    }, [filteredTransactions]);

    const openInvoice = (txn: Transaction) => {
        const originalOrder = orders.find(o => o.id === txn.orderId);
        if (originalOrder) {
            setViewInvoice(originalOrder);
        } else {
            alert("Order details archived or unavailable.");
        }
    };

    const printInvoice = () => window.print();

    const calculateInvoiceTotal = (order: Order) => {
        const subtotal = order.totalAmount;
        const vat = currentTenant?.includeVat ? (subtotal * ((currentTenant?.vatRate || 0) / 100)) : 0;
        return { subtotal, vat, total: subtotal + vat };
    };

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        <History className="text-indigo-600" size={36} /> Transaction History
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Audit trail & Staff Performance</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Order ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-900 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm uppercase transition-all shadow-sm"
                        />
                    </div>

                    {/* Staff Dropdown */}
                    <div className="relative w-full md:w-48">
                        <select 
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full appearance-none bg-white border-2 border-slate-900 rounded-2xl pl-10 pr-10 py-3 outline-none font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 cursor-pointer"
                        >
                            <option value="all">All Staff</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-900 pointer-events-none" size={16} strokeWidth={3} />
                    </div>

                    {/* Date Selector Dropdown */}
                    <div className="relative w-full md:w-48">
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full appearance-none bg-white border-2 border-slate-900 rounded-2xl pl-10 pr-10 py-3 outline-none font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-900 pointer-events-none" size={16} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === 'custom' && (
                <div className="bg-white p-4 rounded-[1.5rem] border-2 border-slate-900 shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:flex-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Start Date</label>
                        <input 
                            type="date" 
                            value={customRange.start}
                            onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-black outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="hidden sm:block text-slate-300 font-black mt-4">TO</div>
                    <div className="w-full sm:flex-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">End Date</label>
                        <input 
                            type="date" 
                            value={customRange.end}
                            onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-[10px] font-black outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}

            {/* Performance Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border-l-8 border-indigo-500 border-x-2 border-b-2 border-slate-900 flex items-center justify-between group transition-transform hover:-translate-y-1">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stats.count}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <Receipt size={24} strokeWidth={3} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border-l-8 border-emerald-500 border-x-2 border-b-2 border-slate-900 flex items-center justify-between group transition-transform hover:-translate-y-1">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                            {currentTenant?.currency}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <DollarSign size={24} strokeWidth={3} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border-l-8 border-amber-500 border-x-2 border-b-2 border-slate-900 flex flex-col justify-center group transition-transform hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform">
                        <Trophy size={100} strokeWidth={3} />
                    </div>
                    {stats.topPerformer ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="text-amber-500" size={16} strokeWidth={3} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Top Performer</p>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate mb-1">
                                {stats.topPerformer.name}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Orders: <span className="text-slate-900">{stats.topPerformer.count}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Revenue: <span className="text-emerald-600">{currentTenant?.currency}{stats.topPerformer.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                             <Trophy size={20} className="mb-1" />
                             <p className="text-[9px] font-black uppercase tracking-widest">No Leader Yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-900 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b-4 border-slate-900">
                            <tr>
                                <th className="p-6">Timestamp</th>
                                <th className="p-6">Order ID</th>
                                <th className="p-6">Items Summary</th>
                                <th className="p-6">Processor</th>
                                <th className="p-6">Total Amount</th>
                                <th className="p-6 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100">
                                            <Search className="text-slate-300" size={24} />
                                        </div>
                                        <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">No records found for this selection</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(txn => (
                                    <tr key={txn.id} className="hover:bg-slate-50 transition group">
                                        <td className="p-6">
                                            <div className="text-[10px] font-black text-slate-900">{new Date(txn.date).toLocaleDateString()}</div>
                                            <div className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                                #{txn.id.slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight max-w-[240px] truncate" title={txn.itemsSummary}>
                                                {txn.itemsSummary}
                                            </p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                                                    {txn.creatorName?.[0] || '?'}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase">{txn.creatorName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-black text-slate-900 text-sm">
                                                {currentTenant?.currency}{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button 
                                                type="button"
                                                onClick={() => openInvoice(txn)}
                                                className="bg-white border-2 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                                                title="View Receipt"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {viewInvoice && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:absolute print:inset-0">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:w-full print:rounded-none border-[6px] border-white animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center print:hidden bg-slate-50/50">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest"><FileText size={18} className="text-indigo-600"/> Receipt Vault</h3>
                            <button type="button" onClick={() => setViewInvoice(null)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-xl border-2 border-slate-100 transition"><X size={20}/></button>
                        </div>
                        <div className="p-10 overflow-y-auto flex-1 no-scrollbar" id="invoice-content">
                            <div className="text-center mb-8">
                                {currentTenant?.logo && <img src={currentTenant.logo} className="h-16 w-16 mx-auto mb-4 rounded-full border-4 border-slate-900" alt="Logo"/>}
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">{currentTenant?.name}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{currentTenant?.address}</p>
                            </div>
                            
                            <div className="border-y-4 border-slate-900 border-dashed py-6 mb-8">
                                <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Order Ref</span>
                                    <span className="text-slate-900">#{viewInvoice.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Date/Time</span>
                                    <span className="text-slate-900">{new Date(viewInvoice.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest items-center">
                                    <span className="text-slate-400">Token Number</span>
                                    <span className="text-3xl text-indigo-600 font-black tracking-tighter">#{viewInvoice.tokenNumber}</span>
                                </div>
                            </div>

                            <table className="w-full text-[10px] mb-8">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 text-slate-400 font-black uppercase tracking-widest">
                                        <th className="text-left py-3">Selection</th>
                                        <th className="text-right py-3">Qty</th>
                                        <th className="text-right py-3">Sub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewInvoice.items.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-50 font-black uppercase tracking-tight text-slate-900">
                                            <td className="py-3">{item.name}</td>
                                            <td className="text-right py-3">x{item.quantity}</td>
                                            <td className="text-right py-3">{currentTenant?.currency}{(item.price * item.quantity).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="space-y-2 mt-4">
                                {(() => {
                                    const { subtotal, vat, total } = calculateInvoiceTotal(viewInvoice);
                                    return (
                                        <>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Subtotal</span>
                                                <span>{currentTenant?.currency}{subtotal.toFixed(0)}</span>
                                            </div>
                                            {currentTenant?.includeVat && (
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>VAT ({currentTenant?.vatRate}%)</span>
                                                    <span>{currentTenant?.currency}{vat.toFixed(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-black text-4xl mt-8 border-t-4 border-slate-900 pt-6 tracking-tighter text-slate-900">
                                                <span>TOTAL</span>
                                                <span>{currentTenant?.currency}{total.toFixed(0)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            <div className="text-center mt-12 pt-8 border-t-2 border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1 leading-none">Powered by OmniDine</p>
                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Official Business Transaction Record</p>
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50 flex gap-4 print:hidden">
                            <button 
                                type="button" 
                                onClick={printInvoice} 
                                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-[2rem] hover:bg-black transition font-black uppercase tracking-widest text-[10px] shadow-xl border-4 border-white"
                            >
                                <Printer size={20} strokeWidth={3} /> Print Duplicate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
