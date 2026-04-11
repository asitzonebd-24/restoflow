
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { UserPlus, Users as UsersIcon, Shield, Trash2, Mail, Phone, Lock, CheckSquare, Square, Edit2, X, ChevronRight, Search, AlertTriangle, User as UserCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';

const AVAILABLE_MODULES = ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings'];

export const Users = () => {
    const { users, allUsers, currentTenant, addUser, updateUser, deleteUser, currentUser } = useApp();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: Role.WAITER,
        permissions: [] as string[],
        assignedCategories: [] as string[]
    });

    const resetForm = () => {
        setFormData({ 
            name: '', 
            email: '', 
            password: '', 
            mobile: '', 
            role: Role.WAITER, 
            permissions: ['POS'],
            assignedCategories: []
        });
        setEditingUserId(null);
        setError(null);
    };

    const handleEditClick = (user: User) => {
        setError(null);
        setFormData({
            name: user.name,
            email: user.email,
            password: user.password || '',
            mobile: user.mobile,
            role: user.role,
            permissions: user.permissions || [],
            assignedCategories: user.assignedCategories || []
        });
        setEditingUserId(user.id);
        setIsFormOpen(true);
    };

    const togglePermission = (moduleName: string) => {
        setFormData(prev => {
            if (prev.permissions.includes(moduleName)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== moduleName) };
            } else {
                return { ...prev, permissions: [...prev.permissions, moduleName] };
            }
        });
    };

    const handleRoleChange = (role: Role) => {
        let perms: string[] = [];
        switch(role) {
            case Role.SUPER_ADMIN: perms = AVAILABLE_MODULES; break;
            case Role.OWNER: perms = AVAILABLE_MODULES; break;
            case Role.MANAGER: perms = ['Dashboard', 'POS', 'Kitchen', 'Menu', 'Billing', 'Transactions', 'Expenses', 'Reports', 'Inventory', 'Users', 'Settings']; break;
            case Role.WAITER: perms = ['POS']; break;
            case Role.KITCHEN: perms = ['Kitchen']; break;
            case Role.CASHIER: perms = ['Billing', 'Transactions', 'Reports']; break;
            case Role.INVENTORY_MANAGER: perms = ['Inventory']; break;
            case Role.DELIVERY: perms = []; break;
            default: perms = [];
        }
        setFormData(prev => ({ 
            ...prev, 
            role, 
            permissions: perms,
            assignedCategories: role === Role.KITCHEN ? prev.assignedCategories : []
        }));
    };

    const toggleCategory = (category: string) => {
        setFormData(prev => {
            const current = prev.assignedCategories || [];
            if (current.includes(category)) {
                return { ...prev, assignedCategories: current.filter(c => c !== category) };
            } else {
                return { ...prev, assignedCategories: [...current, category] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant) return;
        setError(null);

        // Check for duplicate email globally
        const isDuplicate = allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUserId);
        if (isDuplicate) {
            setError('This email is already registered in the system.');
            return;
        }

        if (editingUserId) {
            updateUser(editingUserId, {
                ...formData,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            });
        } else {
            const newUser: User = {
                id: `u-${Date.now()}`,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                mobile: formData.mobile,
                role: formData.role,
                permissions: formData.permissions,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
            };
            addUser(newUser);
        }

        resetForm();
        setIsFormOpen(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            deleteUser(id);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full space-y-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        <UsersIcon className="text-indigo-600" size={36} /> Team Roster
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Access control & Staffing</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-500 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-black text-[10px] uppercase transition-all shadow-lg shadow-indigo-100"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => {
                            resetForm();
                            setIsFormOpen(true);
                            handleRoleChange(Role.WAITER);
                        }}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition border-2 border-indigo-400 flex items-center justify-center gap-3 shadow-indigo-200"
                    >
                        <UserPlus size={20} strokeWidth={3} /> Add <span className="hidden sm:inline">Member</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                            onClick={() => setIsFormOpen(false)}
                        ></motion.div>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-4xl md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl border-2 border-indigo-500 overflow-hidden shadow-indigo-100 self-end md:self-center max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 md:p-10 overflow-y-auto no-scrollbar flex-1">
                                <div className="flex justify-between items-center mb-8 shrink-0">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingUserId ? 'Modify Profile' : 'New Enrollment'}</h3>
                                    <button onClick={() => setIsFormOpen(false)} className="bg-slate-50 p-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                                        <AlertTriangle size={20} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                                            <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold uppercase text-xs focus:bg-white shadow-inner" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Access</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                <input type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="staff@dine.com" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                <input type="tel" required value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="+1..." />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Passkey</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                <input type="password" required minLength={6} value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-bold text-xs focus:bg-white shadow-inner" placeholder="••••••••" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Position / Role</label>
                                            <div className="relative">
                                                <select value={formData.role} onChange={e => handleRoleChange(e.target.value as Role)} className="w-full p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl outline-none font-black uppercase text-[10px] appearance-none focus:bg-white shadow-inner">
                                                    {Object.values(Role).filter(role => {
                                                        if (role === Role.SUPER_ADMIN) {
                                                            return currentUser?.role === Role.SUPER_ADMIN;
                                                        }
                                                        return true;
                                                    }).map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-900 pointer-events-none" size={16} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Permissions Override</label>
                                        <div className="flex flex-wrap gap-2 md:gap-3">
                                            {AVAILABLE_MODULES.map(module => (
                                                <button
                                                    type="button"
                                                    key={module}
                                                    onClick={() => togglePermission(module)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${formData.permissions.includes(module) 
                                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-900'}`}
                                                >
                                                    {formData.permissions.includes(module) ? <CheckSquare size={14} /> : <Square size={14} />}
                                                    {module}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.role === Role.KITCHEN && currentTenant?.menuCategories && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assigned Kitchen Categories</label>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1 mb-2">Staff will only see items from selected categories</p>
                                            <div className="flex flex-wrap gap-2 md:gap-3">
                                                {currentTenant.menuCategories.map(category => (
                                                    <button
                                                        type="button"
                                                        key={category}
                                                        onClick={() => toggleCategory(category)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                                                            ${(formData.assignedCategories || []).includes(category) 
                                                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg' 
                                                                : 'bg-white border-slate-100 text-slate-400 hover:border-orange-500'}`}
                                                    >
                                                        {(formData.assignedCategories || []).includes(category) ? <CheckSquare size={14} /> : <Square size={14} />}
                                                        {category}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-dashed border-slate-100 shrink-0">
                                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition">Cancel</button>
                                        <button type="submit" className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] border-4 border-white shadow-xl hover:bg-black transition">
                                            {editingUserId ? 'Update Profile' : 'Confirm Enrollment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-indigo-500 overflow-hidden shadow-indigo-100">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px] border-2 border-black">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b-2 border-black">
                            <tr>
                                <th className="p-6 border-r border-black">Staff Details</th>
                                <th className="p-6 border-r border-black">Position</th>
                                <th className="p-6 border-r border-black">Module Access</th>
                                <th className="p-6 border-r border-black">Contact info</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                            {paginatedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition group border-b border-black">
                                    <td className="p-6 border-r border-black">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCircle size={24} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 uppercase tracking-tighter text-sm">{user.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 border-r border-black">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2
                                            ${user.role === Role.SUPER_ADMIN ? 'bg-rose-50 border-rose-200 text-rose-600' : 
                                              user.role === Role.OWNER ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 
                                              user.role === Role.MANAGER ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                                              'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Shield size={10} /> {user.role}
                                        </span>
                                    </td>
                                    <td className="p-6 border-r border-black">
                                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                                            {(user.permissions || []).map(p => (
                                                <span key={p} className="text-[8px] px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-400 font-black uppercase tracking-tighter">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                        {user.role === Role.KITCHEN && user.assignedCategories && user.assignedCategories.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1 max-w-[240px]">
                                                {user.assignedCategories.map(c => (
                                                    <span key={c} className="text-[8px] px-1.5 py-0.5 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 font-black uppercase tracking-tighter">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6 border-r border-black">
                                        <span className="text-[10px] font-black text-slate-900 tracking-widest">{user.mobile}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        {user.role !== Role.OWNER && user.role !== Role.SUPER_ADMIN && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(user)} className="p-3 text-slate-300 hover:text-indigo-600 bg-white border-2 border-transparent hover:border-indigo-100 rounded-xl transition shadow-sm"><Edit2 size={18} strokeWidth={3}/></button>
                                                <button onClick={(e) => handleDelete(user.id, e)} className="p-3 text-slate-300 hover:text-red-600 bg-white border-2 border-transparent hover:border-red-100 rounded-xl transition shadow-sm"><Trash2 size={18} strokeWidth={3}/></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-black">
                    {paginatedUsers.map(user => (
                        <div key={user.id} className="p-6 hover:bg-slate-50 transition group border-b border-black last:border-b-0">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle size={24} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 uppercase tracking-tighter text-sm">{user.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</div>
                                    </div>
                                </div>
                                {user.role !== Role.OWNER && user.role !== Role.SUPER_ADMIN && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(user)} className="p-2 text-slate-300 hover:text-indigo-600 bg-white border border-slate-100 rounded-lg transition shadow-sm"><Edit2 size={14} strokeWidth={3}/></button>
                                        <button onClick={(e) => handleDelete(user.id, e)} className="p-2 text-slate-300 hover:text-red-600 bg-white border border-slate-100 rounded-lg transition shadow-sm"><Trash2 size={14} strokeWidth={3}/></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</span>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2
                                        ${user.role === Role.SUPER_ADMIN ? 'bg-rose-50 border-rose-200 text-rose-600' : 
                                          user.role === Role.OWNER ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 
                                          user.role === Role.MANAGER ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                                          'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <Shield size={10} /> {user.role}
                                    </span>
                                </div>

                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Access</span>
                                    <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                                        {(user.permissions || []).map(p => (
                                            <span key={p} className="text-[8px] px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-400 font-black uppercase tracking-tighter">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</span>
                                    <span className="text-[10px] font-black text-slate-900 tracking-widest">{user.mobile}</span>
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
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );
};
