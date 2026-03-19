
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Business, Role } from '../types';
import { Plus, Building2, User, Mail, Phone, Globe, MapPin, Search, ExternalLink, Calendar, Power, PowerOff, DollarSign, Edit3, Save, X as CloseIcon, AlertTriangle, Copy, Check } from 'lucide-react';

export const SuperAdmin = () => {
  const { tenants, createBusiness, currentUser, toggleBusinessStatus, updateTenant, allUsers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/#/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    address: '',
    phone: '',
    currency: '৳',
    themeColor: '#0f172a',
    monthlyBill: 500,
    billingDay: 1
  });

  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    password: 'password',
    mobile: ''
  });

  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check for global email uniqueness
    const isDuplicate = allUsers.some(u => u.email.toLowerCase() === newOwner.email.toLowerCase());
    if (isDuplicate) {
      setError('This email is already registered in the system.');
      return;
    }

    createBusiness(newBusiness, newOwner);
    setShowModal(false);
    setNewBusiness({ name: '', address: '', phone: '', currency: '৳', themeColor: '#0f172a', monthlyBill: 500, billingDay: 1 });
    setNewOwner({ name: '', email: '', password: 'password', mobile: '' });
  };

  const handleEditBill = (tenant: Business) => {
    setEditingBill(tenant.id);
    setBillAmount(tenant.monthlyBill);
  };

  const saveBill = (tenantId: string) => {
    updateTenant(tenantId, { monthlyBill: billAmount });
    setEditingBill(null);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portal Administration</h1>
          <p className="text-slate-500">Manage all restaurant businesses and billing</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Add New Restaurant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Restaurants</p>
          <h3 className="text-3xl font-bold text-slate-900">{tenants.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Active</p>
          <h3 className="text-3xl font-bold text-emerald-600">{tenants.filter(t => t.isActive).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-500 shadow-lg shadow-rose-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Deactivated</p>
          <h3 className="text-3xl font-bold text-red-600">{tenants.filter(t => !t.isActive).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Monthly Revenue</p>
          <h3 className="text-3xl font-bold text-indigo-600">
            ৳{tenants.filter(t => t.isActive).reduce((sum, t) => sum + t.monthlyBill, 0)}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-xl overflow-hidden shadow-indigo-100">
        <div className="p-4 border-b border-indigo-100 bg-slate-50/50 flex items-center gap-3 group">
          <Search size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search restaurants by name or address..."
            className="bg-transparent border-none focus:ring-0 flex-1 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Restaurant</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Monthly Bill</th>
                <th className="px-6 py-4 font-semibold">Billing Day</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className={`hover:bg-slate-50/50 transition ${!tenant.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={tenant.logo} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900">{tenant.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                            ID: {tenant.id}
                          </p>
                          <button 
                            onClick={() => copyLink(tenant.id)}
                            className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition uppercase tracking-widest"
                          >
                            {copiedId === tenant.id ? <Check size={10} /> : <Copy size={10} />}
                            {copiedId === tenant.id ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      tenant.isActive 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingBill === tenant.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={billAmount}
                          onChange={(e) => setBillAmount(Number(e.target.value))}
                        />
                        <button onClick={() => saveBill(tenant.id)} className="text-emerald-600 hover:text-emerald-700">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingBill(null)} className="text-slate-400 hover:text-slate-600">
                          <CloseIcon size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-bold text-slate-700">৳{tenant.monthlyBill}</span>
                        <button 
                          onClick={() => handleEditBill(tenant)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    Day {tenant.billingDay}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleBusinessStatus(tenant.id)}
                        className={`p-2 rounded-lg transition ${
                          tenant.isActive 
                            ? 'text-red-500 hover:bg-red-50' 
                            : 'text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={tenant.isActive ? 'Deactivate Restaurant' : 'Activate Restaurant'}
                      >
                        {tenant.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition" title="View Dashboard">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-indigo-500 shadow-indigo-100">
            <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                Register New Restaurant
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={16} /> Business Details
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBusiness.name}
                      onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newBusiness.address}
                      onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newBusiness.phone}
                        onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newBusiness.currency}
                        onChange={(e) => setNewBusiness({...newBusiness, currency: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Bill (৳)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newBusiness.monthlyBill}
                        onChange={(e) => setNewBusiness({...newBusiness, monthlyBill: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Billing Day</label>
                      <input 
                        type="number" 
                        min="1"
                        max="31"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newBusiness.billingDay}
                        onChange={(e) => setNewBusiness({...newBusiness, billingDay: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={16} /> Owner Account
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newOwner.name}
                      onChange={(e) => setNewOwner({...newOwner, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner({...newOwner, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newOwner.mobile}
                      onChange={(e) => setNewOwner({...newOwner, mobile: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input 
                      required
                      type="password" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newOwner.password}
                      onChange={(e) => setNewOwner({...newOwner, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                  Create Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
