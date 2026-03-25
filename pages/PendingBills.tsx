
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillStatus, Role } from '../types';
import { FileText, CheckCircle, Calendar, Plus, Search, Building2 } from 'lucide-react';

export const PendingBills = () => {
  const { monthlyBills, generateMonthlyBills, approveBill, currentUser, tenants } = useApp();
  const [month, setMonth] = useState(() => new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const pendingBills = monthlyBills.filter(bill => bill.status === BillStatus.PENDING);

  const handleGenerate = async () => {
    setMessage(null);
    const combinedMonth = `${month} ${year}`;
    const count = await generateMonthlyBills(combinedMonth);
    if (count > 0) {
      setMessage({ text: `Successfully generated ${count} new bills for ${combinedMonth}.`, type: 'success' });
    } else {
      setMessage({ text: `No new bills were generated. All active restaurants already have bills for ${combinedMonth}.`, type: 'info' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 11 }).map((_, i) => (new Date().getFullYear() - 5 + i).toString());

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pending Bills</h1>
          <p className="text-slate-500">Generate and approve monthly bills for active restaurants</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-sm"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-sm"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Generate Bills
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-indigo-50 border-indigo-200 text-indigo-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <FileText size={20} />}
          <p className="text-sm font-bold uppercase tracking-widest">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Restaurant</th>
                <th className="px-6 py-4 font-semibold">Month</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No pending bills found. Generate bills to get started.
                  </td>
                </tr>
              ) : (
                pendingBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Building2 size={20} />
                        </div>
                        <p className="font-bold text-slate-900">{bill.tenantName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {bill.month}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {currentUser?.role === Role.SUPER_ADMIN ? '৳' : (tenants.find(t => t.id === bill.tenantId)?.currency || '৳')}{bill.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => approveBill(bill.id)}
                        className="flex items-center gap-2 ml-auto bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 transition"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
