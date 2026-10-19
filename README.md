# DigiKarya — Marketplace Produk Digital

Paket ini berisi landing page, dashboard penjual, knowledge base, dan backend kecil untuk membuat token pembayaran Midtrans Snap Sandbox.

## Isi paket

- `index.html` — Landing page responsif, katalog produk, modal checkout, dan pemanggilan Snap.js.
- `dashboard.html` — Dashboard penjual responsif dengan Chart.js, kartu ringkasan, grafik, dan pencarian transaksi.
- `knowledge-base.md` — Knowledge base berbahasa Indonesia sesuai struktur yang diminta.
- `server.js` — Endpoint aman untuk membuat token transaksi Snap Sandbox.
- `.env.example` — Template environment variable backend.
- `package.json` — Dependensi backend.

## Cara menjalankan

1. Pastikan Node.js versi 18 atau lebih baru sudah terpasang.
2. Buka terminal pada folder proyek, kemudian jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`.
4. Isi `MIDTRANS_SERVER_KEY` di `.env` memakai **Server Key Sandbox** dari dashboard Midtrans. Jangan menaruh Server Key di file HTML, repository publik, atau browser.
5. Buka `index.html`, lalu ganti nilai `data-client-key` pada tag Snap.js dengan **Client Key Sandbox** Anda:

   ```html
   <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="GANTI_DENGAN_CLIENT_KEY_SANDBOX" defer></script>
   ```

6. Jalankan `npm start`.
7. Buka `http://localhost:3000` untuk landing page atau `http://localhost:3000/dashboard.html` untuk dashboard.
8. Uji pembayaran dengan kredensial dan metode uji Sandbox yang disediakan pada akun Midtrans Anda.

## Catatan integrasi pembayaran

Halaman checkout membuat Order ID `DE-` + timestamp, lalu mengirim ID produk, email, dan nomor HP ke `/api/create-transaction`. Backend memvalidasi masukan, menentukan harga dari katalog server, dan mengirim `transaction_details`, `item_details`, serta `customer_details` ke endpoint Snap Sandbox. Token yang diterima diteruskan ke `window.snap.pay(token)`.

Permintaan untuk membuat token Snap memerlukan Server Key melalui autentikasi Basic. Karena itu, implementasi ini **tidak** mengirim Server Key dari browser dan **tidak** menggunakan CORS proxy publik. Browser hanya menggunakan Client Key pada Snap.js, sedangkan Server Key disimpan di `.env` backend. Dokumentasi: https://docs.midtrans.com/docs/snap-snap-integration-guide dan https://docs.midtrans.com/docs/api-authorization-headers.

Status yang ditampilkan oleh callback Snap pada frontend hanya untuk pengalaman pengguna. Untuk sistem produksi, implementasikan notifikasi/webhook Midtrans dan verifikasi status transaksi di backend sebelum memberikan akses produk.

## Catatan halaman

- Kedua halaman HTML masing-masing menyimpan CSS dalam `<style>` dan JavaScript inline.
- Grafik dashboard menggunakan CDN Chart.js; Snap.js juga dimuat dari sandbox Midtrans. Koneksi internet diperlukan untuk memuat pustaka eksternal.
- Dashboard menggunakan data transaksi dan ringkasan lokal untuk tampilan UI. Data tersebut perlu diganti dengan API jika dashboard digunakan secara nyata.
- Nama merek, harga, dan konten produk dapat diedit sesuai kebutuhan.
