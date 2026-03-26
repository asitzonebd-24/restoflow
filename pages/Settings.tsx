
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Store, Globe, Percent, Upload, Image as ImageIcon, User as UserIcon, Lock, Mail, Phone, Printer } from 'lucide-react';
import { Role } from '../types';
import { BluetoothPrinterService } from '../services/printerService';

export const Settings = () => {
    const { business, updateBusiness, currentUser, updateUser } = useApp();
    
    // Business Settings state
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

    // Printer Settings state
    const [receiptHeader, setReceiptHeader] = useState('');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [autoPrintKOT, setAutoPrintKOT] = useState(false);
    const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);
    const [showLogo, setShowLogo] = useState(true);
    const [pairedPrinterName, setPairedPrinterName] = useState('');
    const [pairedPrinterId, setPairedPrinterId] = useState('');
    const [isBluetoothSearching, setIsBluetoothSearching] = useState(false);

    // User Profile state
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userAvatar, setUserAvatar] = useState('');

    const hasSettingsPermission = currentUser?.permissions?.includes('Settings') || currentUser?.role === Role.SUPER_ADMIN;

    // Load data into form on mount
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
            
            if (business.printerSettings) {
                setReceiptHeader(business.printerSettings.receiptHeader || '');
                setReceiptFooter(business.printerSettings.receiptFooter || '');
                setPaperWidth(business.printerSettings.paperWidth || '80mm');
                setAutoPrintKOT(business.printerSettings.autoPrintKOT || false);
                setAutoPrintInvoice(business.printerSettings.autoPrintInvoice || false);
                setShowLogo(business.printerSettings.showLogo ?? true);
                setPairedPrinterName(business.printerSettings.pairedPrinterName || '');
                setPairedPrinterId(business.printerSettings.pairedPrinterId || '');
            }
        }
        if (currentUser) {
            setUserName(currentUser.name);
            setUserEmail(currentUser.email);
            setUserMobile(currentUser.mobile);
            setUserPassword(currentUser.password || '');
            setUserAvatar(currentUser.avatar || '');
        }
    }, [business, currentUser]);

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

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBusinessSubmit = (e: React.FormEvent) => {
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
                nextCustomerToken,
                printerSettings: {
                    receiptHeader,
                    receiptFooter,
                    paperWidth,
                    autoPrintKOT,
                    autoPrintInvoice,
                    showLogo,
                    pairedPrinterName,
                    pairedPrinterId
                }
            });
            alert('Business settings saved successfully!');
        }
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            updateUser(currentUser.id, {
                name: userName,
                email: userEmail,
                mobile: userMobile,
                password: userPassword,
                avatar: userAvatar
            });
            alert('Profile updated successfully!');
        }
    };

    const handleAddBluetoothPrinter = async () => {
        const connected = await BluetoothPrinterService.connect();
        if (connected) {
            // The device is stored in the service, but we need to get its info
            // Since we don't have a direct way to get the device from the service easily without exposing it,
            // let's assume the connection was successful and we can just use the navigator to get the device again or store it.
            // Actually, the requestDevice returns the device.
            
            // Re-implementing the request part here to get the device object
            try {
                const device = await (navigator as any).bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [
                        '00001101-0000-1000-8000-00805f9b34fb',
                        '000018f0-0000-1000-8000-00805f9b34fb',
                        0xFF00, 0x4953
                    ]
                });
                if (device) {
                    setPairedPrinterName(device.name || 'Unknown Printer');
                    setPairedPrinterId(device.id);
                    alert(`Printer "${device.name || 'Unknown Printer'}" paired successfully! Don't forget to save your settings.`);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            alert('Failed to connect to printer. Please ensure it is turned on and in range.');
        }
        setIsBluetoothSearching(false);
    };

    const handleTestPrint = async () => {
        try {
            const connected = await BluetoothPrinterService.connect(pairedPrinterId);
            if (!connected) {
                alert('Could not connect to the paired printer. Please try pairing again.');
                return;
            }
            
            // Send a simple test print
            const encoder = new TextEncoder();
            
            // We use the service's printTextLine logic for the test print too
            const pixelWidth = business.printerSettings?.paperWidth === '58mm' ? 384 : 576;
            
            await BluetoothPrinterService.printRaw(new Uint8Array([0x1B, 0x40])); // Init
            
            await BluetoothPrinterService.printTextLine('RestoKeep Test Print', pixelWidth, { align: 'center', doubleSize: true, bold: true });
            await BluetoothPrinterService.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('বাংলা ফন্ট টেস্ট (Bangla Test)', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Printer: ' + pairedPrinterName, pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Status: Working Correctly', pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('Date: ' + new Date().toLocaleString(), pixelWidth, { align: 'center' });
            await BluetoothPrinterService.printTextLine('--------------------------------', pixelWidth, { align: 'center' });
            
            await BluetoothPrinterService.printRaw(new Uint8Array([...Array(4).fill(0x0A), 0x1D, 0x56, 0x41, 0x03])); // Feed & Cut
            
            alert('Test print sent!');
        } catch (error) {
            console.error('Test print error:', error);
            alert('Test print failed. Check console for details.');
        }
    };

    if (!business || !currentUser) return null;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-[#f8fafc] min-h-full font-sans">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your profile and business preferences</p>
                </div>
            </div>

            <div className="space-y-8 pb-12">
                {/* User Profile Section - Visible to EVERYONE */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl shadow-slate-100 hover:scale-[1.01] transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center border border-slate-100">
                                <UserIcon size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Profile</h2>
                        </div>
                        <button 
                            onClick={handleProfileSubmit}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            Update Profile
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 mb-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center group-hover:border-slate-900/20 transition-all">
                                    {userAvatar ? (
                                        <img 
                                            src={userAvatar} 
                                            alt="User Avatar" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <UserIcon size={32} className="text-slate-200" />
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-600 transition-all active:scale-90">
                                    <Upload size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Profile Picture</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                                    Your avatar is visible in the sidebar and team list.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={userEmail}
                                    onChange={e => setUserEmail(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={userMobile}
                                    onChange={e => setUserMobile(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={userPassword}
                                    onChange={e => setUserPassword(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all shadow-sm"
                                />
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {hasSettingsPermission && (
                    <>
                        {/* Business Profile Section */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-500 shadow-xl shadow-indigo-100 hover:scale-[1.01] transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                                        <Store size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Restaurant Profile</h2>
                                </div>
                                <button 
                                    onClick={handleBusinessSubmit}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Business
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8 mb-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center group-hover:border-indigo-500/20 transition-all">
                                            {logo ? (
                                                <img 
                                                    src={logo} 
                                                    alt="Business Logo" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <Store size={40} className="text-slate-200" />
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

                        {/* Printer & Receipt Settings Section */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl shadow-slate-100 hover:scale-[1.01] transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center border border-slate-100">
                                        <ImageIcon size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Printer & Receipt Setup</h2>
                                </div>
                                <button 
                                    onClick={handleBusinessSubmit}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Printer Settings
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                                            <Store size={16} />
                                            Bluetooth Printer Connection
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-4">
                                            To use a Bluetooth thermal printer directly from the browser, ensure your printer is paired with your device. 
                                            <br/>
                                            <span className="text-indigo-600">Note: For the best results, open this app in a new tab.</span>
                                        </p>
                                        
                                        {pairedPrinterName && (
                                            <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                        <Printer size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Paired Printer</p>
                                                        <p className="text-sm font-bold text-slate-900">{pairedPrinterName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={handleTestPrint}
                                                        className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 underline underline-offset-4"
                                                    >
                                                        Test Print
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setPairedPrinterName('');
                                                            setPairedPrinterId('');
                                                        }}
                                                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleAddBluetoothPrinter}
                                            disabled={isBluetoothSearching}
                                            className={`w-full md:w-auto bg-white border-2 border-slate-900 text-slate-900 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm ${isBluetoothSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Globe size={18} className={isBluetoothSearching ? 'animate-spin' : ''} />
                                            {isBluetoothSearching ? 'Searching...' : 'Add Bluetooth Printer'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Paper Width</label>
                                    <div className="flex gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setPaperWidth('58mm')}
                                            className={`flex-1 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${paperWidth === '58mm' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            58mm
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setPaperWidth('80mm')}
                                            className={`flex-1 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${paperWidth === '80mm' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            80mm
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Print Options</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-slate-200 transition-all">
                                            <span className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">Show Logo on Receipt</span>
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                checked={showLogo}
                                                onChange={e => setShowLogo(e.target.checked)}
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-slate-200 transition-all">
                                            <span className="text-[10px] font-bold uppercase text-slate-700 tracking-widest">Auto-print KOT on Order</span>
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                checked={autoPrintKOT}
                                                onChange={e => setAutoPrintKOT(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Header (Custom Text)</label>
                                    <textarea 
                                        value={receiptHeader}
                                        onChange={e => setReceiptHeader(e.target.value)}
                                        placeholder="e.g. Welcome to our restaurant!&#10;Open 24/7"
                                        rows={2}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all resize-none shadow-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Footer (Custom Text)</label>
                                    <textarea 
                                        value={receiptFooter}
                                        onChange={e => setReceiptFooter(e.target.value)}
                                        placeholder="e.g. Thank you for your visit!&#10;Follow us on Instagram @resto"
                                        rows={2}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none font-bold text-sm transition-all resize-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
