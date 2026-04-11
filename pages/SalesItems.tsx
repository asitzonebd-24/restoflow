import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, MenuItem } from '../types';
import { Search, Calendar, Filter, ShoppingBag } from 'lucide-react';
import { Pagination } from '../components/Pagination';

export const SalesItems = () => {
  const { orders, menu, currentTenant } = useApp();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredSales = useMemo(() => {
    // Show items only when a filter is selected
    if (categoryFilter === 'all' && itemFilter === 'all' && dateFilter === 'all') {
      return [];
    }

    let filtered = orders.flatMap(order => 
      order.items.map(item => ({
        ...item,
        orderId: order.id,
        createdAt: order.createdAt
      }))
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => {
        const menuItem = menu.find(m => m.id === item.itemId);
        return menuItem?.category === categoryFilter;
      });
    }

    if (itemFilter !== 'all') {
      filtered = filtered.filter(item => item.itemId === itemFilter);
    }

    if (dateFilter !== 'all' && dateFilter !== 'all_time') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt);
            if (isNaN(itemDate.getTime())) return false;
            
            if (dateFilter === 'today') {
              return itemDate >= startOfToday;
            } else if (dateFilter === '7days') {
              const sevenDaysAgo = new Date(startOfToday);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return itemDate >= sevenDaysAgo;
            } else if (dateFilter === '30days') {
              const thirtyDaysAgo = new Date(startOfToday);
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return itemDate >= thirtyDaysAgo;
            } else if (dateFilter === 'custom') {
              if (customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                return itemDate >= start && itemDate <= end;
              }
              return true;
            }
            return true;
        });
    }

    // Group by itemId to prevent double counting and sum quantities
    const grouped = filtered.reduce((acc, item) => {
      if (!acc[item.itemId]) {
        acc[item.itemId] = {
          ...item,
          quantity: 0,
        };
      }
      acc[item.itemId].quantity += item.quantity;
      
      // Keep the latest date
      const currentDate = new Date(acc[item.itemId].createdAt).getTime();
      const newDate = new Date(item.createdAt).getTime();
      if (!isNaN(newDate) && (isNaN(currentDate) || newDate > currentDate)) {
        acc[item.itemId].createdAt = item.createdAt;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convert back to array and sort by quantity descending (most sold first)
    return Object.values(grouped).sort((a: any, b: any) => b.quantity - a.quantity);
  }, [orders, menu, categoryFilter, itemFilter, dateFilter]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, itemFilter, dateFilter]);

  const filteredMenuItems = useMemo(() => {
    if (categoryFilter === 'all') return menu;
    return menu.filter(m => m.category === categoryFilter);
  }, [menu, categoryFilter]);

  // Reset item filter when category changes
  React.useEffect(() => {
    setItemFilter('all');
  }, [categoryFilter]);

  const totalQuantity = useMemo(() => filteredSales.reduce((sum, item) => sum + item.quantity, 0), [filteredSales]);

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 h-full overflow-y-auto no-scrollbar">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
            <ShoppingBag className="text-indigo-500" size={32} /> Sales Items
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Track individual sales</p>
        </div>
        <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Quantity</p>
          <p className="text-2xl font-black text-indigo-900">{totalQuantity}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-black mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="all">Select Categories</option>
            {currentTenant?.menuCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="all">Select Items</option>
            {filteredMenuItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          >
            <option value="all">Select Time</option>
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2">
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
            />
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-black overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 border-black">
              <tr>
                <th className="px-8 py-6 border-r border-black w-16 text-center">SL</th>
                <th className="px-8 py-6 border-r border-black">Item Name</th>
                <th className="px-8 py-6 border-r border-black">Quantity</th>
                <th className="px-8 py-6 border-r border-black">Price</th>
                <th className="px-8 py-6 border-r border-black">Total Amount</th>
                <th className="px-8 py-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Filter size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">
                        {categoryFilter === 'all' && itemFilter === 'all' && dateFilter === 'all' 
                          ? 'Please select a filter to view items' 
                          : 'No items found for selected filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-8 py-6 text-sm font-bold text-slate-500 border-r border-black text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-900 border-r border-black">{item.name}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 border-r border-black">{item.quantity}</td>
                    <td className="px-8 py-6 text-sm text-slate-600 border-r border-black">{currentTenant?.currency}{item.price.toFixed(2)}</td>
                    <td className="px-8 py-6 text-sm font-bold text-indigo-600 border-r border-black">{currentTenant?.currency}{(item.quantity * item.price).toFixed(2)}</td>
                    <td className="px-8 py-6 text-sm text-slate-600">
                      {isNaN(new Date(item.createdAt).getTime()) 
                        ? 'N/A' 
                        : new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
          {paginatedSales.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-black">
              <Filter size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest text-center">
                {categoryFilter === 'all' && itemFilter === 'all' && dateFilter === 'all' 
                  ? 'Please select a filter to view items' 
                  : 'No items found for selected filters'}
              </p>
            </div>
          ) : (
            paginatedSales.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/20 border-2 border-black border-b-8 border-b-indigo-500 flex flex-col justify-center group hover:scale-[1.02] transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 border-2 border-black flex items-center justify-center text-xs font-black text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border-2 border-black uppercase tracking-widest shadow-sm">
                    {isNaN(new Date(item.createdAt).getTime()) 
                      ? 'N/A' 
                      : new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                    <span className="text-lg font-black text-slate-900">{item.quantity}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                    <span className="text-lg font-black text-slate-600">{currentTenant?.currency}{item.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-black border-dashed">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-indigo-600">{currentTenant?.currency}{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredSales.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
