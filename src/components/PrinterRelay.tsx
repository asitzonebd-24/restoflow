
import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { BluetoothPrinterService } from '../../services/printerService';
import { toast } from 'sonner';

export const PrinterRelay: React.FC = () => {
    const { business, relayMode } = useApp();
    const processingRef = useRef<boolean>(false);
    const processedIds = useRef<Set<string>>(new Set());
    const wakeLockRef = useRef<any>(null);
    const sessionStartTime = useRef<number>(Date.now());
    
    // Function to keep screen on
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                console.log('[PrinterRelay] Wake Lock active');
            }
        } catch (err) {
            console.error('[PrinterRelay] Wake Lock failed:', err);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    useEffect(() => {
        if (relayMode) {
            requestWakeLock();
            // Handle re-requesting when page becomes visible again
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                releaseWakeLock();
            };
        }
    }, [relayMode]);

    useEffect(() => {
        if (!relayMode || !business?.id) {
            if (!relayMode) processedIds.current.clear();
            return;
        }

        console.log('[PrinterRelay] Starting listener for tenant:', business.id);
        
        // Query for new print requests for this tenant
        const q = query(
            collection(db, 'print_requests'),
            where('tenantId', '==', business.id),
            orderBy('createdAt', 'asc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty || processingRef.current) return;

            processingRef.current = true;
            
            try {
                for (const change of snapshot.docChanges()) {
                    if (change.type === 'added') {
                        const printData = { id: change.doc.id, ...change.doc.data() } as any;
                        
                        // 1. Avoid duplicate processing in-memory
                        if (processedIds.current.has(printData.id)) continue;

                        // 2. Backlog Protection: Ignore requests created more than 2 minutes before this session started
                        const requestTime = printData.createdAt ? (printData.createdAt.toMillis ? printData.createdAt.toMillis() : new Date(printData.createdAt).getTime()) : Date.now();
                        if (requestTime < sessionStartTime.current - 120000) { 
                            console.log('[PrinterRelay] Skipping old backlog request:', printData.id);
                            processedIds.current.add(printData.id);
                            continue;
                        }

                        try {
                            console.log('[PrinterRelay] Processing job:', printData.id, 'Type:', printData.type);
                            
                            // 3. Ensure we are connected to the printer
                            const pairedPrinterId = business.printerSettings?.pairedPrinterId;
                            if (!pairedPrinterId) {
                                toast.error('Relay: No printer paired in Settings!');
                                break;
                            }

                            let connection = await BluetoothPrinterService.connect(pairedPrinterId, true);
                            
                            // If it fails with 'failed', retry once after 1s
                            if (!connection.success && connection.error === 'failed') {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                connection = await BluetoothPrinterService.connect(pairedPrinterId, true);
                            }

                            if (!connection.success) {
                                console.error('[PrinterRelay] Connection failed:', connection.error);
                                if (connection.error === 'gesture_required') {
                                    toast.error('Relay: Printer needs re-pairing. Go to Settings and Connect.');
                                } else if (connection.error === 'unsupported') {
                                    toast.error('Relay: Bluetooth unsupported.');
                                } else {
                                    toast.error('Relay: Print device connection error. Check Printer.');
                                }
                                break; // Stop loop if connection fails
                            }

                            // 4. Perform the print
                            if (printData.type === 'kot') {
                                await BluetoothPrinterService.printKOT(business, printData);
                            } else {
                                await BluetoothPrinterService.printInvoice(business, printData, {
                                    creatorName: printData.creatorName,
                                    discount: printData.discount || 0
                                });
                            }

                            // 5. Build-in success notification
                            toast.success(`Printed ${printData.type === 'kot' ? 'KOT' : 'Invoice'} #${printData.tokenNumber}`);

                            // 6. Mark as READY if requested
                            if (printData.autoMarkReady && printData.orderId) {
                                const orderRef = doc(db, 'orders', printData.orderId);
                                const orderSnap = await getDoc(orderRef);
                                if (orderSnap.exists()) {
                                    const orderData = orderSnap.data();
                                    const updatedItems = orderData.items.map((item: any) => {
                                        const printedItem = printData.items?.find((pi: any) => pi.rowId === item.rowId);
                                        if (printedItem && item.status === 'PENDING') return { ...item, status: 'READY' };
                                        return item;
                                    });
                                    const allReady = updatedItems.every((i: any) => ['READY', 'COMPLETED', 'CANCELLED'].includes(i.status));
                                    await updateDoc(orderRef, {
                                        items: updatedItems,
                                        status: allReady ? 'READY' : orderData.status
                                    });
                                }
                            }

                            // 7. Done! Delete the request
                            await deleteDoc(doc(db, 'print_requests', printData.id));
                            processedIds.current.add(printData.id);
                            
                        } catch (error) {
                            console.error('[PrinterRelay] Print error:', error);
                            // If it's a real print error, we might want to skip this job to avoid infinite loops
                            // but still show an error.
                            toast.error(`Relay: Error printing token #${printData.tokenNumber}`);
                            // Mark as processed in-memory so we don't try again until refresh
                            processedIds.current.add(printData.id);
                        }
                    }
                }
            } finally {
                processingRef.current = false;
            }
        }, (error) => {
            console.error('[PrinterRelay] Listener error:', error);
            processingRef.current = false;
        });

        return () => {
            console.log('[PrinterRelay] Stopping listener');
            unsubscribe();
        };
    }, [relayMode, business?.id]);

    if (!relayMode) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] animate-pulse">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Relay Active</span>
            </div>
        </div>
    );
};
