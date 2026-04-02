
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus, Order, Transaction, OrderItem, Role } from '../types';
import { Receipt, CheckCheck, Printer, X, FileText, Store, Search, Users, Eye, AlertTriangle, Truck, ChevronDown, Bluetooth } from 'lucide-react';
import { BluetoothPrinterService } from '../services/printerService';

export const Billing = () => {
  const { orders, currentTenant, currentUser, updateOrderStatus, updateOrderItems, addTransaction, users } = useApp();
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [discounts, setDiscounts] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showConfirmCollect, setShowConfirmCollect] = useState(false);
  
  const getCreator = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const calculateTotal = (order: Order, discount: number = 0) => {
    const subtotal = order.totalAmount;
    const vat = currentTenant?.includeVat ? (subtotal * ((currentTenant?.vatRate || 0) / 100)) : 0;
    const total = Math.max(0, subtotal + vat - discount);
    return { subtotal, vat, total };
  };

  const filteredOrders = useMemo(() => {
    // Only Owner, Manager, Kitchen, and Super Admin can see all orders
    const canSeeAll = currentUser && [Role.OWNER, Role.MANAGER, Role.KITCHEN, Role.SUPER_ADMIN].includes(currentUser.role);

    return orders
      .filter(o => {
        const isReady = o.status === OrderStatus.READY;
        const matchesSearch = o.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (o.deliveryStaffName && o.deliveryStaffName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStaff = selectedStaffId === 'all' || o.createdBy === selectedStaffId || o.deliveryStaffId === selectedStaffId;
        const isOwnOrder = canSeeAll || (currentUser && o.createdBy === currentUser.id);
        return isReady && matchesSearch && matchesStaff && isOwnOrder;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, searchTerm, selectedStaffId, currentUser]);

  const totalAwaitingAmount = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      const discount = discounts[order.id] || 0;
      const { total } = calculateTotal(order, discount);
      return acc + total;
    }, 0);
  }, [filteredOrders, discounts, currentTenant]);

  const selectedTotalAmount = useMemo(() => {
    return filteredOrders
      .filter(o => selectedOrderIds.includes(o.id))
      .reduce((acc, order) => {
        const discount = discounts[order.id] || 0;
        const { total } = calculateTotal(order, discount);
        return acc + total;
      }, 0);
  }, [filteredOrders, selectedOrderIds, discounts, currentTenant]);

  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (item.status === OrderStatus.CANCELLED) return acc;
      const existing = acc.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as OrderItem[]);
    return grouped;
  };

  const handlePayment = (order: Order) => {
    const discount = discounts[order.id] || 0;
    const { total } = calculateTotal(order, discount);
    const groupedItems = groupItems(order.items);
    const creator = getCreator(order.createdBy);
    
    const transaction = {
        id: `txn-${Date.now()}`,
        tenantId: currentTenant.id,
        orderId: order.id,
        amount: total,
        discount: discount,
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        itemsSummary: groupedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
        creatorName: creator?.name || 'Unknown'
    };
    
    addTransaction(transaction);
    updateOrderStatus(order.id, OrderStatus.COMPLETED, discount);
    
    // Auto-print invoice if enabled
    if (currentTenant?.printerSettings?.autoPrintInvoice) {
      setInvoiceOrder({ ...order, discount } as any);
      setTimeout(() => {
        const printBtn = document.getElementById('print-invoice-btn');
        if (printBtn) printBtn.click();
      }, 500);
    }

    // Invoice preview not required
    setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
  };

  const handleBulkPayment = () => {
    if (selectedOrderIds.length === 0) return;
    setShowConfirmCollect(true);
  };

  const confirmBulkPayment = () => {
    const selectedOrders = filteredOrders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedOrders.length === 0) return;

    selectedOrders.forEach(order => {
      const discount = discounts[order.id] || 0;
      const { total } = calculateTotal(order, discount);
      const groupedItems = groupItems(order.items);
      const creator = getCreator(order.createdBy);
      
      const transaction = {
          id: `txn-${Date.now()}-${order.id}`,
          tenantId: currentTenant.id,
          orderId: order.id,
          amount: total,
          discount: discount,
          date: new Date().toISOString(),
          paymentMethod: 'CASH',
          itemsSummary: groupedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
          creatorName: creator?.name || 'Unknown'
      };
      
      addTransaction(transaction);
      updateOrderStatus(order.id, OrderStatus.COMPLETED, discount);
    });

    setSelectedOrderIds([]);
    setShowConfirmCollect(false);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const handleAssignDelivery = async (orderId: string, staffId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (staffId === 'none') {
      await updateOrderItems(
        orderId,
        order.items,
        order.totalAmount,
        order.note || undefined,
        order.status,
        null,
        null,
        null,
        order.deliveryAddress
      );
      return;
    }

    const staff = users.find(u => u.id === staffId);
    if (staff) {
      await updateOrderItems(
        orderId,
        order.items,
        order.totalAmount,
        order.note || undefined,
        order.status,
        staff.id,
        staff.name,
        staff.mobile,
        order.deliveryAddress
      );
    }
  };

  const printInvoice = async () => {
    // If a bluetooth printer is paired, try to print directly
    if (currentTenant?.printerSettings?.pairedPrinterId && invoiceOrder) {
      try {
        const result = await BluetoothPrinterService.connect(currentTenant.printerSettings.pairedPrinterId);
        if (result.success) {
          const discount = discounts[invoiceOrder.id] || 0;
          const creator = getCreator(invoiceOrder.createdBy);
          await BluetoothPrinterService.printInvoice(currentTenant, invoiceOrder, { 
            discount,
            creatorName: creator?.name || 'Unknown'
          });
          return; // Skip system print if bluetooth worked
        }
      } catch (error) {
        console.error('Bluetooth print failed, falling back to system print:', error);
      }
    }

    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `${currentTenant?.name || 'Invoice'} - #${invoiceOrder?.tokenNumber}`;
    
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Apply paper width setting
    const paperWidth = currentTenant?.printerSettings?.paperWidth || '80mm';
    printContainer.style.width = paperWidth;
    printContainer.style.margin = '0 auto';
    
    printContainer.innerHTML = printContent.innerHTML;
    document.body.appendChild(printContainer);

    window.focus();
    window.print();
    
    // Clean up
    document.body.removeChild(printContainer);
    document.title = originalTitle;
  };

  return (
    <div className="p-4 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 md:gap-4">
             <Receipt className="text-indigo-500" size={28} /> Billing Hub
          </h1>
          <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1 md:mt-2 opacity-80">Finalize payments and generate invoices</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-3 flex-1 md:w-64">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm appearance-none"
              >
                <option value="all">All Staff</option>
                {users.filter(u => u.permissions?.includes('POS')).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search Token Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="bg-pink-500 border-2 border-black px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-lg shadow-pink-200 transition-all hover:scale-105 flex flex-col justify-center items-center">
            <p className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest mb-0.5 md:mb-1">Total Amount</p>
            <p className="text-lg md:text-xl font-bold text-white leading-none">
              {currentTenant?.currency}{selectedTotalAmount.toFixed(2)}
            </p>
          </div>
          <button 
            onClick={handleBulkPayment}
            disabled={selectedOrderIds.length === 0}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-lg transition-all border-2 border-black flex flex-col justify-center ${
              selectedOrderIds.length > 0 
                ? 'bg-emerald-500 text-white shadow-emerald-100 hover:scale-105' 
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1 ${selectedOrderIds.length > 0 ? 'text-white/80' : 'text-slate-400'}`}>Collect Amount</p>
            <p className="text-sm md:text-base font-bold leading-none">Total Order: {selectedOrderIds.length}</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-black overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 border-black">
              <tr>
                <th className="px-4 py-6 text-center border-r border-black">
                  <input 
                    type="checkbox" 
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-black text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-8 py-6 text-center border-r border-black">Token</th>
                <th className="px-8 py-6 border-r border-black">Table/Staff</th>
                <th className="px-8 py-6 border-r border-black">Created By</th>
                <th className="px-8 py-6 border-r border-black">Assign Delivery</th>
                <th className="px-8 py-6 border-r border-black">Discount</th>
                <th className="px-8 py-6 border-r border-black">Total Due</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Receipt size={64} strokeWidth={1} className="mb-6 opacity-40" />
                      <p className="text-sm font-medium opacity-60 uppercase tracking-widest">No matching orders</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const discount = discounts[order.id] || 0;
                  const { total } = calculateTotal(order, discount);
                  const creator = getCreator(order.createdBy);
                  const isSelected = selectedOrderIds.includes(order.id);

                  return (
                    <tr key={order.id} className={`hover:bg-indigo-50/30 transition-all group ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-4 py-6 border-r border-black text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-2 border-black text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        <div className="flex justify-center">
                          <div className="px-4 py-2 rounded-xl border-2 border-black flex items-center justify-center font-black text-xl text-white bg-emerald-500 shadow-lg min-w-[3.5rem]">
                            {order.tokenNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        <div className="flex flex-col gap-1">
                          {(order.tableNumber || order.deliveryStaffName) && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit uppercase tracking-widest">
                              {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{creator?.name || '-'}</span>
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        {!order.tableNumber ? (
                          <div className="relative w-40">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select 
                              value={order.deliveryStaffId || 'none'}
                              onChange={(e) => handleAssignDelivery(order.id, e.target.value)}
                              className="w-full pl-9 pr-8 py-2 text-[10px] font-bold bg-slate-50 border-2 border-black rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                            >
                              <option value="none">No Delivery</option>
                              {users.filter(u => u.role === Role.DELIVERY).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                          </div>
                        ) : (
                          <div className="text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">Dine-in</div>
                        )}
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currentTenant?.currency}</span>
                          <input 
                            type="number"
                            value={discounts[order.id] || ''}
                            onChange={(e) => setDiscounts(prev => ({ ...prev, [order.id]: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 text-[10px] font-bold bg-slate-50 border-2 border-black rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r border-black">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
                          {currentTenant?.currency}{total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              const discount = discounts[order.id] || 0;
                              setInvoiceOrder({ ...order, discount } as any);
                            }}
                            className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 shadow-lg border-2 border-black transition-all active:scale-95"
                            title="Preview & Collect"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-black">
          {filteredOrders.length > 0 && (
            <div className="p-4 bg-slate-50 border-b border-black flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-2 border-black text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Select All</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedOrderIds.length} Selected</span>
            </div>
          )}
          {filteredOrders.length === 0 ? (
            <div className="px-8 py-24 text-center">
              <div className="flex flex-col items-center justify-center text-slate-300">
                <Receipt size={64} strokeWidth={1} className="mb-6 opacity-40" />
                <p className="text-sm font-medium opacity-60 uppercase tracking-widest">No matching orders</p>
              </div>
            </div>
          ) : (
            filteredOrders.map(order => {
              const discount = discounts[order.id] || 0;
              const { total } = calculateTotal(order, discount);
              const creator = getCreator(order.createdBy);

              return (
                <div key={order.id} className={`p-5 flex flex-col gap-4 border-b border-black ${selectedOrderIds.includes(order.id) ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="w-5 h-5 rounded border-2 border-black text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="px-3 py-1.5 rounded-xl border-2 border-black flex items-center justify-center font-black text-lg text-white bg-emerald-500 shadow-md min-w-[3rem]">
                        {order.tokenNumber}
                      </div>
                      <div className="flex flex-col gap-1">
                        {(order.tableNumber || order.deliveryStaffName) && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit uppercase tracking-widest">
                            {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : order.tableNumber}
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{creator?.name || '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                      <span className="text-xl font-black text-slate-900 tracking-tighter">
                        {currentTenant?.currency}{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {!order.tableNumber && (
                    <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl">
                      <div className="relative flex-1">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                          value={order.deliveryStaffId || 'none'}
                          onChange={(e) => handleAssignDelivery(order.id, e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-[10px] font-bold bg-white border-2 border-black rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                        >
                          <option value="none">No Delivery</option>
                          {users.filter(u => u.role === Role.DELIVERY).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currentTenant?.currency}</span>
                      <input 
                        type="number"
                        value={discounts[order.id] || ''}
                        onChange={(e) => setDiscounts(prev => ({ ...prev, [order.id]: parseFloat(e.target.value) || 0 }))}
                        placeholder="Discount"
                        className="w-full pl-7 pr-3 py-2 text-[10px] font-bold bg-white border-2 border-black rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const discount = discounts[order.id] || 0;
                          setInvoiceOrder({ ...order, discount } as any);
                        }}
                        className="h-10 px-4 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[9px] shadow-lg border-2 border-black active:scale-95 transition-all"
                      >
                        Preview <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:p-0 print:static print:block print-visible">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={() => setInvoiceOrder(null)}></div>
          <div className="relative bg-white w-full max-w-md md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:max-w-none print:rounded-none border-2 border-indigo-500 print:border-none print:static print:block print:w-full print:opacity-100 print:transform-none self-end md:self-center max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden shrink-0">
              <h3 className="font-bold text-slate-900 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                <FileText size={18} className="text-indigo-500"/> {invoiceOrder.status === OrderStatus.COMPLETED ? 'Invoice' : 'Pro-forma Invoice'}
              </h3>
              <button onClick={() => setInvoiceOrder(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-4 md:p-10 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible flex-1 text-black" id="invoice-content">
              <div className="text-center mb-6 md:mb-10">
                {currentTenant?.printerSettings?.showLogo !== false && (
                  <div className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl border border-black bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                    {currentTenant?.logo ? (
                      <img src={currentTenant.logo} className="h-full w-full object-contain" alt="Logo"/>
                    ) : (
                      <Store size={24} className="text-black md:size-32" />
                    )}
                  </div>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-black tracking-tight mb-1 text-center whitespace-normal break-words print:text-base">{currentTenant?.name}</h2>
                {currentTenant?.printerSettings?.receiptHeader ? (
                  <p className="text-sm text-black font-bold whitespace-pre-line mb-2">{currentTenant.printerSettings.receiptHeader}</p>
                ) : (
                  <>
                    <p className="text-xs md:text-sm text-black font-bold uppercase tracking-widest">{currentTenant?.address}</p>
                    <p className="text-xs md:text-sm text-black font-bold uppercase tracking-widest mt-1">Tel: {currentTenant?.phone}</p>
                  </>
                )}
              </div>
              
              <div className="border-y border-black py-6 md:py-8 mb-6 md:mb-8 text-center bg-slate-50/50 rounded-2xl md:rounded-3xl">
                  <span className="text-xs md:text-sm font-bold text-black uppercase tracking-widest block mb-1 md:mb-2">Service Token</span>
                  <div className="flex flex-col items-center gap-1 md:gap-2">
                    <span className="text-4xl md:text-5xl text-black font-bold tracking-tight">#{invoiceOrder.tokenNumber}</span>
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <span className="text-xs md:text-sm font-bold text-black uppercase tracking-widest">
                        Date/Time: {new Date(invoiceOrder.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-black uppercase tracking-widest">
                        Ordered by: {getCreator(invoiceOrder.createdBy)?.name || 'Unknown'}
                      </span>
                      {invoiceOrder.deliveryStaffName && (
                        <div className="flex flex-col items-center gap-1 mt-1 p-3 bg-slate-50 rounded-2xl border-2 border-black w-full">
                          <span className="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <Truck size={14} /> Delivery: {invoiceOrder.deliveryStaffName}
                          </span>
                          {invoiceOrder.deliveryStaffMobile && (
                            <span className="text-xs md:text-sm font-bold text-black uppercase tracking-widest">
                              Contact: {invoiceOrder.deliveryStaffMobile}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-black border-b border-black pb-2">
                  <span>Selection</span>
                  <span>Subtotal</span>
                </div>
                <div className="space-y-3">
                  {groupItems(invoiceOrder.items).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-base font-medium">
                      <div className="flex items-center gap-3">
                        <span className="text-black font-bold">{item.quantity} x</span>
                        <span className="text-black">{item.name}</span>
                      </div>
                      <span className="text-black font-bold shrink-0">{currentTenant?.currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-black">
                {(() => {
                  const discount = (invoiceOrder as any).discount || 0;
                  const { subtotal, vat, total } = calculateTotal(invoiceOrder, discount);
                  return (
                    <>
                      <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-black">
                        <span>Subtotal</span>
                        <span>{currentTenant?.currency}{subtotal.toFixed(2)}</span>
                      </div>
                      {currentTenant?.includeVat && (
                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-black">
                          <span>VAT ({currentTenant?.vatRate}%)</span>
                          <span>{currentTenant?.currency}{vat.toFixed(2)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-black">
                          <span>Discount</span>
                          <span>-{currentTenant?.currency}{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-6 mt-4 border-t border-black">
                        <span className="text-base font-bold uppercase tracking-widest text-black">Total Amount</span>
                        <span className="text-4xl font-bold text-black tracking-tight">{currentTenant?.currency}{total.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="text-center mt-12 pt-10 border-t border-black">
                {currentTenant?.printerSettings?.receiptFooter ? (
                  <p className="text-sm text-black font-bold whitespace-pre-line mb-2">{currentTenant.printerSettings.receiptFooter}</p>
                ) : (
                  <p className="text-sm font-bold text-black uppercase tracking-widest mb-2">ধন্যবাদ! আবার আসবেন</p>
                )}
                <div className="flex flex-col items-center justify-center gap-1">
                  <p className="text-xs font-bold tracking-widest text-black">Powered By: RestoKeep</p>
                  <p className="text-xs font-bold tracking-widest text-black">Web: www.restokeep.app</p>
                  <p className="text-[10px] font-bold tracking-widest text-black">Mob: 01303565316</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50 flex flex-col md:flex-row gap-4 print:hidden shrink-0">
              <button 
                onClick={() => {
                  handlePayment(invoiceOrder);
                  setInvoiceOrder(null);
                }} 
                className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 text-white py-4 rounded-2xl hover:bg-emerald-600 transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 border-2 border-black"
              >
                <CheckCheck size={18} /> Collect Amount
              </button>
              <button 
                id="print-invoice-btn"
                onClick={printInvoice} 
                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl hover:bg-slate-800 transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 border-2 border-black"
              >
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmCollect && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmCollect(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border-2 border-indigo-600 p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt size={32} />
              </div>
              <h3 className="text-xl font-black text-indigo-600 uppercase tracking-tight">Confirm Collection?</h3>
              <div className="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-100 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Staff Name</p>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">
                    {(() => {
                      if (selectedStaffId !== 'all') return users.find(u => u.id === selectedStaffId)?.name || 'Unknown';
                      if (selectedOrderIds.length === 0) return 'All Staff';
                      const firstOrderCreator = orders.find(o => o.id === selectedOrderIds[0])?.createdBy;
                      const allSame = selectedOrderIds.every(id => orders.find(o => o.id === id)?.createdBy === firstOrderCreator);
                      return allSame ? (users.find(u => u.id === firstOrderCreator)?.name || 'All Staff') : 'All Staff';
                    })()}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100 pt-3">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Selected Orders</p>
                  <span className="text-xs font-black text-emerald-600">{selectedOrderIds.length}</span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100 pt-3">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total Amount</p>
                  <span className="text-sm font-black text-emerald-600">{currentTenant?.currency}{selectedTotalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowConfirmCollect(false)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-black shadow-lg shadow-red-100 hover:scale-105 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmBulkPayment}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-black shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                >
                  Collect Amount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
