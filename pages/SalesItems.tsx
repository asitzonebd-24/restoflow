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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredSales = useMemo(() => {
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

    if (dateFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt);
            if (isNaN(itemDate.getTime())) return false;
            if (dateFilter === 'today') return itemDate >= startOfToday;
            return true;
        });
    }

    return filtered;
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

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Categories</option>
          {currentTenant?.menuCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select 
          value={itemFilter}
          onChange={(e) => setItemFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Items</option>
          {filteredMenuItems.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Name</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedSales.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6 text-sm font-bold text-slate-900">{item.name}</td>
                  <td className="px-8 py-6 text-sm text-slate-600">{item.quantity}</td>
                  <td className="px-8 py-6 text-sm text-slate-600">{currentTenant?.currency}{item.price.toFixed(2)}</td>
                  <td className="px-8 py-6 text-sm text-slate-600">
                    {isNaN(new Date(item.createdAt).getTime()) 
                      ? 'N/A' 
                      : new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-50">
          {paginatedSales.map((item, index) => (
            <div key={index} className="p-6 hover:bg-slate-50/50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isNaN(new Date(item.createdAt).getTime()) 
                    ? 'N/A' 
                    : new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty:</span>
                  <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price:</span>
                  <span className="text-sm font-black text-indigo-600">{currentTenant?.currency}{item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
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
