
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus, Order, Transaction, OrderItem } from '../types';
import { Receipt, CheckCheck, Printer, Download, X, FileText, Hash, MapPin, ShoppingBag, CreditCard } from 'lucide-react';

export const Billing = () => {
  const { orders, currentTenant, updateOrderStatus, addTransaction, users } = useApp();
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  
  const readyOrders = orders.filter(o => o.status === OrderStatus.READY);

  const getCreator = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const calculateTotal = (order: Order) => {
    const subtotal = order.totalAmount;
    const vat = currentTenant?.includeVat ? (subtotal * ((currentTenant?.vatRate || 0) / 100)) : 0;
    return { subtotal, vat, total: subtotal + vat };
  };

  const groupItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
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
    const { total } = calculateTotal(order);
    const groupedItems = groupItems(order.items);
    const creator = getCreator(order.createdBy);
    
    const transaction = {
        id: `txn-${Date.now()}`,
        orderId: order.id,
        amount: total,
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        itemsSummary: groupedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
        creatorName: creator?.name || 'Unknown'
    };
    
    addTransaction(transaction);
    updateOrderStatus(order.id, OrderStatus.COMPLETED);
    
    setInvoiceOrder(order);
  };

  const printInvoice = () => {
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50/50 no-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-4">
             <Receipt className="text-indigo-500" size={32} /> Billing Hub
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-2 opacity-80">Finalize payments and generate invoices</p>
        </div>
        <div className="bg-white border-2 border-indigo-500 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-105">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Awaiting Checkout</p>
          <p className="text-xl font-bold text-slate-900">{readyOrders.length} Orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {readyOrders.length === 0 ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xl">
              <Receipt size={64} strokeWidth={1} className="mb-6 opacity-40" />
              <p className="text-sm font-medium opacity-60 uppercase tracking-widest">No orders ready for billing</p>
          </div>
        ) : (
          readyOrders.map(order => {
            const { total } = calculateTotal(order);
            const groupedItems = groupItems(order.items);
            const prefix = currentTenant.customerTokenPrefix || 'WEB';
            const isOnline = order.tokenNumber.startsWith(prefix) || order.tokenNumber === 'OO';
            const headerLabel = isOnline ? 'Online Order' : 'Counter Token';

            return (
              <div key={order.id} className="group relative bg-white rounded-[2.5rem] shadow-2xl border-4 border-black transition-all duration-300 text-left flex flex-col min-h-[400px] hover:scale-[1.02] overflow-hidden">
                {/* Top Border Bar */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-emerald-500"></div>
                
                <div className="relative z-10 flex flex-col h-full p-6 pt-10">
                  <div className="text-center mb-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">{headerLabel}</p>
                    <div className="w-8 h-1.5 mx-auto rounded-full bg-emerald-500"></div>
                  </div>

                  {/* Token Number Pill */}
                  <div className="flex justify-center mb-6 relative">
                    <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black text-xl text-white shadow-xl bg-emerald-500">
                      {order.tokenNumber}
                    </div>
                    {(order.tableNumber || order.deliveryStaffName) && (
                      <div className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                        {order.deliveryStaffName ? `D-${order.deliveryStaffName.split(' ')[0]}` : `T-${order.tableNumber}`}
                      </div>
                    )}
                  </div>

                  <div className="text-center mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Total Due</span>
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{currentTenant?.currency}{total.toFixed(2)}</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-8 max-h-48 overflow-y-auto no-scrollbar py-2 border-y border-slate-50">
                  {groupedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-indigo-500 shrink-0">{item.quantity}x</span>
                        <span className="text-slate-600 truncate font-medium">{item.name}</span>
                      </div>
                      <span className="text-slate-400 font-bold shrink-0">{currentTenant?.currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.deliveryAddress && (
                  <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={12} className="text-slate-400" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Destination</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 truncate">{order.deliveryAddress}</p>
                  </div>
                )}

                <button 
                  onClick={() => handlePayment(order)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Collect Payment <CheckCheck size={16} />
                </button>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:p-0 print:static print:block">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={() => setInvoiceOrder(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:max-w-none print:rounded-none border-2 border-indigo-500 print:border-none print:static print:block print:w-full print:opacity-100 print:transform-none">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
              <h3 className="font-bold text-slate-900 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                <FileText size={18} className="text-indigo-500"/> Payment Confirmation
              </h3>
              <button onClick={() => setInvoiceOrder(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible" id="invoice-content">
              <div className="text-center mb-10">
                {currentTenant?.logo && <img src={currentTenant.logo} className="h-16 w-16 mx-auto mb-4 rounded-2xl border border-slate-100 shadow-sm" alt="Logo"/>}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{currentTenant?.name}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentTenant?.address}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tel: {currentTenant?.phone}</p>
              </div>
              
              <div className="border-y border-slate-100 py-8 mb-8 text-center bg-slate-50/50 rounded-3xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Service Token</span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-5xl text-slate-900 font-bold tracking-tight">#{invoiceOrder.tokenNumber}</span>
                    {invoiceOrder.deliveryStaffName && (
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        Delivery: {invoiceOrder.deliveryStaffName}
                      </span>
                    )}
                  </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  <span>Selection</span>
                  <span>Subtotal</span>
                </div>
                <div className="space-y-3">
                  {groupItems(invoiceOrder.items).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-medium">
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-500 font-bold">x{item.quantity}</span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-slate-900 font-bold">{currentTenant?.currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                {(() => {
                  const { subtotal, vat, total } = calculateTotal(invoiceOrder);
                  return (
                    <>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <span>Subtotal</span>
                        <span>{currentTenant?.currency}{subtotal.toFixed(2)}</span>
                      </div>
                      {currentTenant?.includeVat && (
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          <span>VAT ({currentTenant?.vatRate}%)</span>
                          <span>{currentTenant?.currency}{vat.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-900">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Total Amount</span>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">{currentTenant?.currency}{total.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="text-center mt-16 pt-8 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thank You For Dining With Us</p>
                <div className="flex items-center justify-center gap-2 opacity-20">
                  <Receipt size={12} />
                  <p className="text-[8px] font-bold uppercase tracking-widest">RestoFlow Professional OS</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50 flex gap-4 print:hidden">
              <button 
                onClick={printInvoice} 
                className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl hover:bg-slate-800 transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95"
              >
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
