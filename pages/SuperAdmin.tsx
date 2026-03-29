
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Business, Role, BillStatus } from '../types';
import { Plus, Building2, User, Mail, Phone, Globe, MapPin, Search, ExternalLink, Calendar, Power, PowerOff, Edit3, Save, X as CloseIcon, AlertTriangle, Copy, Check, Wallet, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuperAdmin = () => {
  const { tenants, createBusiness, currentUser, toggleBusinessStatus, updateTenant, deleteTenant, allUsers, updateUser, currentTenant, monthlyBills, expenses, addExpense, deleteExpense, setCurrentTenantId, logout } = useApp();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    setCurrentTenantId(null);
  }, [setCurrentTenantId]);
  const [showModal, setShowModal] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Business | null>(null);
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Other');
  const [expenseNote, setExpenseNote] = useState('');

  const superAdminCategories = ['Server', 'Marketing', 'Legal', 'Salaries', 'Other'];
  const CURRENCIES = ['৳', '$', '€', '£', '₹', '₨', 'AED', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD'];

  const platformExpenses = useMemo(() => {
    return expenses.filter(e => e.tenantId === 'SUPER_ADMIN');
  }, [expenses]);

  const copyLink = (id: string) => {
    const link = `https://restokeep.vercel.app/#/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const [newBusiness, setNewBusiness] = useState<Partial<Business>>({
    id: '',
    name: '',
    address: '',
    phone: '',
    currency: '৳',
    themeColor: '#0f172a',
    monthlyBill: 500,
    logo: '',
    vatRate: 0,
    includeVat: false,
    timezone: 'UTC',
    customerTokenPrefix: 'ORD',
    customerAppEnabled: true,
  });

  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    password: '',
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingTenant) {
      await updateTenant(editingTenant.id, newBusiness);
      const owner = allUsers.find(u => String(u.tenantId || '01') === String(editingTenant.id) && u.role === Role.OWNER);
      if (owner) {
        await updateUser(owner.id, newOwner);
      }
      resetForm();
      return;
    }

    // Check for global email uniqueness
    const isDuplicate = allUsers.some(u => u.email.toLowerCase() === newOwner.email.toLowerCase());
    if (isDuplicate) {
      setError('This email is already registered in the system.');
      return;
    }

    // Check for tenant ID uniqueness if provided
    if (newBusiness.id) {
      const isTenantIdDuplicate = tenants.some(t => t.id.toLowerCase() === newBusiness.id.toLowerCase());
      if (isTenantIdDuplicate) {
        setError('This Tenant ID (slug) is already in use.');
        return;
      }
    }

    await createBusiness(newBusiness, newOwner, duplicateSourceId || undefined);

    resetForm();
  };

  const handleDuplicateTenant = (tenant: Business) => {
    setDuplicateSourceId(tenant.id);
    setEditingTenant(null);
    setNewBusiness({
      ...tenant,
      id: '',
      name: `${tenant.name} (Copy)`,
    });
    setNewOwner({ name: '', email: '', password: '', mobile: '' });
    setShowModal(true);
  };

  const handleEditTenant = (tenant: Business) => {
    setEditingTenant(tenant);
    setNewBusiness({ ...tenant });
    
    const owner = allUsers.find(u => String(u.tenantId || '01') === String(tenant.id) && u.role === Role.OWNER);
    if (owner) {
      setNewOwner({
        name: owner.name,
        email: owner.email,
        password: owner.password || '',
        mobile: owner.mobile || ''
      });
    } else {
      setNewOwner({ name: '', email: '', password: '', mobile: '' });
    }
    
    setShowModal(true);
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this business? This will delete all associated data and cannot be undone.')) {
      deleteTenant(tenantId);
    }
  };

  const handleEditBill = (tenant: Business) => {
    setEditingBill(tenant.id);
    setBillAmount(tenant.monthlyBill);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newExpense = {
      id: `exp-sa-${Date.now()}`,
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: new Date().toISOString(),
      note: expenseNote,
      recordedBy: currentUser.id,
      tenantId: 'SUPER_ADMIN'
    };

    addExpense(newExpense);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('Other');
    setExpenseNote('');
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  const saveBill = (tenantId: string) => {
    updateTenant(tenantId, { monthlyBill: billAmount });
    setEditingBill(null);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTenant(null);
    setDuplicateSourceId(null);
    setNewBusiness({ id: '', name: '', address: '', phone: '', currency: '৳', themeColor: '#0f172a', monthlyBill: 500, logo: '', vatRate: 0, includeVat: false, timezone: 'UTC', customerTokenPrefix: 'ORD', customerAppEnabled: true });
    setNewOwner({ name: '', email: '', password: '', mobile: '' });
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portal Administration</h1>
          <p className="text-slate-500">Manage all restaurant businesses and billing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <Wallet size={20} />
            Record Expense
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Add New Restaurant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Restaurants</p>
          <h3 className="text-3xl font-bold text-slate-900">{tenants.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Active</p>
          <h3 className="text-3xl font-bold text-emerald-600">{tenants.filter(t => t.isActive).length}</h3>
        </div>
        <div 
          onClick={() => navigate('/platform-expenses')}
          className="bg-white p-6 rounded-2xl border-2 border-rose-500 shadow-lg shadow-rose-100 transition-all hover:scale-105 cursor-pointer"
        >
          <p className="text-slate-500 text-sm font-medium mb-1">Platform Expenses</p>
          <h3 className="text-3xl font-bold text-red-600">
            {currentTenant?.currency || '৳'}{platformExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Monthly Revenue (Approved)</p>
          <h3 className="text-3xl font-bold text-indigo-600">
            {currentTenant?.currency || '৳'}{monthlyBills
              .filter(b => {
                const now = new Date();
                const currentMonth = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
                return b.status === BillStatus.APPROVED && b.month === currentMonth;
              })
              .reduce((sum, b) => sum + b.amount, 0)}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-100 transition-all hover:scale-105">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue (All Time)</p>
          <h3 className="text-3xl font-bold text-emerald-600">
            {currentTenant?.currency || '৳'}{monthlyBills
              .filter(b => b.status === BillStatus.APPROVED)
              .reduce((sum, b) => sum + b.amount, 0)}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
                    <th className="px-6 py-4 font-semibold">Tenant Link</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Monthly Bill</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`hover:bg-slate-50/50 transition ${!tenant.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                            {tenant.logo ? (
                              <img src={tenant.logo} className="w-full h-full object-cover" alt="Logo" />
                            ) : (
                              <Building2 size={20} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{tenant.name}</p>
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
                              ID: {tenant.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                              restokeep.vercel.app/#/{tenant.id}
                            </code>
                            <button 
                              onClick={() => copyLink(tenant.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Copy Link"
                            >
                              {copiedId === tenant.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                            <a 
                              href={`https://restokeep.vercel.app/#/${tenant.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Open Link"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone size={12} />
                            <span className="text-xs font-medium">{tenant.phone || 'No Phone'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin size={12} />
                            <span className="text-[10px] truncate max-w-[150px]">{tenant.address || 'No Address'}</span>
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
                            <span className="font-bold text-slate-700">{currentTenant?.currency || '৳'}{tenant.monthlyBill}</span>
                            <button 
                              onClick={() => handleEditBill(tenant)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDuplicateTenant(tenant)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition"
                            title="Duplicate Business"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditTenant(tenant)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition"
                            title="Edit Business"
                          >
                            <Edit3 size={18} />
                          </button>
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
                          <button 
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition"
                            title="Delete Business"
                          >
                            <AlertTriangle size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/${tenant.id}/dashboard`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition" 
                            title="View Dashboard"
                          >
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
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-rose-500 shadow-xl overflow-hidden shadow-rose-100">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Wallet size={20} className="text-rose-500" /> Platform Expenses
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {platformExpenses.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm font-medium italic">No platform expenses recorded.</p>
              ) : (
                platformExpenses.map(exp => (
                  <div key={exp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-rose-200 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-900 text-sm">{exp.title}</p>
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{exp.category}</span>
                      <span className="font-bold text-rose-600">-{currentTenant?.currency || '৳'}{exp.amount}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-0 md:border-2 border-indigo-500 shadow-indigo-100 min-h-screen md:min-h-0 flex flex-col">
            <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                {editingTenant ? `Edit ${editingTenant.name}` : duplicateSourceId ? 'Duplicate Restaurant' : 'Register New Restaurant'}
              </h2>
              <button 
                onClick={resetForm} 
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreate} className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Building2 size={16} /> Business Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!editingTenant && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Slug (URL Name) - Manual Input</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="e.g. my-restaurant"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none pl-12 transition-all font-bold text-sm"
                            value={newBusiness.id || ''}
                            onChange={(e) => setNewBusiness({...newBusiness, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs"># /</div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Leave empty for auto-generated ID</p>
                      </div>
                    )}
                    
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Restaurant Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.name || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Logo URL</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.logo || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, logo: e.target.value})}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Address</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.address || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Phone</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.phone || ''}
                        onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Currency</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                        value={newBusiness.currency || '৳'}
                        onChange={(e) => setNewBusiness({...newBusiness, currency: e.target.value})}
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">VAT Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.vatRate || 0}
                        onChange={(e) => setNewBusiness({...newBusiness, vatRate: Number(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input 
                        type="checkbox" 
                        id="includeVat"
                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        checked={newBusiness.includeVat || false}
                        onChange={(e) => setNewBusiness({...newBusiness, includeVat: e.target.checked})}
                      />
                      <label htmlFor="includeVat" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">Include VAT in Price</label>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Timezone</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
                        value={newBusiness.timezone || 'UTC'}
                        onChange={(e) => setNewBusiness({...newBusiness, timezone: e.target.value})}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dhaka">Asia/Dhaka</option>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Theme Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          className="w-12 h-11 p-1 rounded-xl border-2 border-slate-100 cursor-pointer"
                          value={newBusiness.themeColor || '#0f172a'}
                          onChange={(e) => setNewBusiness({...newBusiness, themeColor: e.target.value})}
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm uppercase"
                          value={newBusiness.themeColor || '#0f172a'}
                          onChange={(e) => setNewBusiness({...newBusiness, themeColor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Token Prefix</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm uppercase"
                        value={newBusiness.customerTokenPrefix || 'ORD'}
                        onChange={(e) => setNewBusiness({...newBusiness, customerTokenPrefix: e.target.value.toUpperCase()})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Monthly Bill</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newBusiness.monthlyBill || 500}
                        onChange={(e) => setNewBusiness({...newBusiness, monthlyBill: Number(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" 
                        id="customerAppEnabled"
                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        checked={newBusiness.customerAppEnabled ?? true}
                        onChange={(e) => setNewBusiness({...newBusiness, customerAppEnabled: e.target.checked})}
                      />
                      <label htmlFor="customerAppEnabled" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer">Customer App Enabled</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User size={16} /> {editingTenant ? 'Owner Account' : 'Initial Owner Account'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Owner Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.name || ''}
                        onChange={(e) => setNewOwner({...newOwner, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Email Address</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.email || ''}
                        onChange={(e) => setNewOwner({...newOwner, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Mobile</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.mobile || ''}
                        onChange={(e) => setNewOwner({...newOwner, mobile: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1 tracking-wider">Password</label>
                      <input 
                        required
                        type="password" 
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        value={newOwner.password || ''}
                        onChange={(e) => setNewOwner({...newOwner, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 mt-8">
                    <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Note</h4>
                    <p className="text-[10px] font-bold text-indigo-900 leading-relaxed">
                      {editingTenant 
                        ? "Editing owner details here will update the primary owner account for this restaurant. Be careful with email/password changes."
                        : "This account will be created as the primary owner for the new restaurant with full administrative permissions."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pb-2">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-100 transition-all border-2 border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 border-2 border-indigo-600"
                >
                  {editingTenant ? 'Save Business Changes' : duplicateSourceId ? 'Duplicate Business' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border-2 border-rose-500 shadow-rose-100">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Record Platform Expense</h2>
                <p className="text-slate-400 text-sm mt-1">Log a new operational cost for the platform</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-all">
                <CloseIcon size={24} />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-8 space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Expense Title</label>
                  <input 
                    type="text" 
                    required
                    value={expenseTitle}
                    onChange={e => setExpenseTitle(e.target.value)}
                    placeholder="e.g. Server Hosting"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currentTenant?.currency || '৳'}</span>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <div className="relative">
                      <select 
                        value={expenseCategory}
                        onChange={e => setExpenseCategory(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      >
                        {superAdminCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Note (Optional)</label>
                  <textarea 
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    placeholder="Add any additional details..."
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 rounded-2xl font-bold text-white uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save size={16} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
