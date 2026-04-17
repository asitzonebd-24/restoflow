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
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, doc, deleteDoc } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function performPrint(order, requestId, attempt = 1, startTime = Date.now()) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, `temp_${requestId}.html`);
    const pdfFilePath = filePath + '.pdf';
    const profilePath = path.join(__dirname, `profile_${requestId}`);
    
    return new Promise((resolve) => {
        const currentAge = Date.now() - startTime;
        if (currentAge > 60000) {
            console.error(`[EXPIRED] Request ${requestId} exceeded 60s limit.`);
            deletePrintRequest(requestId);
            cleanupFiles(filePath, pdfFilePath, profilePath);
            return resolve();
        }

        try {
            fs.writeFileSync(filePath, html);
            const convertCommand = `powershell -Command "$edge = (Get-ChildItem 'C:\\Program Files*\\Microsoft\\Edge\\Application\\msedge.exe' | Select-Object -First 1).FullName; if ($edge) { & \\"$edge\\" --headless=new --no-sandbox --disable-gpu --user-data-dir=\\\"${profilePath}\\\" --no-pdf-header-footer --print-to-pdf=\\\"${pdfFilePath}\\\" \\\"${filePath}\\\" } else { msedge --headless=new --no-sandbox --disable-gpu --user-data-dir=\\\"${profilePath}\\\" --no-pdf-header-footer --print-to-pdf=\\\"${pdfFilePath}\\\" \\\"${filePath}\\\" }"`;

            console.time(`job-${requestId}`);
            exec(convertCommand, { timeout: 15000 }, (err) => {
                if (err && !fs.existsSync(pdfFilePath)) {
                    console.timeEnd(`job-${requestId}`);
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
                        const printCommand = `"${sumatraPath}" -print-to "XP-80C" -silent -print-settings "noscale" "${pdfFilePath}"`;
                        exec(printCommand, { timeout: 15000 }, (fbError) => {
                            console.timeEnd(`job-${requestId}`);
                            if (!fbError) {
                                console.log(`[SUCCESS] Token: ${order.tokenNumber}`);
                                deletePrintRequest(requestId);
                            } else {
                                console.error('Printer Error:', fbError.message);
                            }
                            setTimeout(() => cleanupFiles(filePath, pdfFilePath, profilePath), 5000);
                            resolve();
                        });
                    } else if (checkAttempts > 20) {
                        clearInterval(checkFile);
                        console.timeEnd(`job-${requestId}`);
                        cleanupFiles(filePath, pdfFilePath, profilePath);
                        handleRetry(order, requestId, attempt, resolve, startTime);
                    }
                }, 500); 
            });
        } catch (err) { handleRetry(order, requestId, attempt, resolve, startTime); }
    });
}

function handleRetry(order, requestId, attempt, resolve, startTime) {
    const currentAge = Date.now() - startTime;
    if (currentAge < 60000 && attempt < 3) {
        console.log(`[RETRY] Token ${order.tokenNumber} (Attempt ${attempt + 1}/3)`);
        setTimeout(() => performPrint(order, requestId, attempt + 1, startTime).then(resolve), 2000);
    } else {
        console.error(`[ABORTED] Token ${order.tokenNumber} failed too many times or expired.`);
        deletePrintRequest(requestId);
        resolve();
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
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; font-size: 10pt; font-weight: bold; border-bottom: 1px dashed #000; padding: 4px 0; gap: 2px;">
                    <span style="flex: 1; word-break: break-word; padding-right: 5px;">${item.name}</span>
                    <span style="white-space: nowrap;">x${item.quantity}</span>
                </div>`;
        });
    }
    return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size: 80mm auto; margin: 2mm; }
    html, body { margin: 0; padding: 0; background-color: #ffffff; height: auto; width: 68mm; }
    body { font-family: 'SolaimanLipi', 'Arial', 'Vrinda', sans-serif; width: 68mm; margin: 0 auto; padding: 10px 5px 0 5px; color: #000; font-size: 10pt; overflow: hidden; }
    .container { display: block; width: 100%; text-align: center; }
    .token-line { font-size: 14pt; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .info-line { font-size: 12pt; font-weight: bold; margin: 2px 0; text-align: center; }
    .date-time-row { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding: 1px 0; margin: 4px 0; font-weight: bold; font-size: 10pt; }
    .footer { text-align: center; border-top: 1px solid #000; margin-top: 8px; padding-top: 2px; font-weight: bold; font-size: 10pt; }
    </style></head><body><div class="container">
    <div class="token-line">Kitchen Token: #${order.tokenNumber || '00'}</div>
    <div class="info-line">Table No: ${order.tableNumber || 'N/A'}</div>
    <div class="info-line">Ordered by: ${order.creatorName || 'Staff'}</div>
    <div class="date-time-row"><span>Date: ${dateStr}</span><span>Time: ${timeStr}</span></div>
    <div style="width: 100%; text-align: left;">${itemsHtml}</div>
    ${order.note ? `<div style="margin-top: 6px; padding: 3px; border: 1px dashed #000; font-style: italic; font-size: 10pt; text-align: left; font-weight: bold;">Note: ${order.note}</div>` : ''}
    <div class="footer">--- Kitchen Copy ---</div>
    </div></body></html>`;
}
