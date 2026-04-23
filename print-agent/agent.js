// --- CONFIGURATION ---
const MY_TENANT_ID = process.argv[2] || '01'; 

// Firebase Configuration
const firebaseConfig = {
  projectId: "restokeepsaas",
  appId: "1:757334125938:web:27946498b6e7f2054e01eb",
  apiKey: "AIzaSyDq_z1PGwFkbaWp8gzBMJusSvwerXAad8I",
  authDomain: "restokeepsaas.firebaseapp.com",
  firestoreDatabaseId: "restokeep-db",
  storageBucket: "restokeepsaas.firebasestorage.app",
  messagingSenderId: "757334125938"
};

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, doc, deleteDoc, updateDoc, getDoc } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure subfolders exist for organization
const TEMP_DIR = path.join(__dirname, 'temp-files');
const PROFILE_DIR = path.join(__dirname, 'profiles');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log(`\n\n[${new Date().toLocaleTimeString()}] --- RestoKeep Automatic Printer Agent Starting ---`);
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);

const printQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || printQueue.length === 0) return;
    isProcessing = true;
    const { request, requestId } = printQueue.shift();
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] Printing Token: ${request.tokenNumber}. Jobs left: ${printQueue.length}`);
        await performPrint(request, requestId);
    } catch (err) {
        console.error(`Queue error for Request ${requestId}:`, err);
    } finally {
        isProcessing = false;
        setTimeout(processQueue, 1500);
    }
}

async function deletePrintRequest(requestId) {
    try {
        await deleteDoc(doc(db, 'print_requests', requestId));
    } catch (error) {}
}

const processedRequests = new Set();
const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', 'in', [MY_TENANT_ID, parseInt(MY_TENANT_ID) || MY_TENANT_ID]),
    orderBy('createdAt', 'desc'),
    limit(15)
);

console.log(`Listening for cloud print requests...`);

onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const createdAt = request.createdAt?.toDate ? request.createdAt.toDate().getTime() : Date.now();

            if (!processedRequests.has(requestId)) {
                if (createdAt > fiveMinutesAgo) {
                    printQueue.push({ request, requestId });
                    processQueue();
                }
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => console.error('Firestore Fetch Error:', error));

function getEdgePath() {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'msedge',
        'chrome'
    ];
    for (const p of paths) {
        if (p.includes(':')) {
            if (fs.existsSync(p)) return `"${p}"`;
        } else {
            return p;
        }
    }
    return 'msedge';
}

async function performPrint(order, requestId, attempt = 1, startTime = Date.now()) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(TEMP_DIR, `temp_${requestId}.html`);
    const pdfFilePath = filePath + '.pdf';
    const profilePath = path.join(PROFILE_DIR, `profile_${requestId}`); // Unique profile in subfolder to avoid locks
    
    return new Promise((resolve) => {
        const currentAge = Date.now() - startTime;
        if (currentAge > 120000) { // Total 2 minutes limit
            console.error(`[EXPIRED] Request ${requestId} exceeded limit.`);
            deletePrintRequest(requestId);
            cleanupFiles(filePath, pdfFilePath, profilePath);
            return resolve();
        }

        try {
            fs.writeFileSync(filePath, html);
            const edgePath = getEdgePath();
            
            // Optimized command without PowerShell overhead
            const convertCommand = `${edgePath} --headless --no-sandbox --disable-gpu --disable-extensions --disable-dev-shm-usage --user-data-dir="${profilePath}" --no-pdf-header-footer --no-first-run --no-default-browser-check --print-to-pdf="${pdfFilePath}" "${filePath}"`;

            console.time(`job-${requestId}`);
            exec(convertCommand, { timeout: 60000 }, (err) => { // 60s timeout for one attempt
                if (err && !fs.existsSync(pdfFilePath)) {
                    console.timeEnd(`job-${requestId}`);
                    console.error(`[CONVERT_ERROR] Attempt ${attempt}:`, err.message);
                    cleanupFiles(filePath, pdfFilePath, profilePath);
                    handleRetry(order, requestId, attempt, resolve, startTime);
                    return;
                }

                let checkAttempts = 0;
                const checkFile = setInterval(() => {
                    checkAttempts++;
                    if (fs.existsSync(pdfFilePath)) {
                        clearInterval(checkFile);
                        const sumatraPath = 'C:\\PrinterService\\SumatraPDF\\SumatraPDF.exe';
                        const printSettings = order.paperWidth?.includes('58') ? 'noscale,shrink' : 'noscale';
                        const printCommand = `"${sumatraPath}" -print-to "XP-80C" -silent -print-settings "${printSettings}" "${pdfFilePath}"`;
                        
                        exec(printCommand, { timeout: 30000 }, (fbError) => {
                            console.timeEnd(`job-${requestId}`);
                            if (!fbError) {
                                console.log(`[SUCCESS] Token: ${order.tokenNumber}`);
                                
                                // Auto Mark Ready logic
                                if (order.autoMarkReady && order.orderId) {
                                    handleAutoMarkReady(order);
                                }

                                deletePrintRequest(requestId);
                            } else {
                                console.error('Printer Error:', fbError.message);
                                deletePrintRequest(requestId);
                            }
                            setTimeout(() => cleanupFiles(filePath, pdfFilePath, profilePath), 5000);
                            resolve();
                        });
                    } else if (checkAttempts > 40) { // Wait 20s for file
                        clearInterval(checkFile);
                        console.timeEnd(`job-${requestId}`);
                        cleanupFiles(filePath, pdfFilePath, profilePath);
                        handleRetry(order, requestId, attempt, resolve, startTime);
                    }
                }, 500); 
            });
        } catch (err) { 
            console.error('[CRITICAL_ERROR]:', err);
            handleRetry(order, requestId, attempt, resolve, startTime); 
        }
    });
}

function handleRetry(order, requestId, attempt, resolve, startTime) {
    const currentAge = Date.now() - startTime;
    if (currentAge < 120000 && attempt < 3) {
        console.log(`[RETRY] Token ${order.tokenNumber} (Attempt ${attempt + 1}/3) after ${Math.round(currentAge/1000)}s`);
        setTimeout(() => performPrint(order, requestId, attempt + 1, startTime).then(resolve), 5000);
    } else {
        console.error(`[ABORTED] Token ${order.tokenNumber} failed too many times or expired (${Math.round(currentAge/1000)}s).`);
        deletePrintRequest(requestId);
        resolve();
    }
}

async function handleAutoMarkReady(order) {
    try {
        const orderRef = doc(db, 'orders', order.orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const updatedItems = orderData.items.map((item) => {
                const printedItem = order.items?.find((pi) => pi.rowId === item.rowId);
                if (printedItem && item.status === 'PENDING') {
                    return { ...item, status: 'READY' };
                }
                return item;
            });

            const allReady = updatedItems.every((i) => 
                ['READY', 'COMPLETED', 'CANCELLED'].includes(i.status)
            );

            await updateDoc(orderRef, {
                items: updatedItems,
                status: allReady ? 'READY' : orderData.status
            });
            console.log(`[AUTO-MARK] Order ${order.tokenNumber} items marked as READY.`);
        }
    } catch (err) {
        console.error('[AUTO-MARK-ERROR]:', err.message);
    }
}

function cleanupFiles(filePath, pdfFilePath, profilePath) {
    try { 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        if (profilePath && fs.existsSync(profilePath)) exec(`rmdir /s /q "${profilePath}"`);
    } catch(e) {}
}

function generateReceiptHtml(order, requestId) {
    const isInvoice = order.type === 'invoice';
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const paperWidth = order.paperWidth || '80mm';
    const contentWidth = paperWidth.includes('58') ? '48mm' : '68mm';

    let itemsHtml = '';
    const groupedItems = groupItems(order.items || []);
    groupedItems.forEach(item => {
        itemsHtml += `
            <div style="display: flex; gap: 8px; font-size: 11pt; font-weight: bold; border-bottom: 1px dashed #000; padding: 4px 0;">
                <span style="white-space: nowrap; min-width: 25px;">${item.quantity} x</span>
                <span style="flex: 1; word-break: break-word;">${item.name}</span>
                ${isInvoice ? `<span style="font-weight: bold;">${(item.price * item.quantity).toFixed(0)}</span>` : ''}
            </div>`;
    });

    if (isInvoice) {
        const subtotal = order.totalAmount || 0;
        const vat = order.includeVat ? (subtotal * (order.vatRate / 100)) : 0;
        const discount = order.discount || 0;
        const total = subtotal + vat - discount;

        itemsHtml += `
            <div style="margin-top: 10px; border-top: 2px solid #000; padding-top: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 9pt;">
                    <span>Subtotal:</span><span>${order.currency || '৳'}${subtotal.toFixed(0)}</span>
                </div>
                ${order.includeVat ? `
                <div style="display: flex; justify-content: space-between; font-size: 9pt;">
                    <span>VAT (${order.vatRate}%):</span><span>${order.currency || '৳'}${vat.toFixed(0)}</span>
                </div>` : ''}
                ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 9pt;">
                    <span>Discount:</span><span>-${order.currency || '৳'}${discount.toFixed(0)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; border-top: 1px solid #000; margin-top: 4px; padding-top: 2px;">
                    <span>Total:</span><span>${order.currency || '৳'}${total.toFixed(0)}</span>
                </div>
            </div>
        `;
    }

    return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: ${paperWidth} auto; margin: 0; }
    html, body { margin: 0; padding: 0; background-color: #ffffff; height: auto; width: ${contentWidth}; }
    body { font-family: 'SolaimanLipi', 'Arial', 'Vrinda', sans-serif; width: ${contentWidth}; margin: 0 auto; padding: 10px 5px; color: #000; font-size: 9pt; overflow: hidden; }
    .container { display: block; width: 100%; text-align: center; }
    .header { margin-bottom: 8px; text-align: center; }
    .business-name { font-size: 14pt; font-weight: bold; margin-bottom: 2px; }
    .token-line { font-size: 14pt; font-weight: bold; margin-bottom: 3px; padding-bottom: 2px; border-bottom: none; }
    .info-line { font-size: 10pt; font-weight: bold; margin: 1px 0; text-align: center; }
    .date-time-row { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 1px 0; margin: 4px 0; font-weight: bold; font-size: 8pt; }
    .footer { text-align: center; margin-top: 12px; padding-top: 4px; font-weight: bold; font-size: 10pt; }
    .footer-invoice { border-top: 1px solid #000; }
    </style></head><body><div class="container">
    ${isInvoice ? `
        <div class="header">
            <div class="business-name">${order.businessName || 'RestoKeep'}</div>
            ${order.receiptHeader ? `<div style="font-size: 8pt;">${order.receiptHeader}</div>` : `
                <div style="font-size: 8pt;">${order.businessAddress || ''}</div>
                ${order.businessPhone ? `<div style="font-size: 8pt;">Tel: ${order.businessPhone}</div>` : ''}
            `}
        </div>
    ` : ''}
    <div class="token-line">${isInvoice ? 'INVOICE' : 'Kitchen Token'}: #${order.tokenNumber || '00'}</div>
    <div class="info-line">Table No: ${order.tableNumber || 'Delivery'}</div>
    <div class="info-line">Ordered by: ${order.creatorName || 'Staff'}</div>
    <div class="date-time-row"><span>Date: ${dateStr}</span><span>Time: ${timeStr}</span></div>
    <div style="width: 100%; text-align: left;">${itemsHtml}</div>
    ${order.note ? `<div style="margin-top: 8px; padding: 4px; border: 1px dashed #000; font-style: italic; font-size: 10pt; text-align: left; font-weight: bold; background: #f9f9f9;">Note: ${order.note}</div>` : ''}
    <div class="footer ${isInvoice ? 'footer-invoice' : ''}">${isInvoice ? (order.receiptFooter || 'Thanks! Come Again') : '--- Kitchen Copy ---'}</div>
    ${isInvoice ? `
        <div style="font-size: 8pt; margin-top: 15px; text-align: center; border-top: 1px dashed #000; padding-top: 8px; font-weight: bold;">
            <div>Powered by: RestoKeep</div>
            <div style="font-size: 7pt; margin-top: 2px;">Web: restokeep.app</div>
            <div style="font-size: 7pt;">Mob: 01303565316</div>
        </div>
    ` : ''}
    </div></body></html>`;
}

function groupItems(items) {
    const grouped = [];
    if (!items || !Array.isArray(items)) return grouped;
    items.forEach(item => {
        const existing = grouped.find(i => i.itemId === item.itemId);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            grouped.push({ ...item });
        }
    });
    return grouped;
}
