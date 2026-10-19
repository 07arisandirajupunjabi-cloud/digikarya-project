'use strict';

/**
 * Backend minimal untuk membuat token Midtrans Snap Sandbox.
 * Server Key wajib tersimpan di environment (.env), tidak di HTML/browser.
 * Jalankan dengan Node.js 18+ agar fetch tersedia secara native.
 */
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MIDTRANS_ENDPOINT = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

// Katalog tepercaya di server: jangan percaya nominal harga yang dikirim browser.
const PRODUCTS = Object.freeze({
  'ebook-kopi': { id: 'ebook-kopi', name: 'E-book Strategi Bisnis Kopi', price: 49000 },
  'template-konten': { id: 'template-konten', name: 'Template Promosi Keripik', price: 35000 },
  'paket-kuliner': { id: 'paket-kuliner', name: 'Paket Konten UMKM Kuliner', price: 89000 }
});

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard.html', (_req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/create-transaction', async (req, res) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return res.status(503).json({ message: 'Backend belum dikonfigurasi. Tambahkan MIDTRANS_SERVER_KEY Sandbox ke file .env.' });
  }

  const { order_id: orderId, product_id: productId, email, phone } = req.body || {};
  const product = PRODUCTS[productId];
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

  // Order ID mengikuti format frontend DE- + timestamp. Server tetap memvalidasi formatnya.
  if (typeof orderId !== 'string' || !/^DE-\d{10,}$/.test(orderId) || orderId.length > 50) {
    return res.status(400).json({ message: 'Order ID tidak valid. Silakan tutup checkout lalu buka kembali.' });
  }
  if (!product) return res.status(400).json({ message: 'Produk tidak ditemukan. Muat ulang halaman dan pilih produk kembali.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 180) {
    return res.status(400).json({ message: 'Alamat email tidak valid.' });
  }
  if (!/^[0-9+() .-]{8,20}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'Nomor HP tidak valid.' });
  }

  const transactionPayload = {
    transaction_details: { order_id: orderId, gross_amount: product.price },
    item_details: [{ id: product.id, price: product.price, quantity: 1, name: product.name }],
    customer_details: { email: cleanEmail, phone: cleanPhone }
  };

  try {
    const authorization = Buffer.from(`${serverKey}:`, 'utf8').toString('base64');
    const midtransResponse = await fetch(MIDTRANS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authorization}`
      },
      body: JSON.stringify(transactionPayload),
      signal: AbortSignal.timeout(15000)
    });
    const data = await midtransResponse.json().catch(() => ({}));

    if (!midtransResponse.ok || !data.token) {
      // Detail respons dicatat hanya di server untuk diagnosis; kredensial tidak dikirim ke browser.
      console.error('Midtrans Snap response error:', midtransResponse.status, data);
      return res.status(502).json({ message: 'Penyedia pembayaran belum dapat membuat transaksi. Periksa konfigurasi Sandbox dan coba kembali.' });
    }

    return res.status(201).json({ token: data.token, redirect_url: data.redirect_url || null, order_id: orderId });
  } catch (error) {
    console.error('Midtrans connection error:', error.message);
    return res.status(502).json({ message: 'Tidak dapat terhubung ke penyedia pembayaran. Periksa koneksi server dan coba kembali.' });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ message: 'Format permintaan tidak valid.' });
  console.error('Unexpected server error:', err.message);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`DigiKarya berjalan di http://localhost:${PORT}`);
  console.log('Mode pembayaran: Midtrans Sandbox');
});
