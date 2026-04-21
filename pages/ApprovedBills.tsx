
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillStatus, Role } from '../types';
import { FileText, CheckCircle, Calendar, Search, Building2, ExternalLink } from 'lucide-react';

export const ApprovedBills = () => {
  const { monthlyBills, currentUser, tenants } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const approvedBills = monthlyBills.filter(bill => 
    (bill.status === BillStatus.APPROVED || bill.status === BillStatus.PAID) &&
    (bill.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     bill.month.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Approved Bills</h1>
          <p className="text-slate-500">View all approved monthly bills for restaurants</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search approved bills by restaurant or month..."
            className="bg-transparent border-none focus:ring-0 flex-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Restaurant</th>
                <th className="px-6 py-4 font-semibold">Month</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Approved At</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvedBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No approved bills found.
                  </td>
                </tr>
              ) : (
                approvedBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Building2 size={20} />
                        </div>
                        <p className="font-bold text-slate-900">{bill.tenantName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {bill.month}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {tenants.find(t => t.id === bill.tenantId)?.currency || '৳'}{bill.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {bill.approvedAt ? new Date(bill.approvedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          bill.status === BillStatus.PAID ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {bill.status === BillStatus.PAID ? 'Paid Online' : 'Manual Approved'}
                        </span>
                        {bill.txnId && (
                          <span className="text-[8px] font-bold text-slate-400">TXN: {bill.txnId}</span>
                        )}
                      </div>
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
