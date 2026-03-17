
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { Wallet, Plus, Trash2, X, ListTree, Edit2, Save, ChevronDown, Calendar, Search } from 'lucide-react';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export const Expenses = () => {
    const { expenses, addExpense, deleteExpense, business, currentUser, addExpenseCategory, renameExpenseCategory, deleteExpenseCategory } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    // Filtering State
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(business.expenseCategories[0] || 'Other');
    const [note, setNote] = useState('');

    // Category Management State
    const [newCategoryName, setNewCategoryName] = useState('');

    const filteredExpenses = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            let matchesDate = true;

            if (dateFilter === 'today') {
                matchesDate = expDate >= startOfToday;
            } else if (dateFilter === 'week') {
                matchesDate = expDate >= startOfWeek;
            } else if (dateFilter === 'month') {
                matchesDate = expDate >= startOfMonth;
            } else if (dateFilter === 'custom') {
                const start = new Date(customRange.start);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customRange.end);
                end.setHours(23, 59, 59, 999);
                matchesDate = expDate >= start && expDate <= end;
            }

            return matchesDate;
        });
    }, [expenses, dateFilter, customRange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const newExpense = {
            id: `exp-${Date.now()}`,
            title,
            amount: parseFloat(amount),
            category,
            date: new Date().toISOString(),
            note,
            recordedBy: currentUser.id
        };

        addExpense(newExpense);
        setTitle('');
        setAmount('');
        setCategory(business.expenseCategories[0] || 'Other');
        setNote('');
        setIsFormOpen(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this expense entry?')) {
            deleteExpense(id);
        }
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        if (business.expenseCategories.includes(newCategoryName.trim())) {
            return;
        }
        addExpenseCategory(newCategoryName.trim());
        setNewCategoryName('');
    };

    const handleRenameCategory = (oldName: string) => {
        const newName = prompt(`Rename "${oldName}" to:`, oldName);
        if (newName && newName.trim() && newName !== oldName) {
            renameExpenseCategory(oldName, newName.trim());
        }
    };

    const handleDeleteCategory = (catName: string) => {
        if (window.confirm(`Delete category "${catName}"? Associated expenses will be moved to "Other".`)) {
            deleteExpenseCategory(catName);
        }
    };

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
                        <Wallet className="text-red-500" size={32} /> Operational Expenses
                    </h1>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Track cash outflow and operational costs</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="bg-white text-slate-600 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <ListTree size={16} /> Categories
                    </button>
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={16} /> Record Expense
                    </button>
                </div>
            </div>

            {/* Filters & Stats */}
            <div className="mb-10 flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-100 px-6 py-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Period Expenses</p>
                        <p className="text-2xl font-bold text-slate-900">{business.currency}{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-slate-100 px-6 py-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Count</p>
                        <p className="text-2xl font-bold text-slate-900">{filteredExpenses.length}</p>
                    </div>
                    <div className="bg-white border border-slate-100 px-6 py-5 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Top Category</p>
                        <p className="text-2xl font-bold text-slate-900 truncate">
                            {filteredExpenses.length > 0 ? (
                                Object.entries(filteredExpenses.reduce((acc, e) => {
                                    acc[e.category] = (acc[e.category] || 0) + e.amount;
                                    return acc;
                                }, {} as Record<string, number>)).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0][0]
                            ) : '-'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative min-w-[200px]">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Custom Range Bar */}
            {dateFilter === 'custom' && (
                <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-full sm:flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                        <input 
                            type="date" 
                            value={customRange.start}
                            onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <div className="hidden sm:block text-slate-300 font-bold mt-6">TO</div>
                    <div className="w-full sm:flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                        <input 
                            type="date" 
                            value={customRange.end}
                            onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Expense Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Transaction Details</th>
                                <th className="px-8 py-5">Category</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Wallet size={48} />
                                            <p className="text-sm font-bold uppercase tracking-widest">No expenses recorded</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-slate-400">{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-900">{exp.title}</p>
                                            {exp.note && <p className="text-[10px] text-slate-400 font-medium mt-1 italic">"{exp.note}"</p>}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-base font-bold text-red-500">
                                                -{business.currency}{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => handleDelete(exp.id)}
                                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Expense Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 md:p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Record Expense</h2>
                                    <p className="text-slate-400 text-sm mt-1">Log a new operational cost</p>
                                </div>
                                <button onClick={() => setIsFormOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Expense Title</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="e.g. Daily Vegetable Supply"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{business.currency}</span>
                                                <input 
                                                    type="number" 
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={amount}
                                                    onChange={e => setAmount(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                            <div className="relative">
                                                <select 
                                                    value={category}
                                                    onChange={e => setCategory(e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                                >
                                                    {business.expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Note (Optional)</label>
                                        <textarea 
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Add any additional details..."
                                            rows={3}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Save size={16} /> Save Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                        <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Expense Categories</h2>
                                <p className="text-slate-400 text-sm mt-1">Organize your operational costs</p>
                            </div>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
                            <div className="mb-10">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Add New Category</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="e.g. Logistics"
                                    />
                                    <button 
                                        onClick={handleAddCategory}
                                        className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {business.expenseCategories.map(cat => (
                                    <div key={cat} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                                        <span className="font-bold text-slate-900">{cat}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRenameCategory(cat)}
                                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 shadow-sm border border-slate-100"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                            <button 
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-full py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
