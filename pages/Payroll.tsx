import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, Users, History, CheckCircle2, AlertCircle, ChevronRight, DollarSign, Calendar, TrendingUp, Calculator, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PayrollPage = () => {
  const { payroll, users, attendance, generatePayroll, markPayrollPaid, business } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);

  const staffUsers = useMemo(() => {
    return users.filter(u => u.role !== 'Super Admin' && u.role !== 'Customer');
  }, [users]);

  const monthPayroll = useMemo(() => {
    return payroll.filter(p => p.month === selectedMonth);
  }, [payroll, selectedMonth]);

  const stats = useMemo(() => {
    const total = monthPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);
    const paid = monthPayroll.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.netSalary, 0);
    const pending = total - paid;
    return { total, paid, pending, count: monthPayroll.length };
  }, [monthPayroll]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <header className="bg-white border-b-4 border-indigo-500 p-6 md:p-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-4">
              <Wallet className="text-indigo-600" size={32} />
              Payroll Management
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              Automated salary calculation based on staff attendance
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100 shadow-inner">
             <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-black px-6 py-2 outline-none uppercase text-xs tracking-widest"
             />
             <button 
                onClick={async () => {
                    setIsGenerating(true);
                    await generatePayroll(selectedMonth);
                    setIsGenerating(false);
                }}
                disabled={isGenerating}
                className="bg-black text-white px-8 py-3 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
             >
                <RefreshCcw size={14} className={isGenerating ? 'animate-spin' : ''} />
                {monthPayroll.length > 0 ? 'Recalculate' : 'Generate Payroll'}
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white rounded-[2.5rem] border-4 border-black p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={64} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Payout</p>
                 <h2 className="text-4xl font-black">{business.currency}{stats.total.toLocaleString()}</h2>
                 <p className="text-[10px] font-bold text-indigo-500 uppercase mt-2">For {stats.count} Employees</p>
             </div>
             
             <div className="bg-emerald-500 rounded-[2.5rem] border-4 border-black p-8 shadow-2xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-20">
                    <CheckCircle2 size={64} />
                 </div>
                 <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-4">Paid Salaries</p>
                 <h2 className="text-4xl font-black">{business.currency}{stats.paid.toLocaleString()}</h2>
                 <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                        <span>Paid Count</span>
                        <span>{monthPayroll.filter(p => p.status === 'paid').length} Staff</span>
                    </div>
                 </div>
             </div>

             <div className="bg-rose-500 rounded-[2.5rem] border-4 border-black p-8 shadow-2xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-20">
                    <AlertCircle size={64} />
                 </div>
                 <p className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em] mb-4">Pending Payout</p>
                 <h2 className="text-4xl font-black">{business.currency}{stats.pending.toLocaleString()}</h2>
                 <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                        <span>Remaining</span>
                        <span>{monthPayroll.filter(p => p.status === 'pending').length} Staff</span>
                    </div>
                 </div>
             </div>
          </div>

          <div className="bg-white rounded-[3rem] border-4 border-black p-4 md:p-8 shadow-2xl overflow-hidden">
             <div className="px-4 py-6 md:p-8 flex items-center justify-between border-b-4 border-slate-50 mb-4 md:mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-indigo-600" size={24} />
                    Salary Sheet - {new Date(selectedMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h3>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-6 pb-2">Employee</th>
                            <th className="px-6 pb-2">Attendance</th>
                            <th className="px-6 pb-2 text-right">Base Salary</th>
                            <th className="px-6 pb-2 text-right">Net Amount</th>
                            <th className="px-6 pb-2 text-center">Status</th>
                            <th className="px-6 pb-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthPayroll.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-20 capitalize">
                                        <Calculator size={48} className="mb-4" />
                                        <p className="font-black text-slate-500 uppercase tracking-[0.2em]">Generate payroll to view list</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            monthPayroll.map((p) => (
                                <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 bg-slate-50 md:bg-transparent rounded-l-[2rem] md:rounded-none border-y-2 border-l-2 md:border-none border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg">
                                                {p.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase text-slate-800">{p.userName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee UID: {p.userId.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-y-2 md:border-none border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500 rounded-full" 
                                                    style={{ width: `${(p.attendanceCount / 30) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black">{p.attendanceCount}/30 Days</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right border-y-2 md:border-none border-slate-100">
                                        <span className="text-xs font-bold text-slate-400">{business.currency}{p.baseSalary.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right border-y-2 md:border-none border-slate-100">
                                        <span className="text-sm font-black text-slate-900">{business.currency}{p.netSalary.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center border-y-2 md:border-none border-slate-100">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right bg-slate-50 md:bg-transparent rounded-r-[2rem] md:rounded-none border-y-2 border-r-2 md:border-none border-slate-100">
                                        {p.status === 'pending' ? (
                                            <button 
                                                onClick={() => markPayrollPaid(p.id)}
                                                className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                Pay Now
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-slate-300">Success</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
