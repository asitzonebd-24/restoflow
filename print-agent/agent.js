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
// We use a timestamp to only get requests created AFTER the agent starts
const startTime = Timestamp.now();

const printRequestsRef = collection(db, 'print_requests');
const q = query(
    printRequestsRef, 
    where('tenantId', '==', MY_TENANT_ID),
    where('createdAt', '>=', startTime),
    orderBy('createdAt', 'desc'),
    limit(5)
);

onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
        console.log('Waiting for new orders...');
    }
    
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const request = change.doc.data();
            const requestId = change.doc.id;

            if (!processedRequests.has(requestId)) {
                console.log(`\n[${new Date().toLocaleTimeString()}] New Print Request Detected!`);
                console.log(`Order ID: ${request.orderId}`);
                console.log(`Token: ${request.tokenNumber}`);
                
                printOrder(request, requestId);
                processedRequests.add(requestId);
            }
        }
    });
}, (error) => {
    console.error('Firestore Listen Error:', error);
    if (error.code === 'permission-denied') {
        console.error('ERROR: Permission denied. Please check your Firestore rules.');
    }
});

function printOrder(order, requestId) {
    const html = generateReceiptHtml(order, requestId);
    const filePath = path.join(__dirname, 'temp_receipt.html');
    
    try {
        fs.writeFileSync(filePath, html);
        console.log(`Generated temporary receipt file: ${filePath}`);
        
        // Windows Print Command (Using PowerShell to print HTML)
        // This command opens the HTML file and sends it to the default printer
        const printCommand = `powershell -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
        
        console.log('Sending to default printer...');
        exec(printCommand, (error) => {
            if (error) {
                console.error(`Print Error for Request ${requestId}:`, error);
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
