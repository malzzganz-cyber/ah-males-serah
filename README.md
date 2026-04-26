# 🚀 Malzz Nokos

Aplikasi web fullstack untuk membeli **nomor virtual** & menerima **OTP otomatis**, terintegrasi dengan API **RumahOTP**.

Built with **Next.js 14 (App Router) + TypeScript + Firebase + Tailwind + Framer Motion**.

> Developer: **Malzz**

---

## ✨ Fitur

- 🔐 Auth Firebase (Email + Password)
- 💰 Deposit QRIS otomatis (polling status)
- 📱 Order nomor virtual (Service → Country → Operator → Number)
- 📩 OTP real-time (polling 60 detik)
- 📊 Statistik real dari Firestore (Users, Transaksi, Order)
- 💬 Sistem Testimoni & Rating
- 🖼️ Foto profil privat (Firebase Storage)
- 🛡️ Mode Admin (Withdraw H2H + Saldo Vendor)
- 🎨 Mobile-first UI (max-width 420px) + animasi premium

---

## ⚙️ 1. Setup Environment

Salin file env contoh:

```bash
cp .env.local.example .env.local
```

Lalu isi semua variabel berikut:

```env
# RumahOTP
RUMAHOTP_API_KEY=isi_apikey_rumahotp_kamu

# UID admin (lihat di Firebase Auth > Users)
ADMIN_UID=isi_uid_admin

# Firebase (dari Project Settings > General > Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🔥 2. Setup Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/).
2. **Authentication** → enable provider **Email/Password**.
3. **Firestore Database** → buat database (mode production).
4. **Storage** → enable storage.

### 🔒 Firestore Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users — only owner can write, anyone authenticated can read counts
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == uid;
    }

    // orders — only owner
    match /orders/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    // transactions — only owner
    match /transactions/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }

    // withdraws — admin only (enforce by your ADMIN_UID)
    match /withdraws/{id} {
      allow read, create: if request.auth != null;
    }

    // testimonials — anyone can read, only authenticated user can create
    match /testimonials/{id} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

### 🔒 Storage Rules (Foto Profil PRIVATE)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

> ⚠️ Aturan ini **wajib** agar foto profil hanya bisa dilihat user pemiliknya.

---

## 💻 3. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 🚀 4. Deploy ke Vercel

1. Push project ini ke GitHub (pastikan **isi** folder `malzz-nokos/` ada di root repository, bukan folder `malzz-nokos/` sendiri di dalam repo. `package.json` HARUS di root repo).
2. Login di [vercel.com](https://vercel.com), klik **New Project**.
3. Import repository. Vercel akan auto-detect **Next.js**.
4. Tambahkan **Environment Variables** (semua yang ada di `.env.local`).
5. Deploy → selesai. ✅

### ⚠️ Kalau API Route Error 404 di Vercel

- Pastikan `package.json`, `next.config.js`, dan folder `app/` **berada di root repository**, bukan di subfolder.
- Jangan set Framework Preset ke "Other" — biarkan **Next.js**.
- Pastikan tidak ada `output: 'export'` di `next.config.js` (sudah benar di sini).
- Setelah ubah env, klik **Redeploy** (bukan cuma save).

---

## 🛡️ Admin

Untuk menjadi admin:

1. Daftar akun seperti biasa di aplikasi.
2. Buka Firebase Console → Authentication → copy **UID** akunmu.
3. Tempel ke `ADMIN_UID` di Vercel Environment Variables → **Redeploy**.
4. Login → menu **Admin** muncul di bottom navbar.

Admin bisa akses:

- `/admin/withdraw` → buat withdraw H2H
- `/admin/balance` → cek saldo vendor RumahOTP

---

## 📡 API Routes (Internal — apikey aman di backend)

| Endpoint                       | Deskripsi                       |
| ------------------------------ | ------------------------------- |
| `GET /api/services`            | List service nokos              |
| `GET /api/countries`           | List negara per service         |
| `GET /api/operators`           | List operator per negara        |
| `GET /api/order`               | Buat order nokos                |
| `GET /api/order-status`        | Cek OTP / status order          |
| `GET /api/order-cancel`        | Cancel order                    |
| `GET /api/deposit-create`      | Buat QRIS                       |
| `GET /api/deposit-status`      | Cek status pembayaran           |
| `GET /api/deposit-cancel`      | Cancel deposit                  |
| `GET /api/h2h-product`         | List produk H2H                 |
| `GET /api/h2h-list-rekening`   | List bank/e-wallet              |
| `GET /api/h2h-check-rekening`  | Cek nama pemilik rekening       |
| `GET /api/h2h-create`          | Buat transaksi withdraw         |
| `GET /api/h2h-status`          | Cek status withdraw             |
| `GET /api/admin-balance`       | Saldo vendor RumahOTP           |
| `GET /api/admin-uid`           | Mengirim ADMIN_UID ke client    |

---

## 💸 Markup Harga

| Harga RumahOTP | Markup |
| -------------- | ------ |
| ≤ 15.000       | +500   |
| > 15.000       | +1.000 |

---

## 📞 Support

WhatsApp: [+62 889-8087-3712](https://wa.me/6288980873712)

---

© Malzz · Powered by RumahOTP
