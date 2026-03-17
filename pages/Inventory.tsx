
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, RefreshCw, Plus, Edit2, X, Save, Search, ChevronRight, CheckCircle } from 'lucide-react';

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
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
             <Package className="text-amber-500" size={32} /> Inventory Manager
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Track stock levels, suppliers and replenishment</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={openAddModal}
             className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
           >
             <Plus size={16} /> Add Stock
           </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="mb-10 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search materials or suppliers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm flex-1 md:flex-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Low Stock Items</p>
            <p className="text-xl font-bold text-red-500">{inventory.filter(i => i.quantity <= i.minThreshold).length}</p>
          </div>
          <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm flex-1 md:flex-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Materials</p>
            <p className="text-xl font-bold text-slate-900">{inventory.length}</p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Material Name</th>
                <th className="px-8 py-5">Supplier</th>
                <th className="px-8 py-5">Unit Price</th>
                <th className="px-8 py-5">Current Stock</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInventory.map(item => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">#{item.id.slice(-4)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-600">{item.supplier}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-900">{currentTenant?.currency}{item.pricePerUnit.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1">/{item.unit}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-base font-bold ${isLow ? 'text-red-500' : 'text-slate-900'}`}>{item.quantity}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isLow ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
                          <AlertTriangle size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Low Stock</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                          <CheckCircle size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Healthy</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 shadow-sm border border-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => updateInventory(item.id, item.quantity + 1)}
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 shadow-sm border border-slate-100"
                          title="Quick Restock +1"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{editingItem ? 'Edit Stock Item' : 'New Stock Item'}</h2>
                  <p className="text-slate-400 text-sm mt-1">Update your material inventory</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Material Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="e.g. Basmati Rice"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Supplier</label>
                    <input 
                      type="text" 
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="e.g. Metro Wholesale"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="ltr">Liters (ltr)</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="box">Boxes (box)</option>
                      <option value="pkt">Packets (pkt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Price per Unit</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Quantity</label>
                    <input 
                      type="number" 
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Min Threshold (Alert)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: parseFloat(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Save size={16} />
                    {editingItem ? 'Update Stock' : 'Create Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
