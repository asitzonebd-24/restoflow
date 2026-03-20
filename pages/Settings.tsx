
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Store, Globe, Percent, Upload, Image as ImageIcon } from 'lucide-react';

export const Settings = () => {
    const { business, updateBusiness } = useApp();
    
    // Local state for form
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [currency, setCurrency] = useState('');
    const [logo, setLogo] = useState('');
    const [themeColor, setThemeColor] = useState('#000000');
    const [vatRate, setVatRate] = useState(0);
    const [includeVat, setIncludeVat] = useState(false);
    const [customerAppEnabled, setCustomerAppEnabled] = useState(true);
    const [customerTokenPrefix, setCustomerTokenPrefix] = useState('ORD');
    const [nextCustomerToken, setNextCustomerToken] = useState(1);

    // Load tenant data into form on mount
    useEffect(() => {
        if (business) {
            setName(business.name);
            setAddress(business.address);
            setPhone(business.phone || '');
            setCurrency(business.currency);
            setLogo(business.logo);
            setThemeColor(business.themeColor);
            setVatRate(business.vatRate);
            setIncludeVat(business.includeVat);
            setCustomerAppEnabled(business.customerAppEnabled ?? true);
            setCustomerTokenPrefix(business.customerTokenPrefix || 'ORD');
            setNextCustomerToken(business.nextCustomerToken || 1);
        }
    }, [business]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (business) {
            updateBusiness({
                name,
                address,
                phone,
                currency,
                logo,
                themeColor,
                vatRate,
                includeVat,
                customerAppEnabled,
                customerTokenPrefix,
                nextCustomerToken
            });
            alert('Settings saved successfully!');
        }
    };

    if (!business) return null;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-[#f8fafc] min-h-full font-sans">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">System preferences and business profile</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl shadow-indigo-100 hover:bg-slate-800 transition-all uppercase tracking-widest border-2 border-indigo-500"
                    >
                        <Save size={16} />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-12">
                {/* Profile Section */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                            <Store size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Restaurant Profile</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 mb-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center group-hover:border-indigo-500/20 transition-all">
                                    {logo ? (
                                        <img src={logo} alt="Business Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={40} className="text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-600 transition-all active:scale-90">
                                    <Upload size={16} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Business Logo</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                    Upload your restaurant's logo. This will appear on the login screen, sidebar, and customer app.
                                    Recommended size: 200x200px.
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Name</label>
                            <input 
                                type="text" 
                                value={name || ''}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Phone</label>
                             <input 
                                type="text" 
                                value={phone || ''}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Brand Theme Color</label>
                             <div className="flex gap-3">
                                <input 
                                    type="color" 
                                    value={themeColor || ''}
                                    onChange={e => setThemeColor(e.target.value)}
                                    className="h-14 w-14 border-2 border-slate-100 rounded-2xl cursor-pointer p-1.5 bg-white shadow-sm"
                                />
                                <input 
                                    type="text" 
                                    value={themeColor || ''}
                                    onChange={e => setThemeColor(e.target.value)}
                                    className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase transition-all shadow-sm"
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Physical Address</label>
                             <textarea 
                                value={address || ''}
                                onChange={e => setAddress(e.target.value)}
                                rows={2}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all resize-none shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Regional & Tax Section */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-500 shadow-xl shadow-emerald-100 hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                            <Percent size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tax & Regional Settings</h2>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Currency Symbol</label>
                             <div className="relative group">
                                <select
                                    value={currency || ''}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all appearance-none shadow-sm"
                                >
                                    <option value="$">USD ($)</option>
                                    <option value="£">GBP (£)</option>
                                    <option value="€">EUR (€)</option>
                                    <option value="₹">INR (₹)</option>
                                    <option value="৳">BDT (৳)</option>
                                    <option value="د.إ">AED (د.إ)</option>
                                    <option value="﷼">SAR (﷼)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Globe size={16} />
                                </div>
                             </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Billing Tax (VAT)</label>
                            <div className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${includeVat ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        {includeVat ? 'VAT Enabled' : 'VAT Disabled'}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={includeVat}
                                        onChange={e => setIncludeVat(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                </label>
                            </div>
                            
                            {includeVat && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">VAT Rate (%)</label>
                                    <input 
                                        type="number" 
                                        value={vatRate}
                                        min="0"
                                        step="0.1"
                                        onChange={e => setVatRate(Number(e.target.value))}
                                        className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                                    />
                                </div>
                            )}
                        </div>
                     </div>
                </div>

                {/* Customer App Section */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-500 shadow-xl shadow-blue-100 hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Customer App & Token Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Order Token Prefix</label>
                            <input 
                                type="text" 
                                value={customerTokenPrefix}
                                onChange={e => setCustomerTokenPrefix(e.target.value.toUpperCase())}
                                placeholder="e.g. WEB"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Next Token Number</label>
                            <input 
                                type="number" 
                                value={nextCustomerToken}
                                onChange={e => setNextCustomerToken(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between shadow-sm">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Enable Customer Ordering Portal</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Allow customers to access the ordering app from the login screen.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold uppercase text-slate-900 tracking-widest">
                                {customerAppEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={customerAppEnabled}
                                    onChange={e => setCustomerAppEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit"
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-slate-800 transition transform active:scale-95 border-2 border-indigo-500"
                    >
                        <Save size={20} /> Save Business Profile
                    </button>
                </div>
            </form>
        </div>
    );
};
