// --- CONFIGURATION ---
// You can pass the Tenant ID as a command line argument: node agent.js 02
// If no argument is passed, it defaults to '01'
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
// ---------------------

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, onSnapshot, orderBy, limit, Timestamp } = require('firebase/firestore');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log('--- RestoKeep Automatic Printer Agent Starting ---');
console.log(`Target Restaurant ID: ${MY_TENANT_ID}`);
console.log('Listening for new print requests in real-time...');

// Keep track of processed requests to avoid double printing
const processedRequests = new Set();

// Listen for new print requests
// We'll start by getting the last 5 requests to see if we can connect at all
// Then we'll filter them in the code to avoid printing old ones
const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', 'in', [MY_TENANT_ID, parseInt(MY_TENANT_ID) || MY_TENANT_ID]), // Try both string and number
    orderBy('createdAt', 'desc'),
    limit(10)
);

console.log(`Connecting to Firestore listener for Tenant ID: ${MY_TENANT_ID}...`);

onSnapshot(q, (snapshot) => {
    console.log(`[${new Date().toLocaleTimeString()}] Listener update: ${snapshot.size} orders found for this tenant.`);
    
    if (snapshot.empty) {
        console.log('No orders found for this tenant. Waiting...');
    }
    
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;

            // Only process if it's new (created within the last 5 minutes)
            // This avoids printing very old orders when the agent starts
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const createdAt = request.createdAt?.toDate ? request.createdAt.toDate().getTime() : 0;

            if (!processedRequests.has(requestId)) {
                if (createdAt > fiveMinutesAgo) {
                    console.log(`\n[${new Date().toLocaleTimeString()}] New Print Request Detected!`);
                    console.log(`Order ID: ${request.orderId}`);
                    console.log(`Token: ${request.tokenNumber}`);
                    console.log(`Tenant ID in DB: ${request.tenantId} (Type: ${typeof request.tenantId})`);
                    
                    printOrder(request, requestId);
                } else {
                    console.log(`Skipping old order: ${request.orderId} (Created at: ${new Date(createdAt).toLocaleString()})`);
                }
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => {
    console.error('Firestore Listen Error:', error);
    if (error.code === 'permission-denied') {
        console.error('ERROR: Permission denied. Please check your Firestore rules.');
    } else if (error.message.includes('index')) {
        console.error('ERROR: Missing Firestore Index. Please click the link in the error message to create it.');
    }
});

function printOrder(order, requestId) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, 'temp_receipt.html');
    
    try {
        fs.writeFileSync(filePath, html);
        console.log(`Generated temporary receipt file: ${filePath}`);
        
        // Windows Print Command (Using PowerShell to print HTML)
        // We use the InternetExplorer COM object which is built into Windows 
        // and can print HTML directly without needing a file association for the 'Print' verb.
        // ExecWB(6, 2) means Print (6) with No Prompt (2).
        const printCommand = `powershell -Command "$ie = New-Object -ComObject InternetExplorer.Application; $ie.Navigate('${filePath}'); while($ie.ReadyState -ne 4){Start-Sleep -m 100}; $ie.ExecWB(6, 2); Start-Sleep -s 2; $ie.Quit()"`;
        
        console.log('Sending to default printer (Automatic Mode)...');
        exec(printCommand, (error) => {
            if (error) {
                console.error(`Print Error for Request ${requestId}:`, error);
                console.log('Attempting Fallback Print Method...');
                // Fallback: Try rundll32 if COM object fails
                const fallbackCommand = `rundll32.exe mshtml.dll,PrintHTML "${filePath}"`;
                exec(fallbackCommand, (fallbackError) => {
                    if (fallbackError) {
                        console.error('Fallback Print also failed:', fallbackError);
                    } else {
                        console.log('Fallback Print command sent.');
                    }
                });
            } else {
                console.log(`SUCCESS: Sent to printer.`);
            }
        });
    } catch (err) {
        console.error('File Write Error:', err);
    }
}

function generateReceiptHtml(order, requestId) {
    // Handle both Firestore Timestamp and ISO string
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const date = createdAt.toLocaleString();
    
    let itemsHtml = '';
    
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td style="padding: 5px 0;">${item.name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        });
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://cdn.jsdelivr.net/gh/at-shuvro/solaimanlipi-font@master/solaimanlipi.css');
            body { 
                font-family: 'SolaimanLipi', 'Courier New', Courier, monospace; 
                width: 80mm; 
                margin: 0; 
                padding: 10px; 
                font-size: 14px; 
                line-height: 1.4;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; text-align: right; border-top: 1px solid #000; padding-top: 5px; }
            .token { font-size: 24px; font-weight: bold; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2 style="margin: 0;">RestoKeep</h2>
            <div class="token">TOKEN: ${order.tokenNumber || 'N/A'}</div>
            <p style="margin: 0;">Date: ${date}</p>
        </div>
        <table>
            <thead>
                <tr style="border-bottom: 1px solid #000;">
                    <th style="text-align: left;">Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="footer">
            <p>Powered By: RestoKeep</p>
        </div>
    </body>
    </html>
    `;
}
