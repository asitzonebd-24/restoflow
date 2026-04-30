import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, LogIn, LogOut, Calendar, User, History, CheckCircle2, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AttendancePage = () => {
  const { currentUser, attendance, clockIn, clockOut, business } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: business?.timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  
  const todayAttendance = attendance.find(a => a.userId === currentUser?.id && a.date === today);
  const myAttendanceHistory = attendance.filter(a => a.userId === currentUser?.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <header className="bg-white border-b-4 border-indigo-500 p-6 md:p-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-4">
              <Clock className="text-indigo-600" size={32} />
              Staff Attendance
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              Daily clock-in and clock-out for all restaurant staff
            </p>
          </div>
          <div className="bg-black text-white px-8 py-4 rounded-[2rem] font-black uppercase text-xl tracking-widest shadow-xl border-4 border-white flex items-center gap-4">
            <Timer size={24} className="text-indigo-400" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white rounded-[3rem] border-4 border-black p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 z-0" />
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight leading-none">{currentUser?.name}</h2>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{currentUser?.role}</span>
                    </div>
                 </div>

                 {!todayAttendance ? (
                   <button 
                     onClick={() => clockIn()}
                     className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition border-4 border-white"
                   >
                     <LogIn size={24} /> Clock In Now
                   </button>
                 ) : todayAttendance.checkOut ? (
                   <div className="bg-emerald-50 border-4 border-emerald-500 p-6 rounded-[2rem] flex flex-col items-center gap-2">
                      <CheckCircle2 size={48} className="text-emerald-500" />
                      <p className="text-sm font-black uppercase text-emerald-700">Finished for Today</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">You have clocked out successfully.</p>
                   </div>
                 ) : (
                   <button 
                     onClick={() => clockOut(todayAttendance.id)}
                     className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-rose-100 hover:scale-105 active:scale-95 transition border-4 border-white"
                   >
                     <LogOut size={24} /> Clock Out Now
                   </button>
                 )}
               </div>
            </section>

            <section className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                    <History size={16} /> Today's Stats
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Check In</span>
                        <span className="text-sm font-black tracking-widest">{todayAttendance ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Check Out</span>
                        <span className="text-sm font-black tracking-widest">{todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Duration</span>
                        <span className="text-sm font-black tracking-widest">
                            {todayAttendance?.checkIn ? (
                                todayAttendance.checkOut 
                                    ?  `${Math.round((new Date(todayAttendance.checkOut).getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60))} hrs`
                                    : `${Math.round((new Date().getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60))} hrs (Ongoing)`
                            ) : '0 hrs'}
                        </span>
                    </div>
                </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] border-4 border-black p-8 shadow-2xl min-h-full">
                <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Calendar className="text-indigo-600" size={24} />
                        Attendance History
                     </h2>
                </div>

                <div className="space-y-4">
                    {myAttendanceHistory.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem]">
                            <History size={48} className="text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No history available</p>
                        </div>
                    ) : (
                        myAttendanceHistory.map((entry) => (
                            <div key={entry.id} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-indigo-500 transition-all gap-4">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white rounded-xl border-2 border-slate-200 flex flex-col items-center justify-center leading-none">
                                         <span className="text-[8px] font-black uppercase text-slate-400 mb-1">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</span>
                                         <span className="text-lg font-black">{new Date(entry.date).getDate()}</span>
                                     </div>
                                     <div>
                                         <p className="text-sm font-black uppercase text-slate-800">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entry.status}</p>
                                     </div>
                                </div>
                                <div className="flex items-center gap-8">
                                     <div className="text-right">
                                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Entry</p>
                                         <p className="text-xs font-black">{new Date(entry.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Exit</p>
                                         <p className="text-xs font-black">{entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                     </div>
                                     <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${entry.checkOut ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                         {entry.checkOut ? 'Completed' : 'Active'}
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
