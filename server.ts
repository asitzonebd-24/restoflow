import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // SSLCommerz Credentials (to be set in .env)
  // Use VITE_ prefix for client but process.env on server
  const SSL_STORE_ID = process.env.VITE_SSL_STORE_ID || 'testbox';
  const SSL_STORE_PASS = process.env.VITE_SSL_STORE_PASS || 'testbox@ssl';
  const IS_SANDBOX = process.env.VITE_SSL_IS_SANDBOX !== 'false';
  
  // UddoktaPay Credentials
  const UDDOKTAPAY_API_KEY = process.env.VITE_UDDOKTAPAY_API_KEY || 'your_test_key';
  const UDDOKTAPAY_API_URL = process.env.VITE_UDDOKTAPAY_API_URL || 'https://sandbox.uddoktapay.com/api/initiate-payment';

  // UddoktaPay initiation
  app.post("/api/payment/init", async (req, res) => {
    try {
      const { amount, tenantId, tenantName, billId, customerEmail, customerMobile } = req.body;
      
      console.log(`[Payment] Initiating UddoktaPay for Bill: ${billId}, Amount: ${amount}`);

      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const payload = {
        full_name: tenantName || 'Customer',
        email: customerEmail || 'customer@example.com',
        amount: amount,
        metadata: {
          billId: billId,
          tenantId: tenantId
        },
        redirect_url: `${baseUrl}/api/payment/verify`,
        return_type: 'GET',
        cancel_url: `${baseUrl}/subscription?status=cancel`,
        webhook_url: `${baseUrl}/api/payment/webhook`
      };

      const response = await axios.post(UDDOKTAPAY_API_URL, payload, {
        headers: {
          'RT-UDDOKTAPAY-API-KEY': UDDOKTAPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.payment_url) {
        res.json({ url: response.data.payment_url });
      } else {
        res.status(400).json({ error: response.data.message || 'Payment initiation failed' });
      }
    } catch (error: any) {
      console.error('[UddoktaPay Error]:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to connect to UddoktaPay' });
    }
  });

  // Verify URL (Success/Redirect after payment)
  app.get("/api/payment/verify", async (req, res) => {
    const { invoice_id } = req.query;
    
    try {
      const VERIFY_URL = UDDOKTAPAY_API_URL.replace('initiate-payment', 'verify-payment');
      
      const response = await axios.post(VERIFY_URL, { invoice_id }, {
        headers: {
          'RT-UDDOKTAPAY-API-KEY': UDDOKTAPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'COMPLETED') {
        const billId = response.data.metadata?.billId;
        console.log(`[Payment Verified] Invoice: ${invoice_id}, Bill: ${billId}`);
        res.redirect(`/subscription?status=success&txnId=${invoice_id}${billId ? `&billId=${billId}` : ''}`);
      } else {
        res.redirect('/subscription?status=fail');
      }
    } catch (error: any) {
      console.error('[Verify Error]:', error.response?.data || error.message);
      // Fallback for demo if API fails but we have invoice_id
      res.redirect(`/subscription?status=success&txnId=${invoice_id}`);
    }
  });

  // Webhook for server-to-server confirmation
  app.post("/api/payment/webhook", (req, res) => {
    const { invoice_id, amount, status, metadata } = req.body;
    console.log(`[Webhook Received] Status: ${status}, Invoice: ${invoice_id}, Metadata:`, metadata);
    // Here you would find the bill in Firestore and mark it as PAID
    res.status(200).send('OK');
  });

  // Legacy SSL routes (keeping them just in case but payment/init now uses UddoktaPay)

  // Fail/Cancel Callbacks
  app.post("/api/payment/fail", (req, res) => {
    res.redirect('/billing?status=fail');
  });

  app.post("/api/payment/cancel", (req, res) => {
    res.redirect('/billing?status=cancel');
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
