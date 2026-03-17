import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { Plus, Edit2, Trash2, X, Save, Utensils, Sparkles, Search, ImageOff, ListTree } from 'lucide-react';
import { generateMenuDescription } from '../services/geminiService';

export const MenuManagement = () => {
  const { menu, business, addMenuItem, updateMenuItem, deleteMenuItem, addMenuCategory, renameMenuCategory, deleteMenuCategory } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Category Management state
  const [newCategoryName, setNewCategoryName] = useState('');

  // Item Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    image: '',
    isAvailable: true
  });

  const categories = useMemo(() => business.menuCategories || [], [business.menuCategories]);

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: 0,
      category: categories[0] || '',
      image: '',
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image || '',
      isAvailable: item.isAvailable
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, formData);
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        ...formData
      };
      addMenuItem(newItem);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItem(id);
    }
  };

  // Category Management Logic
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert("Category already exists.");
      return;
    }
    addMenuCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleRenameCategory = (oldName: string) => {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      renameMenuCategory(oldName, newName.trim());
    }
  };

  const handleDeleteCategory = (catName: string) => {
    if (window.confirm(`Delete category "${catName}"? This will move all associated items to "Uncategorized".`)) {
      deleteMenuCategory(catName);
    }
  };

  const handleMagicDescribe = async () => {
    if (!formData.name || !formData.category) {
      alert("Please enter Name and Category first.");
      return;
    }
    setIsGenerating(true);
    const desc = await generateMenuDescription(formData.name, formData.category);
    alert(`Gemini Suggests:\n\n"${desc}"`);
    setIsGenerating(false);
  };

  return (
    <div className="p-6 bg-[#fcfcfc] min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
            <Utensils className="text-indigo-600" size={32} /> MENU MANAGEMENT
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Kitchen Inventory & Offerings</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
             <Search size={18} className="absolute top-3.5 left-3 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search items..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
             />
          </div>
          <button 
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition border-2 border-gray-100 flex items-center gap-2"
          >
            <ListTree size={18} /> Categories
          </button>
          <button 
            type="button"
            onClick={openAddModal}
            className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition transform active:scale-95 flex items-center gap-3 border-4 border-white shrink-0"
          >
            <Plus size={20} strokeWidth={3} /> Add Item
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {categories.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
             <Utensils size={64} className="mx-auto text-gray-100 mb-4" />
             <p className="text-gray-300 font-black uppercase tracking-widest">Your menu is empty</p>
           </div>
        ) : categories.map(cat => {
          const itemsInCat = filteredMenu.filter(m => m.category === cat);
          if (itemsInCat.length === 0) return null;
          
          return (
            <div key={cat} className="space-y-6">
              <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{cat}</h2>
                 <div className="h-1 flex-1 bg-slate-900 rounded-full opacity-5"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border-2 border-slate-50 px-3 py-1 rounded-full">{itemsInCat.length} Items</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
                {itemsInCat.map(item => (
                  <div key={item.id} className="group bg-white rounded-[2.5rem] border-2 border-slate-100 p-4 shadow-sm hover:shadow-2xl hover:border-slate-900 transition-all duration-300 flex flex-col relative overflow-hidden">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-[2rem] bg-slate-50 flex items-center justify-center border-2 border-transparent group-hover:border-slate-100 transition-all">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Utensils size={40} className="text-slate-200" />
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                           <span className="text-white text-[10px] font-black uppercase tracking-widest border-2 border-white px-3 py-1 rounded-full">Unavailable</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm line-clamp-1 mb-1">{item.name}</h3>
                      <p className="text-indigo-600 font-black text-base">{business.currency}{item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                      <button 
                         type="button"
                         onClick={() => openEditModal(item)}
                         className="flex-1 py-3 bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl transition flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} strokeWidth={3} />
                      </button>
                      <button 
                         type="button"
                         onClick={(e) => handleDeleteItem(item.id, e)}
                         className="flex-1 py-3 bg-slate-50 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border-[6px] border-white">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingItem ? 'Edit Item' : 'New Creation'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flavor profile data</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 text-slate-400 hover:text-red-500 transition active:scale-90"><X size={24}/></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Item Name</label>
                     <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-black uppercase text-sm transition-all"
                        placeholder="e.g. SPICY RAMEN"
                     />
                  </div>
                  
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Price</label>
                     <div className="relative">
                        <span className="absolute left-4 top-4 font-black text-indigo-600">{business.currency}</span>
                        <input 
                            type="number" 
                            required
                            step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-black text-sm transition-all"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Category</label>
                     <select 
                        required
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-black uppercase text-sm transition-all"
                     >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        {!categories.length && <option value="Uncategorized">Uncategorized</option>}
                     </select>
                  </div>

                  <div className="col-span-2">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Image URL (Optional)</label>
                     <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                           {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageOff size={24} className="text-slate-200" />}
                        </div>
                        <input 
                            type="text" 
                            value={formData.image}
                            onChange={e => setFormData({...formData, image: e.target.value})}
                            className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none text-xs font-bold transition-all"
                            placeholder="https://images..."
                        />
                     </div>
                  </div>

                  <div className="col-span-2">
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${formData.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Available to Order</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                             type="checkbox" 
                             className="sr-only peer"
                             checked={formData.isAvailable}
                             onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                          />
                          <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                     </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button 
                      type="button"
                      onClick={handleMagicDescribe}
                      disabled={isGenerating}
                      className="flex-1 py-5 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-100 transition disabled:opacity-50"
                   >
                     <Sparkles size={20} /> {isGenerating ? 'Drafting...' : 'AI Describe'}
                   </button>
                   <button 
                      type="submit"
                      className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-black shadow-2xl transition transform active:scale-95"
                   >
                     <Save size={20} strokeWidth={3} /> {editingItem ? 'Update Menu' : 'Confirm Item'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-[6px] border-white animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Category Manager</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global menu structure</p>
                </div>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
             </div>
             
             <div className="p-8 space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Add New Category</label>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         value={newCategoryName}
                         onChange={e => setNewCategoryName(e.target.value)}
                         className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none font-black uppercase text-sm transition-all"
                         placeholder="e.g. DESSERTS"
                      />
                      <button 
                        type="button"
                        onClick={handleAddCategory}
                        className="bg-slate-900 text-white px-6 rounded-2xl font-black uppercase text-xs"
                      >
                         <Plus size={20} />
                      </button>
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Active Categories</label>
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                      {categories.map(cat => (
                         <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 group">
                            <span className="font-black text-slate-900 uppercase text-xs">{cat}</span>
                            <div className="flex gap-2">
                               <button 
                                 type="button"
                                 onClick={() => handleRenameCategory(cat)}
                                 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                 title="Rename"
                               >
                                  <Edit2 size={16} />
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => handleDeleteCategory(cat)}
                                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                 title="Delete"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      ))}
                      {categories.length === 0 && <p className="text-center text-xs text-slate-400 font-bold py-4">No categories defined yet.</p>}
                   </div>
                </div>
             </div>
             <div className="p-8 bg-slate-50 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
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