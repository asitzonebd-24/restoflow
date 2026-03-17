
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, RefreshCw, Plus, Edit2, X, Save, Search, ChevronRight } from 'lucide-react';

export const Inventory = () => {
  const { inventory, updateInventory, addInventoryItem, editInventoryItem, currentTenant } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    unit: 'kg',
    quantity: 0,
    minThreshold: 5,
    pricePerUnit: 0
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', supplier: '', unit: 'kg', quantity: 0, minThreshold: 5, pricePerUnit: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, supplier: item.supplier, unit: item.unit, quantity: item.quantity, minThreshold: item.minThreshold, pricePerUnit: item.pricePerUnit });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    if (editingItem) {
      editInventoryItem(editingItem.id, formData);
    } else {
      const newItem: InventoryItem = { id: `inv-${Date.now()}`, ...formData };
      addInventoryItem(newItem);
    }
    setIsModalOpen(false);
  };

  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
            <Package className="text-amber-500" size={36} /> Stockroom Manager
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Supply & Replenishment tracking</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Search stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-900 rounded-2xl outline-none font-black text-[10px] uppercase shadow-sm focus:ring-4 focus:ring-amber-50 transition-all" />
          </div>
          <button onClick={openAddModal} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition border-4 border-white flex items-center justify-center gap-3">
            <Plus size={20} strokeWidth={3} /> Add <span className="hidden sm:inline">Stock</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-900 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b-4 border-slate-900">
              <tr>
                <th className="p-6">Material Details</th>
                <th className="p-6">Provider</th>
                <th className="p-6">Unit Valuation</th>
                <th className="p-6">Available Qty</th>
                <th className="p-6">Inventory Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {filteredInventory.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition group">
                    <td className="p-6 font-black text-slate-900 uppercase tracking-tighter text-sm">{item.name}</td>
                    <td className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.supplier}</td>
                    <td className="p-6">
                      <span className="text-xs font-black text-slate-900">{currentTenant?.currency}{item.pricePerUnit}</span>
                      <span className="text-[8px] font-bold text-slate-400 ml-1">/{item.unit}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border-2 border-red-100 animate-pulse">
                          <AlertTriangle size={12} strokeWidth={3} /> Critical
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border-2 border-emerald-100">Optimal</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => updateInventory(item.id, 5)} className="p-3 bg-white text-emerald-500 border-2 border-transparent hover:border-emerald-100 rounded-xl transition shadow-sm active:scale-95" title="Restock (+5)"><RefreshCw size={18} strokeWidth={3} /></button>
                        <button onClick={() => openEditModal(item)} className="p-3 bg-white text-indigo-500 border-2 border-transparent hover:border-indigo-100 rounded-xl transition shadow-sm active:scale-95" title="Edit Profile"><Edit2 size={18} strokeWidth={3} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border-[6px] border-white animate-in zoom-in-95 duration-200">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingItem ? 'Edit Material' : 'New Entry'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory data point</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 text-slate-400 hover:text-red-500 transition"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Label</label>
                     <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold uppercase text-xs focus:bg-white shadow-inner" placeholder="e.g. Flour" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Entity</label>
                     <input type="text" required value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold uppercase text-xs focus:bg-white shadow-inner" placeholder="Wholesaler name" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Qty</label>
                     <input type="number" required min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black text-sm focus:bg-white shadow-inner" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement Unit</label>
                     <input type="text" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black uppercase text-xs focus:bg-white shadow-inner" placeholder="kg, pcs, L" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Valuation</label>
                     <input type="number" required min="0" step="0.01" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black text-sm focus:bg-white shadow-inner" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warning Threshold</label>
                     <input type="number" required min="0" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black text-sm focus:bg-white shadow-inner" />
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition">Cancel</button>
                   <button type="submit" className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] border-4 border-white shadow-xl hover:bg-black transition flex items-center justify-center gap-3">
                     <Save size={20} strokeWidth={3} /> Commit Profile
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
