
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
            alert("Category already exists.");
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
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-6 md:space-y-8">
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        <Wallet className="text-red-600" size={36} /> Operational Expenses
                    </h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Cash outflow tracking</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    {/* Date Selector */}
                    <div className="relative flex-1 sm:w-48">
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
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900" size={16} strokeWidth={3} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-none">
                        <button 
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-4 py-3 rounded-2xl hover:bg-slate-50 transition font-black uppercase text-[10px] tracking-widest shadow-sm"
                        >
                            <ListTree size={18} /> <span className="hidden sm:inline">Categories</span>
                        </button>
                        <button 
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 sm:px-6 py-3 rounded-2xl hover:bg-red-700 transition font-black uppercase text-[10px] tracking-widest shadow-lg border-2 border-white"
                        >
                            <Plus size={20} strokeWidth={3} /> Record <span className="hidden sm:inline">Expense</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Range Bar */}
            {dateFilter === 'custom' && (
                <div className="bg-white p-4 rounded-3xl border-2 border-slate-900 shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center gap-4">
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

            {isFormOpen && (
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border-l-8 border-red-500 mb-8 animate-in fade-in slide-in-from-top-4 border-4 border-slate-900">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">New Expense Record</h3>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500 bg-slate-50 p-2 rounded-xl border-2 border-slate-100 transition"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Expense Title</label>
                            <input 
                                type="text" 
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Daily Vegetable Supply"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-bold transition-all shadow-inner uppercase text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-red-600 font-black">{business.currency}</span>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black transition-all shadow-inner text-sm"
                                />
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                            <select 
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black uppercase text-xs transition-all shadow-inner appearance-none"
                            >
                                {business.expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Note (Optional)</label>
                            <input 
                                type="text" 
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Details..."
                                className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-bold transition-all shadow-inner text-sm"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row justify-end gap-3 pt-4 border-t-2 border-dashed border-slate-100">
                             <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition order-2 md:order-1">Cancel</button>
                             <button type="submit" className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition flex items-center justify-center gap-2 border-4 border-white order-1 md:order-2">
                                <Save size={18} strokeWidth={3}/> Save Record
                             </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-900 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b-4 border-slate-900">
                            <tr>
                                <th className="p-6">Date</th>
                                <th className="p-6">Title</th>
                                <th className="p-6">Category</th>
                                <th className="p-6">Note</th>
                                <th className="p-6">Amount</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {filteredExpenses.length === 0 ? (
                                <tr><td colSpan={6} className="p-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No expenses found for this period.</td></tr>
                            ) : (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-slate-50 transition group">
                                        <td className="p-6 text-[10px] font-black text-slate-400 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="p-6 font-black text-slate-900 uppercase tracking-tight text-sm">{exp.title}</td>
                                        <td className="p-6"><span className="px-3 py-1 bg-white rounded-xl text-[9px] text-slate-900 font-black border-2 border-slate-900 shadow-sm uppercase">{exp.category}</span></td>
                                        <td className="p-6 text-xs text-slate-400 italic font-bold max-w-xs truncate">{exp.note || '-'}</td>
                                        <td className="p-6 font-black text-red-600 text-lg whitespace-nowrap">-{business.currency}{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        <td className="p-6 text-right">
                                            <button 
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-3 text-slate-300 hover:text-red-600 bg-white border-2 border-transparent hover:border-red-100 rounded-xl transition shadow-sm active:scale-95"
                                            >
                                                <Trash2 size={18} strokeWidth={3} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden border-[6px] border-white animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Category Manager</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Organization</p>
                            </div>
                            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 text-slate-400 hover:text-red-500 transition active:scale-90"><X size={24}/></button>
                        </div>
                        
                        <div className="p-8 md:p-10 space-y-8 overflow-y-auto no-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Add New Category</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="flex-1 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl focus:bg-white outline-none font-black uppercase text-sm shadow-inner"
                                        placeholder="e.g. LOGISTICS"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="bg-slate-900 text-white px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition border-2 border-white"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {business.expenseCategories.map(cat => (
                                    <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-900 group transition hover:bg-white">
                                        <span className="font-black text-slate-900 uppercase text-xs">{cat}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleRenameCategory(cat)}
                                                className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition border-2 border-slate-100 hover:border-indigo-100 shadow-sm"
                                            >
                                                <Edit2 size={16} strokeWidth={3} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-2.5 bg-white text-slate-400 hover:text-red-600 rounded-xl transition border-2 border-slate-100 hover:border-red-100 shadow-sm"
                                            >
                                                <Trash2 size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                            <button 
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition border-4 border-white"
                            >
                                Close Manager
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
