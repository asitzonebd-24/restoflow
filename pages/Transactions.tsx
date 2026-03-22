
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, Order, Role } from '../types';
import { History, Search, Calendar, Eye, FileText, Printer, X, Hash, ChevronRight, User as UserIcon, Receipt, TrendingUp, DollarSign, Trophy, Award, Filter, Store } from 'lucide-react';

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
    const [viewInvoice, setViewInvoice] = useState<{ order: Order; transaction: Transaction } | null>(null);

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
            setViewInvoice({ order: originalOrder, transaction: txn });
        } else {
            alert("Order details archived or unavailable.");
        }
    };

    const printInvoice = () => {
      setTimeout(() => {
        window.print();
      }, 1000);
    };

    const calculateInvoiceTotal = (order: Order, discount: number = 0) => {
      const subtotal = order.totalAmount;
      const vat = currentTenant?.includeVat ? (subtotal * ((currentTenant?.vatRate || 0) / 100)) : 0;
      return { subtotal, vat, total: subtotal + vat - discount };
    };

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
            <div className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
                        <History className="text-indigo-500" size={32} /> Transaction History
                    </h1>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Audit trail & staff performance tracking</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search Order ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Staff Dropdown */}
                    <div className="relative w-full md:w-48">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                        >
                            <option value="all">All Staff</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    {/* Date Selector Dropdown */}
                    <div className="relative w-full md:w-48">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === 'custom' && (
                <div className="mb-10 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center gap-6">
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

            {/* Performance Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/20 border-2 border-indigo-100 border-b-8 border-b-indigo-500 flex items-center justify-between group hover:scale-[1.02] transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.count}</h3>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:rotate-12 transition-transform">
                        <Receipt size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-100/20 border-2 border-emerald-100 border-b-8 border-b-emerald-500 flex items-center justify-between group hover:scale-[1.02] transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                            {currentTenant?.currency}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:rotate-12 transition-transform">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-amber-100/20 border-2 border-amber-100 border-b-8 border-b-amber-500 flex flex-col justify-center group hover:scale-[1.02] transition-all relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform text-amber-500">
                        <Trophy size={100} />
                    </div>
                    {stats.topPerformer ? (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="text-amber-500" size={16} />
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Top Performer</p>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight truncate mb-1 uppercase">
                                {stats.topPerformer.name}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Orders: <span className="text-slate-900">{stats.topPerformer.count}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Revenue: <span className="text-emerald-600">{currentTenant?.currency}{stats.topPerformer.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 py-2">
                             <Trophy size={20} className="mb-1 opacity-40" />
                             <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">No Leader Yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-slate-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Timestamp</th>
                                <th className="px-8 py-6">Order ID</th>
                                <th className="px-8 py-6">Items Summary</th>
                                <th className="px-8 py-6">Processor</th>
                                <th className="px-8 py-6">Discount</th>
                                <th className="px-8 py-6">Total Amount</th>
                                <th className="px-8 py-6 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                                                <Search size={32} strokeWidth={1.5} className="opacity-40" />
                                            </div>
                                            <p className="text-sm font-black opacity-60 uppercase tracking-[0.2em]">No matching records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(txn => (
                                    <tr key={txn.id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{new Date(txn.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest shadow-sm">
                                                #{txn.id.slice(-6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-slate-600 max-w-[240px] truncate uppercase tracking-tight" title={txn.itemsSummary}>
                                                {txn.itemsSummary}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-lg border-b-2 border-slate-700">
                                                    {txn.creatorName?.[0] || '?'}
                                                </div>
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{txn.creatorName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-red-500 tracking-tighter">
                                                {txn.discount ? `-${currentTenant?.currency}${txn.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-900 tracking-tighter">
                                                {currentTenant?.currency}{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                type="button"
                                                onClick={() => openInvoice(txn)}
                                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 shadow-sm border-2 border-slate-100 hover:border-indigo-500/50 transition-all opacity-0 group-hover:opacity-100 group-hover:scale-110"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:p-0 print:static print:block">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={() => setViewInvoice(null)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:max-w-none print:rounded-none print:static print:block print:w-full print:opacity-100 print:transform-none">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center print:hidden bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                              <FileText size={18} className="text-indigo-500"/> Receipt Vault
                            </h3>
                            <button type="button" onClick={() => setViewInvoice(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                              <X size={20}/>
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible" id="invoice-content">
                            <div className="text-center mb-10">
                                <div className="h-16 w-16 mx-auto mb-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                                  {currentTenant?.logo ? (
                                    <img src={currentTenant.logo} className="h-full w-full object-contain" alt="Logo"/>
                                  ) : (
                                    <Store size={32} className="text-indigo-600" />
                                  )}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{currentTenant?.name}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentTenant?.address}</p>
                            </div>
                            
                            <div className="border-y border-slate-100 py-8 mb-8 bg-slate-50/50 rounded-3xl px-6">
                                <div className="flex justify-between text-[10px] mb-3 font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Order Ref</span>
                                    <span className="text-slate-900">#{viewInvoice.order.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] mb-4 font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Date/Time</span>
                                    <span className="text-slate-900">{new Date(viewInvoice.order.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token Number</span>
                                    <span className="text-4xl text-indigo-600 font-bold tracking-tight">#{viewInvoice.order.tokenNumber}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                                  <span>Selection</span>
                                  <span>Subtotal</span>
                                </div>
                                <div className="space-y-3">
                                    {viewInvoice.order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-medium">
                                            <div className="flex items-center gap-3">
                                                <span className="text-indigo-500 font-bold">x{item.quantity}</span>
                                                <span className="text-slate-700">{item.name}</span>
                                            </div>
                                            <span className="text-slate-900 font-bold">{currentTenant?.currency}{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                {(() => {
                                    const { subtotal, vat, total } = calculateInvoiceTotal(viewInvoice.order, viewInvoice.transaction.discount);
                                    return (
                                        <>
                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                                <span>Subtotal</span>
                                                <span>{currentTenant?.currency}{subtotal.toFixed(2)}</span>
                                            </div>
                                            {currentTenant?.includeVat && (
                                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                                    <span>VAT ({currentTenant?.vatRate}%)</span>
                                                    <span>{currentTenant?.currency}{vat.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {viewInvoice.transaction.discount ? (
                                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-red-500">
                                                    <span>Discount</span>
                                                    <span>-{currentTenant?.currency}{viewInvoice.transaction.discount.toFixed(2)}</span>
                                                </div>
                                            ) : null}
                                            <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-900">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Total Amount</span>
                                                <span className="text-3xl font-bold text-slate-900 tracking-tight">{currentTenant?.currency}{total.toFixed(2)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            <div className="text-center mt-16 pt-8 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Official Transaction Record</p>
                                <div className="flex items-center justify-center gap-2 opacity-20">
                                  <Receipt size={12} />
                                  <p className="text-[8px] font-bold uppercase tracking-widest">RestoFlow Professional OS</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50 flex gap-4 print:hidden">
                            <button 
                                type="button" 
                                onClick={printInvoice} 
                                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl hover:bg-slate-800 transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95"
                            >
                                <Printer size={18} /> Print Duplicate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
