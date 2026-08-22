# MASTER PROMPT — Platform Undangan Pernikahan Digital (Multi‑Tenant)

> Prompt ini ditujukan untuk **AI coding agent** (mis. Claude Code, Cursor, dsb.) yang akan membangun sebuah platform undangan pernikahan digital berkapasitas setara atau lebih tinggi dari provider komersial Indonesia (Viding, MarryIO, Tibra, LoveLink, Digitalove, einvite, WeddingPress), namun dengan arsitektur yang **efisien, modern, dan dapat diskalakan**.
>
> Hasil riset terhadap provider tersebut sudah diringkas dan diterjemahkan menjadi spesifikasi di bawah ini. Agent **tidak perlu** meriset ulang; cukup eksekusi spesifikasi ini.

---

## 0. Cara Memakai Prompt Ini

- Perlakukan dokumen ini sebagai **PRD + spesifikasi teknis + acceptance criteria** sekaligus.
- Bangun secara **bertahap mengikuti Milestone di Bagian 16**. Jangan langsung menulis seluruh aplikasi sekaligus; selesaikan satu milestone, pastikan lolos acceptance criteria, baru lanjut.
- Setiap kali ragu pada keputusan desain, pilih opsi yang: (1) paling sederhana untuk dirawat, (2) paling cepat saat banyak tamu membuka undangan bersamaan, (3) paling ramah biaya hosting.
- Output akhir harus **berjalan** (runnable) dengan satu perintah `docker compose up` + migrasi + seed.

---

## 1. Tujuan & Ruang Lingkup

Bangun **SaaS multi‑tenant** di mana:

1. **Pasangan / operator (wedding organizer)** mendaftar, membuat satu atau lebih undangan, mengisi konten lewat editor, memilih template, mengelola daftar tamu, lalu menyebar **link personal per tamu**.
2. **Tamu** membuka link berisi namanya sendiri, melihat undangan yang cantik & beranimasi, lalu bisa **RSVP**, menulis **ucapan/doa**, dan melihat **amplop digital**.
3. Sistem mendukung **ribuan tamu membuka undangan yang sama secara bersamaan** tanpa down (target: undangan publik di-render seefisien mungkin, idealnya statis/cache‑able).

**Di luar ruang lingkup MVP** (boleh jadi fase lanjutan): pembayaran langganan, marketplace template pihak ketiga, white‑label kustom domain otomatis.

---

## 2. Persona & Peran Sistem (RBAC)

| Peran | Kemampuan |
|---|---|
| `superadmin` (**Pemilik Platform**) | Kamu, pemilik bisnis. Akses konsol platform: pantau kondisi sistem, jumlah end user, kelola paket & harga, moderasi, feature flags, billing. Lihat Bagian 21. |
| `customer`/`end_user` (**Calon Pengantin** — pelanggan berbayar) | Mendaftar, memilih paket, membuat & mengelola undangan. Ini "tenant". Dulu disebut owner/operator. |
| `editor` | Diundang end user untuk membantu mengedit satu undangan (mis. keluarga/WO). |
| `guest` (**Tamu**) | Tidak login. Akses undangan via link personal (atau PIN bila private). |

**Klarifikasi terminologi (wajib dipatuhi konsisten):** "Pemilik platform / superadmin" = pemilik bisnis. "End user / customer / calon pengantin" = pelanggan yang membayar untuk membuat undangan = **tenant**. "Tamu" = penerima undangan. Di mana pun dokumen lama menyebut `owner`/`operator` sebagai pembuat undangan, maknanya kini adalah **end_user/customer**.

Tenant = **akun end user (calon pengantin)**. Setiap undangan (`invitation`) terikat pada satu tenant. Isolasi data antar‑tenant wajib (semua query difilter `tenant_id`).

---

## 3. Rekomendasi Tech Stack (dengan alasan efisiensi)

Pilih stack berikut kecuali ada alasan kuat untuk menyimpang. Justifikasi: ekosistem matang, satu bahasa (TypeScript) untuk frontend+backend, dan halaman publik bisa di‑render statis/ISR sehingga **murah & tahan beban**.

| Layer | Pilihan utama | Alasan |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG/ISR dalam satu framework; halaman tamu bisa di‑cache di edge. |
| Bahasa | **TypeScript (strict)** | Satu bahasa lintas stack, aman tipe. |
| Database | **PostgreSQL 16 + Drizzle ORM** | Relasional, JSONB untuk konfigurasi fleksibel, migrasi yang ringkas. |
| Cache/Queue | **Redis + BullMQ** | Rate‑limit, cache render, antrian WhatsApp blast & email. |
| Object storage | **S3‑compatible (MinIO untuk self‑host / Cloudflare R2 untuk produksi)** | Simpan foto galeri, musik, QR. CDN‑friendly. |
| Auth | **Better Auth** (atau Auth.js) | Email/password + OAuth, session aman. |
| UI | **Tailwind CSS + shadcn/ui** | Komponen konsisten, dev cepat. |
| Animasi | **Framer Motion** + GSAP (scroll) | Animasi cover, reveal, parallax. |
| Validasi | **Zod** | Schema tunggal dipakai server & client. |
| Payment | **Xendit** atau **Midtrans** (QRIS dinamis, VA, e‑wallet) + **Disbursement** (Xendit Disbursement / Midtrans Iris) | Amplop digital transaksional + penyaluran dana ke pasangan. |
| Monorepo | **Turborepo + pnpm workspaces** | Pisahkan template, ui, db, shared. |
| Lint/format | **Biome** atau ESLint+Prettier | Konsistensi kode. |
| Deploy | **Docker Compose** (self‑host) atau Vercel + managed Postgres | Sekali deploy, jalan selamanya. |

**Alternatif lebih ringan** (jika tidak butuh multi‑tenant penuh / target satu undangan per deploy): **Astro + React islands + SQLite/Turso + Tailwind**. Pilih ini jika prioritasnya adalah bundel JS sekecil mungkin dan hosting paling murah.

---

## 4. Arsitektur Sistem

Gunakan **monorepo**:

```
apps/
  web/                 → Next.js: dashboard (privat) + halaman undangan publik + route API
packages/
  db/                  → Drizzle schema + migrations + seed
  ui/                  → komponen shadcn/ui bersama
  shared/              → types, util, konstanta, schema Zod
  templates/           → template undangan (React components, theme-driven)
  messaging/           → adapter WhatsApp & SMTP/email
  storage/             → abstraksi S3/MinIO/R2
  ai/                  → (opsional) generasi konten/desain via LLM
docker/
  docker-compose.dev.yml
  docker-compose.yml
  Dockerfile
```

**Pemisahan dua "dunia" dalam `apps/web`:**

- **Zona privat** (`/dashboard/**`, `/api/**`): butuh autentikasi, SSR dinamis, koneksi DB.
- **Zona publik** (`/[invitationSlug]`): **se‑statis mungkin**. Data undangan diambil saat build/ISR; interaksi tamu (RSVP, ucapan) lewat route API ringan yang menulis ke DB lewat antrian/rate‑limit. Cache halaman per‑slug; revalidasi saat owner mengedit.

---

## 5. Model Data (Skema Database)

Implementasikan dengan Drizzle. Semua tabel multi‑tenant memiliki `tenant_id`. Gunakan `uuid` sebagai PK, timestamps (`created_at`, `updated_at`), dan soft‑delete bila relevan.

**`users`** — id, email (unik), password_hash, name, role, created_at.

**`tenants`** — id, owner_user_id, name, plan, created_at. (Untuk model sederhana, tenant bisa = user.)

**`invitations`** — id, tenant_id, **slug** (unik global, mis. `syahrul-dan-ani`), status (`draft`|`active`|`archived`), template_id, **theme** (JSONB: warna, font, dsb.), **locale** (`id`|`en`|`ar`|`jv`|`su`), **religion** (`islam`|`kristen`|`katolik`|`hindu`|`buddha`|`umum`), is_private (bool), pin (nullable), music_url, cover_image_url, published_at, created_at.

**`couples`** (1‑1 ke invitation) — invitation_id, groom_full_name, groom_nickname, groom_child_order, groom_father, groom_mother, groom_photo_url, groom_instagram, bride_* (field cermin), order_display (`groom_first`|`bride_first`).

**`events`** (1‑N) — id, invitation_id, type (`akad`|`resepsi`|`pengajian`|`unduh_mantu`|custom), title, start_at (tz‑aware), end_at, venue_name, venue_address, maps_url, maps_embed, livestream_url, dress_code, note.

**`stories`** (1‑N, love story/timeline) — id, invitation_id, date, title, body, image_url, order_index.

**`gallery_items`** (1‑N) — id, invitation_id, type (`image`|`video`), url, thumbnail_url, caption, order_index, layout_hint (`masonry`|`carousel`|`polaroid`).

**`guests`** (1‑N) — id, invitation_id, tenant_id, name (mis. "Bapak Agus & Istri"), slug_token (token unik pendek untuk link aman, opsional), phone (E.164, nullable), category (`vip`|`keluarga`|`teman`|`kantor`), group_label, sent_status (`pending`|`sent`|`opened`), opened_at, created_at.

**`rsvps`** (1‑N) — id, invitation_id, guest_id (nullable jika tamu anonim), name, attendance (`yes`|`no`|`maybe`), headcount (int), message (nullable), created_at, ip_hash, user_agent.

**`wishes`** (buku tamu / ucapan & doa) — id, invitation_id, guest_id (nullable), name, message, is_approved (bool, default sesuai setting moderasi), likes (int), created_at, ip_hash.

**`gifts`** (amplop digital — tampilan statis, tetap didukung sebagai fallback) — id, invitation_id, type (`bank`|`ewallet`|`qris_static`|`physical_address`), label (mis. "BCA"), account_name, account_number, qris_image_url, address_text, order_index.

**`payment_accounts`** (rekening tujuan dana pasangan untuk disbursement) — id, tenant_id, invitation_id, holder_name, bank_code, account_number, account_name_verified (bool, hasil name‑validation gateway), kyc_status (`pending`|`verified`|`rejected`), gateway_recipient_id (id sub‑account/recipient di gateway), created_at. *Wajib untuk amplop digital transaksional.*

**`transactions`** (amplop digital via gateway) — id, invitation_id, tenant_id, guest_id (nullable), gateway (`xendit`|`midtrans`|`doku`), gateway_ref (id invoice/charge di gateway), method (`qris`|`va`|`ewallet`|`card`), amount (int, rupiah), fee (int), net_amount (int), status (`pending`|`paid`|`expired`|`failed`|`refunded`), sender_name, message (nullable), paid_at, expires_at, idempotency_key (unik), raw_payload (JSONB), created_at.

**`disbursements`** (penyaluran dana terkumpul ke `payment_accounts` pasangan) — id, invitation_id, payment_account_id, gateway_disbursement_ref, amount, fee, status (`queued`|`processing`|`completed`|`failed`), batch_id (nullable), requested_at, completed_at. *Catat juga saldo terkumpul vs tersalurkan per undangan.*

**`webhook_events`** (audit & idempotensi callback gateway) — id, gateway, event_type, gateway_ref, signature_valid (bool), processed (bool), payload (JSONB), received_at. Cegah pemrosesan ganda lewat unik (`gateway`,`gateway_ref`,`event_type`).

**`templates`** — id, name, slug, preview_image, default_theme (JSONB), is_active. (Komponen render ada di `packages/templates`, baris DB hanya metadata.)

**`analytics_events`** — id, invitation_id, guest_id (nullable), type (`open`|`rsvp`|`wish`|`share`|`gift_view`), referrer, ts, ip_hash, geo (opsional).

> **Privasi:** simpan `ip_hash` (hash bergaram), bukan IP mentah. Nomor HP tamu tidak boleh keluar ke pihak ketiga.

---

## 6. Strategi URL & Slug (inti diferensiasi)

Terdapat **dua lapis** identitas, tiru praktik provider lalu rapikan:

### 6.1 Slug undangan (identitas pasangan)
```
https://domain.id/{invitationSlug}
contoh: https://domain.id/syahrul-dan-ani
```
- `invitationSlug` di‑generate dari nama mempelai (kebab‑case), **unik global**, divalidasi (regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`), dan bisa diedit owner selama belum dipakai.
- Halaman ini di‑render via **ISR/SSG** dan di‑cache; itu yang membuatnya tahan dibuka ribuan tamu sekaligus.

### 6.2 Personalisasi penerima (nama tamu)
Dukung **dua mode**, dengan mode token sebagai default yang lebih aman:

**Mode A — Query param `to` (kompatibel, mudah dibagikan):**
```
https://domain.id/syahrul-dan-ani?to=Bapak+Agus+Suhendar+%26+Istri
```
- Aturan encoding: spasi → `+` atau `%20`; karakter `& ? #` harus di‑`encodeURIComponent`. Jangan pernah memasukkan karakter mentah yang merusak URL.
- Server membaca `to`, melakukan **sanitasi & decode**, menampilkannya di cover ("Kepada Yth. {nama}"). Jika `to` kosong → tampilkan fallback netral ("Tamu Undangan").
- **Wajib escape output** untuk cegah XSS (tampilkan sebagai teks, bukan HTML).

**Mode B — Token per tamu (direkomendasikan untuk fitur lanjutan):**
```
https://domain.id/syahrul-dan-ani/g/{slug_token}
contoh: https://domain.id/syahrul-dan-ani/g/k7Qf2a
```
- `slug_token` memetakan ke baris `guests`, sehingga sistem tahu **siapa** yang membuka (untuk analitik open‑rate, pre‑fill RSVP, QR check‑in). Lebih aman karena nama tidak terekspos di URL mentah dan tidak bisa diutak‑atik sembarangan.

### 6.3 Undangan privat (opsional)
- Jika `is_private = true`: tamu yang tokennya tidak terdaftar harus memasukkan **PIN** sebelum konten tampil. Tamu terdaftar (mode B) lewat tanpa PIN.

### 6.4 Generator link & WhatsApp
- Sediakan util `buildGuestLink(invitationSlug, guest)` dan `buildWhatsAppMessage(template, guest, link)` dengan placeholder `{nama}`, `{link}`.
- Sediakan **bulk generator**: import CSV daftar tamu → hasilkan satu link personal + satu draft pesan WA per tamu → ekspor CSV / salin semua. (Tiru fitur yang umum di provider, tapi jadikan bagian dari dashboard, bukan tool terpisah.)

---

## 7. Anatomi Konten Undangan (section‑by‑section)

Render halaman publik sebagai urutan section berikut (urutan & visibilitas bisa diatur per template/owner). Semua teks dan media berasal dari data di Bagian 5.

1. **Cover / Pembuka** — foto utama, nama pasangan, tanggal, dan **sapaan personal nama tamu**. Tombol "Buka Undangan". Sebelum dibuka, konten lain disembunyikan (lihat 9.1).
2. **Pembuka / Quote** — ayat/kutipan sesuai `religion` & `locale` (auto‑sesuaikan).
3. **Profil Mempelai** — foto, nama lengkap & panggilan, urutan anak ("Putra/Putri ke‑N dari …"), nama kedua orang tua, tautan Instagram. Tampil berdampingan, urutan mengikuti `order_display`.
4. **Detail Acara** — untuk tiap `event`: judul (Akad/Resepsi/…), tanggal, jam mulai–selesai, nama & alamat venue, tombol **"Lihat Lokasi" → Google Maps**, embed peta, **dress code**, dan **link livestream** bila ada.
5. **Countdown** — hitung mundur otomatis ke `start_at` acara utama; tombol **"Simpan ke Kalender" (Google Calendar / .ics)**.
6. **Galeri** — foto/video prewedding; layout `masonry`/`carousel`/`polaroid`; lightbox.
7. **Love Story / Timeline** — daftar `stories` terurut.
8. **RSVP** — form: nama (pre‑fill bila mode token), kehadiran (hadir/tidak/ragu), jumlah orang, pesan opsional. Submit < ~10 detik, beri konfirmasi sukses.
9. **Buku Tamu (Ucapan & Doa)** — tampilkan `wishes` yang sudah disetujui (jika moderasi aktif), form kirim ucapan, tombol **like**. Ucapan baru muncul setelah dikirim (atau menunggu moderasi).
10. **Amplop Digital / Wedding Gift (transaksional)** — tamu memilih nominal + nama + pesan, lalu sistem membuat **transaksi via payment gateway**: tampilkan **QRIS dinamis / Virtual Account / deeplink e‑wallet**, tunggu konfirmasi pembayaran (webhook), tampilkan status sukses. Dana terkumpul lalu **disalurkan (disbursement)** ke rekening pasangan. Tetap sediakan **mode statis** (salin nomor rekening + QRIS gambar + alamat kirim kado fisik) sebagai fallback bila gateway tidak diaktifkan.
11. **Musik Latar** — pemutar yang autoplay **setelah** tamu menekan "Buka Undangan" (lihat 9.2), dengan tombol mute.
12. **Penutup** — ucapan terima kasih, **hashtag pernikahan**, kontak, dan doa sesuai agama.
13. **Footer / Credit** — nama pasangan + link platform (bisa di‑white‑label).

---

## 8. Sistem Kustomisasi & Theming

Kustomisasi harus **data‑driven**, bukan duplikasi kode per pasangan.

- **Template** = komponen React di `packages/templates` yang menerima `invitationData` + `theme` dan merender section. Tambah template baru = tambah satu folder, tanpa menyentuh logika inti.
- **Theme tokens** (disimpan di `invitations.theme` JSONB): `--color-primary`, `--color-accent`, `--color-bg`, `font-heading`, `font-body`, `radius`, `pattern`. Editor menyediakan palet siap pakai + kustom.
- **Adaptasi agama & bahasa**: kamus teks (salam pembuka, ayat, doa penutup) dipilih berdasarkan `religion` + `locale`. Saat owner mengubah pilihan, teks default ikut berubah; owner tetap bisa override manual.
- **Toggle visibilitas section**: owner bisa menyalakan/mematikan section (mis. tanpa livestream, tanpa amplop).
- **Preview real‑time**: editor menampilkan pratinjau sebelum publish (status `draft`).

---

## 9. Perilaku Halaman Publik Undangan

### 9.1 Gate "Buka Undangan"
- Saat dimuat, hanya cover yang tampil. Section lain di‑lazy‑load/disembunyikan sampai tamu menekan tombol. Ini juga **trigger** yang dibutuhkan agar autoplay audio diizinkan browser.

### 9.2 Musik
- Audio **tidak** boleh autoplay sebelum interaksi (kebijakan browser). Mulai musik tepat saat tombol "Buka" ditekan. Sediakan kontrol play/pause/mute yang selalu terlihat.

### 9.3 Animasi & performa
- Reveal on scroll (Framer Motion/GSAP), parallax ringan, confetti opsional di cover.
- Target **Lighthouse ≥ 90** (Performance, Best Practices, SEO). Optimasi gambar (next/image, ukuran responsif, lazy), preload font kritis, hindari JS berlebih di section awal.
- Halaman tamu harus tetap berfungsi baik di koneksi lambat dan perangkat low‑end (mayoritas tamu via HP).

### 9.4 Share & SEO sosial
- **Open Graph & Twitter Card** dinamis per undangan (judul "Pernikahan A & B", deskripsi, gambar cover) agar pratinjau cantik saat dibagikan di WhatsApp/IG.
- Tombol share langsung ke WhatsApp dengan pesan + link personal.

---

## 10. Dashboard Pengelola (Owner/Operator)

- **Auth**: daftar/masuk (email+password, OAuth opsional), reset password.
- **Daftar undangan**: status (draft/active/archived), tombol buat baru.
- **Editor undangan** berbasis form bertahap (wizard): data mempelai → acara → galeri → story → tema/template → amplop → musik → setting (slug, privasi, moderasi, bahasa, agama). Validasi Zod, autosave.
- **Pratinjau** sebelum publish; tombol publish mengubah status ke `active` dan merevalidasi cache halaman publik.
- **Analitik**: jumlah open, RSVP (hadir/tidak/ragu + total headcount), jumlah ucapan, grafik tren waktu, sumber kunjungan.

---

## 11. Manajemen Tamu, WhatsApp Blast, QR Check‑in

- **Import tamu**: ketik manual atau unggah **CSV/Excel** (kolom: nama, no. HP, kategori, grup). Validasi & dedup.
- **Generate link personal** otomatis per tamu (mode token by default).
- **Draft pesan WA** per tamu dengan template & placeholder; tombol "Kirim via WA" (buka `wa.me`) atau **blast** lewat WhatsApp Cloud API (antrian BullMQ, hormati rate‑limit & opt‑in). Tandai `sent_status`.
- **Tracking open‑rate** via mode token.
- **QR check‑in (PWA, fase lanjutan)**: tiap tamu punya QR; panitia scan di pintu untuk menandai kehadiran, bekerja **offline‑first** lalu sinkron. Welcome notification opsional.

---

## 11A. Pembayaran: Amplop Digital Transaksional & Monetisasi SaaS

Karena targetnya **SaaS penuh** dengan **payment gateway nyata**, ada dua aliran uang yang berbeda. Pisahkan keduanya secara jelas.

### 11A.1 Amplop digital (tamu → pasangan)
Alur: tamu pilih nominal → server buat transaksi di gateway (idempotency_key) → gateway kembalikan **QRIS dinamis / VA / e‑wallet** → tamu bayar → **webhook** masuk → verifikasi **signature** → update `transactions.status = paid` (idempoten via `webhook_events`) → catat saldo terkumpul → tampilkan sukses ke tamu & notifikasi ke owner.

- **Disbursement**: saldo bersih (amount − fee) disalurkan ke `payment_accounts` pasangan (otomatis terjadwal atau manual dari dashboard). Catat di `disbursements`.
- **Webhook wajib**: idempoten, verifikasi signature, balas cepat (2xx) lalu proses async via BullMQ. Simpan semua callback di `webhook_events` untuk audit.
- **Rekonsiliasi**: dashboard owner menampilkan total masuk, fee, tersalurkan, dan saldo tertahan — angka harus cocok dengan dashboard gateway.

> ⚠️ **Penting (kepatuhan/legal):** saat platform menjadi perantara aliran dana dari tamu ke pasangan, ini menyentuh ranah jasa pembayaran. Konsekuensinya: (a) penerima (`payment_accounts`) umumnya harus melewati **KYC/name‑validation** gateway sebelum bisa menerima disbursement; (b) ada implikasi regulasi (di Indonesia: ketentuan PJP/BI dan aggregator). Mitigasi paling aman: **gunakan aggregator (Xendit/Midtrans) yang menangani lisensi**, dan jadikan platform hanya sebagai integrator — jangan menahan/mengelola dana nasabah secara mandiri. Agent harus mengimplementasikan KYC penerima dan menandai undangan yang `payment_accounts.kyc_status != verified` sehingga amplop transaksionalnya nonaktif (jatuh ke mode statis).

### 11A.2 Monetisasi platform (owner → platform) — opsional MVP+
Untuk SaaS: tagihkan owner per undangan / paket langganan. Tabel ringkas: `plans` (nama, harga, kuota undangan/tamu/fitur) dan `subscriptions` (tenant_id, plan_id, status, period). Gunakan gateway yang sama untuk checkout langganan. Pisahkan tegas dari aliran amplop digital.

---

## 12. Fitur AI (opsional, fase lanjutan)

- **Generate konten**: dari deskripsi singkat (nama, tanggal, vibe), AI menyusun draft love story, kata pengantar, dan caption galeri (LLM ringan, mis. Claude Haiku).
- **Generate desain/tema**: sarankan palet warna & font dari foto prewedding atau deskripsi tema.
- Semua output AI **harus bisa diedit** owner; jangan publish otomatis.

---

## 13. Performa, SEO, PWA, Aksesibilitas

- ISR/SSG untuk halaman tamu; revalidate on‑demand saat owner mengedit.
- CDN untuk media; kompres gambar (WebP/AVIF), audio (streaming/ranged).
- PWA: installable, offline shell untuk halaman undangan yang sudah dibuka, dan untuk modul check‑in.
- Aksesibilitas: kontras cukup, `alt` pada gambar, fokus keyboard, `prefers-reduced-motion` untuk menonaktifkan animasi berat.

---

## 14. Keamanan & Privasi

- Isolasi tenant ketat (setiap query difilter `tenant_id`; uji kebocoran lintas tenant).
- Rate‑limit endpoint publik (RSVP, wishes) + proteksi spam (honeypot/anti‑bot, bukan CAPTCHA berat bila bisa dihindari).
- Sanitasi & escape semua input tamu (cegah XSS), terutama `to`, nama, dan pesan ucapan.
- Moderasi ucapan: owner approve sebelum tampil (toggle).
- Simpan `ip_hash` (di‑hash), bukan IP mentah; jangan ekspos no. HP tamu.
- **Webhook pembayaran**: verifikasi signature gateway, idempoten, tolak callback tak tervalidasi; jangan pernah memutakhirkan status `paid` dari sisi client. Simpan secret gateway di env. Disbursement hanya ke `payment_accounts` yang `kyc_status = verified`.
- Undangan privat dengan PIN; token tamu tidak mudah ditebak (random ≥ 6 char).
- Secrets via env; jangan hardcode kredensial.

---

## 15. Internationalization (i18n) & Adaptasi Agama

- Locale didukung minimal: **ID** (default), **EN**; siapkan slot AR/JV/SU.
- Kamus teks per `locale` × `religion` untuk salam, ayat, dan doa.
- Format tanggal/jam/zona waktu sesuai locale; pakai tz‑aware (`Asia/Jakarta` default, bisa diubah per acara).

---

## 16. Rencana Build Bertahap (Milestones)

Kerjakan berurutan; tiap milestone harus runnable & lolos acceptance criteria sebelum lanjut.

- **M0 — Scaffold**: monorepo (Turborepo+pnpm), Docker (Postgres, Redis, MinIO, Mailpit), lint/format, CI dasar.
- **M1 — Auth & multi‑tenancy**: registrasi/login, RBAC, isolasi tenant.
- **M2 — Editor + 3–5 template**: skema `invitations/couples/events/stories/gallery`, wizard editor, preview, publish.
- **M3 — Daftar tamu + RSVP + link personal**: import CSV, generate link (token + `?to=`), RSVP, analitik open.
- **M4 — Halaman publik polish**: cover gate, musik, countdown+kalender, galeri, buku tamu, share/OG, animasi, Lighthouse ≥ 90.
- **M5 — Amplop digital transaksional + self‑host deploy**: integrasi gateway (QRIS dinamis/VA/e‑wallet), webhook idempoten bertanda tangan, KYC penerima + disbursement, rekonsiliasi di dashboard, plus fallback statis. `docker compose up` produksi + dokumentasi deploy.
- **M6+ (lanjutan)**: WhatsApp blast (Cloud API), QR check‑in PWA, AI generation, multi‑bahasa penuh, analitik lanjutan.

---

## 17. Acceptance Criteria (Definition of Done)

Sistem dianggap selesai (MVP) bila:

1. Owner bisa daftar, membuat undangan, mengisi semua section, memilih template, dan publish.
2. URL `domain.id/{slug}` menampilkan undangan; `?to=Nama+Tamu` dan `/g/{token}` menampilkan sapaan personal yang benar dan ter‑escape.
3. Tamu bisa RSVP dan kirim ucapan; data tersimpan dan tampil di dashboard owner (dengan moderasi).
4. Amplop digital transaksional berfungsi end‑to‑end: tamu bayar via QRIS/VA/e‑wallet, webhook memverifikasi & menandai `paid` secara idempoten, saldo tercatat, dan disbursement ke rekening pasangan ter‑KYC tercatat & terekonsiliasi. Mode statis tetap tersedia sebagai fallback.
5. Countdown, peta, musik (autoplay setelah "Buka"), galeri, dan share OG bekerja di mobile.
6. Halaman tamu lolos Lighthouse ≥ 90 dan tetap responsif saat 1.000+ permintaan bersamaan (uji beban sederhana).
7. Tidak ada kebocoran data antar‑tenant; input tamu tersanitasi; tidak ada XSS pada `to`/ucapan.
8. Seluruh sistem berjalan dari nol dengan `docker compose up` + `pnpm db:migrate` + `pnpm db:seed`.

---

## 18. Standar Koding & Konvensi

- TypeScript strict, tanpa `any` tak beralasan. Validasi I/O dengan Zod (schema dipakai bersama client+server).
- Server Components untuk data fetching; Client Components hanya untuk interaktivitas.
- Komponen kecil & reusable; tema lewat CSS variables, bukan nilai hardcode.
- Migrasi DB versioned (Drizzle); jangan ubah skema tanpa migrasi.
- Tulis test untuk util kritis (slug, encoding `to`, RSVP, isolasi tenant).
- Commit konvensional; README + DEPLOYMENT + SCHEMA terdokumentasi.
- Tangani error dengan ramah (pesan jelas di UI, log terstruktur di server).

---

## 19. Seed Data & Contoh

Sediakan seed berisi: 1 owner demo, 1 undangan `demo-rina-dan-budi` (status active, religion `islam`, locale `id`), 2 acara (akad & resepsi), 6 foto galeri, 3 story, 5 gifts, 20 tamu contoh dengan token & beberapa RSVP/wishes — agar halaman publik & dashboard langsung bisa dilihat hasilnya.

---

# BAGIAN LANJUTAN — KESIAPAN RILIS ALPHA (UI/UX, Superadmin, Monetisasi)

> Konteks: aplikasi dijadwalkan **rilis alpha** untuk pengembangan bisnis. Tujuan akhir = **monetisasi**: end user (calon pengantin) dikenai biaya untuk mengakses paket yang lebih baik. Fokus bagian ini: (1) UI/UX yang sangat menarik & sejuk, (2) konsol superadmin untuk pemilik platform, (3) sistem paket & konversi pembelian, (4) efisiensi waktu, (5) penguatan keamanan data, (6) placeholder media.

## 20. Design System & UI/UX

**Prinsip rasa:** tenang, hangat, elegan, terpercaya. Hindari kesan "ramai" atau norak. Banyak ruang kosong (whitespace), tipografi lembut, animasi halus.

### 20.1 Palet warna sejuk (tokens — pakai di seluruh UI privat & landing)
Gunakan satu palet sejuk yang konsisten. Simpan sebagai CSS variables / Tailwind theme. *(Palet halaman undangan publik tetap per‑template; palet di bawah untuk dashboard, superadmin, landing, dan komponen produk.)*

```
Sage/Eucalyptus (primary)   #6B8F71   hover #5C7D62   soft #E8F0EA
Dusty Blue (secondary)      #7C9CB3   soft #E7EEF3
Blush (accent hangat)       #E7C8C2   soft #F6EAE7
Sand/Cream (background)     #FAF7F2   surface #FFFFFF  border #ECE7DF
Ink (teks utama)            #2E3A35   muted #6B746F
Sukses #4F9D69 · Peringatan #C9A227 · Bahaya #C0675E (versi lembut, bukan merah menyala)
```
- **Mode terang default**, sediakan **dark mode** sejuk (ink gelap kehijauan, bukan hitam pekat).
- Radius lembut (`12–16px`), shadow tipis berlapis (bukan drop shadow keras).
- Kontras teks wajib lolos WCAG AA.

### 20.2 Tipografi
- **Heading**: serif lembut/elegan (mis. *Fraunces*, *Cormorant*, atau *Playfair Display*) untuk nuansa pernikahan.
- **Body/UI**: sans humanis (mis. *Inter*, *Plus Jakarta Sans*) — Plus Jakarta Sans cocok untuk audiens Indonesia.
- Skala tipografi konsisten; line‑height nyaman (1.5–1.7 untuk body).

### 20.3 Microcopy (teks yang menarik & hangat)
Tulis copy yang **personal, ringkas, menyemangati** — bukan bahasa sistem yang kaku. Contoh nada:
- Empty state daftar undangan: *"Belum ada undangan di sini. Yuk, mulai kisah indahmu — buat undangan pertamamu dalam beberapa menit."* + tombol *"Buat Undangan"*.
- Sukses publish: *"Undanganmu sudah tayang ✨ Saatnya sebar kebahagiaan."*
- Saat menyentuh fitur terkunci: *"Fitur ini ada di paket Premium — bikin undanganmu makin berkesan."* (lihat 22.3).
- Tombol aksi pakai kata kerja jelas: *Simpan*, *Pratinjau*, *Bagikan*, *Tingkatkan Paket*.
Sediakan file terpusat `packages/shared/copy/` (id/en) agar semua teks mudah dirawat & dilokalisasi.

### 20.4 Komponen & pola UI (shadcn/ui + Tailwind)
- **Dashboard end user**: layout dengan sidebar ringkas + topbar; kartu undangan dengan thumbnail, status (badge), dan aksi cepat (edit, pratinjau, bagikan, duplikasi).
- **Wizard editor**: progress stepper di atas, autosave indikator ("Tersimpan otomatis"), tombol *Pratinjau* selalu terlihat, panel pratinjau live berdampingan (split view di desktop, tab di mobile).
- **Mobile‑first**: end user banyak akses dari HP — semua alur kerja harus nyaman di layar kecil.
- Toast non‑intrusif untuk feedback; konfirmasi destruktif via dialog.
- Konsistenkan ikon (lucide), spacing (skala 4px), dan state (hover/focus/disabled/loading).

### 20.5 Aksesibilitas & gerak
- Fokus keyboard jelas, `aria-*` pada komponen interaktif, target sentuh ≥ 44px.
- Hormati `prefers-reduced-motion`. Animasi sebagai bumbu, bukan penghalang.

---

## 21. Konsol Superadmin (Pemilik Platform)

Halaman terpisah dari dashboard end user, di route terlindungi `/admin/**` (hanya role `superadmin`, **wajib 2FA** — lihat 24). Ini "ruang kcontrol bisnis" milikmu.

**Halaman & kapabilitas:**

1. **Overview / Bisnis** — kartu metrik real‑time: total end user, end user aktif (30 hari), undangan dibuat (draft/active), **pendapatan (MRR/total)**, **tingkat konversi free→berbayar**, churn, grafik tren pendaftaran & pendapatan, dan **kesehatan sistem** (status DB/Redis/storage/gateway, error rate, latensi).
2. **Manajemen End User** — daftar + pencarian/filter (paket, status, tanggal daftar), detail user (undangan, pemakaian kuota, riwayat transaksi), aksi: suspend/aktifkan, ubah paket manual, reset password, dan **impersonate** (login sebagai user untuk support — **dengan audit log & batas waktu**, tidak melihat data sensitif pembayaran).
3. **Paket & Harga** — **CRUD paket** (nama, harga, fitur, kuota undangan/tamu/foto, masa aktif), kelola **kode promo/diskon**, jadwalkan harga (mis. promo terbatas), aktif/nonaktifkan paket. Perubahan harga berlaku untuk pembelian baru; pelanggan eksisting di‑grandfather.
4. **Template & Konten Global** — kelola katalog template (aktif/nonaktif, urutan tampil, label "Baru"/"Populer"), aset default, dan kamus copy.
5. **Moderasi** — tinjau laporan, blokir konten/akun bermasalah.
6. **Feature Flags** — nyalakan/matikan fitur per‑paket atau per‑user (rollout bertahap untuk alpha).
7. **Billing & Transaksi** — daftar transaksi langganan & amplop, status disbursement, ekspor laporan (CSV), rekonsiliasi dengan gateway.
8. **Audit Log** — semua aksi sensitif superadmin tercatat (siapa, apa, kapan, IP).
9. **Pengaturan Platform** — branding, domain, env non‑rahasia, integrasi (gateway, WhatsApp, email), kebijakan.

**Implementasi metrik:** sediakan layer agregasi (materialized view / query terjadwal ke Redis) agar Overview cepat dimuat tanpa membebani DB transaksional.

---

## 22. Monetisasi, Paket Harga & Konversi

### 22.1 Struktur paket (contoh — superadmin dapat mengubah via Bagian 21.3)
| Paket | Harga (contoh) | Kuota & Fitur kunci |
|---|---|---|
| **Free / Coba** | Rp0 | 1 undangan, watermark platform, ~50 tamu, 3 foto, template dasar, masa aktif terbatas. |
| **Starter** | Rp99.000 | 1 undangan, tanpa watermark, RSVP+buku tamu, ~300 tamu, galeri penuh, semua template dasar. |
| **Premium** | Rp199.000 | Amplop digital transaksional, musik, multi‑acara, tamu tak terbatas, analitik, link aktif lebih lama, prioritas support. |
| **Business / WO** | Langganan | Banyak undangan, kelola klien, blast WhatsApp, white‑label, fitur AI. |

Definisikan kuota & gating secara **data‑driven** (tabel `plans.features` JSONB) sehingga superadmin bisa atur tanpa deploy ulang. Cek entitlement **di server** untuk tiap aksi terkunci.

### 22.2 Model & billing
- **Freemium** sebagai pintu masuk: end user bisa membuat & pratinjau undangan gratis, tapi fitur premium & publish tanpa watermark terkunci. Ini menurunkan friksi dan menaikkan konversi.
- Checkout langganan/paket via gateway yang sama (Bagian 11A), metode lokal (QRIS/VA/e‑wallet/kartu). Tabel `plans` + `subscriptions` + `subscription_invoices`. Tangani upgrade/downgrade, masa aktif, perpanjangan, dan kode promo.
- Webhook pembayaran memutakhirkan entitlement secara idempoten.

### 22.3 UX konversi (buat end user *tertarik* membeli)
- **Paywall kontekstual ("just‑in‑time"):** kunci muncul tepat saat user butuh fitur (mis. menambah acara kedua, mengaktifkan amplop, menghapus watermark) — bukan dinding di awal. Pesan hangat + tombol *"Tingkatkan ke Premium"* + ringkasan manfaat.
- **Pratinjau bernilai:** biarkan user merasakan hasilnya (pratinjau penuh) sebelum bayar; watermark/teks lembut menandai versi gratis.
- **Halaman harga jernih:** tabel perbandingan, highlight paket "Paling Populer", harga dalam Rupiah, FAQ, social proof (testimoni/jumlah pasangan terbantu).
- **Dorongan halus:** banner sisa masa aktif, *"3 dari 5 fitur favorit ada di Premium"*, promo terbatas dengan countdown (jujur, tidak gelap‑pola).
- **Checkout 1 langkah:** sesedikit mungkin klik; ringkasan jelas; metode pembayaran lokal; konfirmasi instan setelah webhook.
- **Onboarding cepat:** setelah daftar, arahkan langsung ke wizard "buat undangan pertama" agar user cepat melihat nilai (time‑to‑value pendek) — pendorong konversi terkuat.

> Etika: gunakan persuasi jujur. Hindari dark patterns (langganan yang sulit dibatalkan, biaya tersembunyi). Kepercayaan = retensi.

---

## 23. Efisiensi Waktu (UX & DX)

- **Autosave + optimistic UI** di editor; status "Tersimpan" jelas; tanpa tombol simpan manual yang membingungkan.
- **Quick start**: pilih template → form minimal terisi contoh → user tinggal mengganti. Time‑to‑first‑preview < 2 menit.
- **Duplikasi undangan** & **simpan sebagai draf template pribadi** (untuk WO).
- **Operasi massal tamu**: import CSV, edit/hapus banyak, generate semua link sekaligus.
- **Command palette (Cmd/Ctrl‑K)** & shortcut untuk power user/superadmin.
- **Upload media langsung ke S3** via presigned URL (tidak lewat server app) → cepat & hemat. Proses thumbnail/optimasi async via BullMQ.
- **Caching & ISR** untuk halaman publik; revalidate on‑demand saat edit.
- Target waktu muat dashboard < 1.5s; aksi umum terasa instan (< 200ms feedback).

---

## 24. Keamanan Data (Penguatan untuk Alpha)

- **2FA wajib untuk superadmin** (TOTP); opsional untuk end user.
- **RBAC ditegakkan di server** untuk setiap endpoint & aksi (jangan pernah hanya sembunyikan tombol di UI).
- **Audit log** untuk aksi sensitif (superadmin, perubahan harga, disbursement, impersonate, ekspor data).
- **Enkripsi**: TLS in‑transit; enkripsi at‑rest untuk PII sensitif (no. HP, data rekening) dan field pembayaran; secrets di vault/env, tidak di repo.
- **Isolasi tenant** diuji otomatis (test mencoba akses lintas tenant harus gagal).
- **Rate limiting & anti‑abuse** pada auth, RSVP, wishes, dan checkout; proteksi brute‑force login.
- **Privasi end user (calon pengantin) & tamu**: data tamu milik end user, tidak dijual/keluar; sediakan **ekspor & hapus data** (hak atas data). `ip_hash`, bukan IP mentah.
- **Backup terjadwal** DB & storage + uji restore; **rencana pemulihan**.
- **Pemindaian dependensi** (audit) di CI; header keamanan (CSP, HSTS, dll.); proteksi CSRF pada aksi mutasi berbasis cookie.
- **Webhook gateway** bertanda tangan & idempoten (Bagian 14/11A).

---

## 25. Placeholder Media & Loading States

Layout tidak boleh pernah "pecah" atau kosong saat media belum ada/masih dimuat.

- **Skeleton loaders** untuk kartu undangan, galeri, daftar tamu, dan metrik superadmin.
- **LQIP/blurhash**: simpan placeholder blur tiap gambar; tampilkan blur → fade ke gambar tajam (`next/image` placeholder="blur").
- **Placeholder default elegan** per slot bila media kosong: foto cover, foto mempelai, item galeri, avatar — ilustrasi/pola sejuk sesuai palet (bukan kotak abu‑abu polos), dengan ajakan *"Tambahkan foto"* di mode editor.
- **Uploader** dengan drag‑and‑drop, progress bar, validasi format/ukuran, **cropping/aspect‑ratio** sesuai slot, dan kompresi sebelum unggah. Tampilkan estimasi & error yang ramah.
- **Fallback**: jika audio/video gagal dimuat, sembunyikan kontrol dengan anggun; jika peta gagal, tampilkan tautan teks.
- **Optimistic preview**: tampilkan media segera setelah dipilih (object URL) sambil unggah berjalan di belakang.

---

## 26. Milestone Alpha & Acceptance Criteria

Lanjutan dari M0–M6:

- **M7 — Design system & polish UI/UX**: terapkan palet sejuk, tipografi, komponen, microcopy, dark mode, skeleton/placeholder, aksesibilitas. Dashboard end user terasa cepat & ramah.
- **M8 — Konsol superadmin**: route `/admin` + 2FA, Overview metrik, manajemen end user, CRUD paket & harga, feature flags, billing/transaksi, audit log.
- **M9 — Monetisasi & konversi**: `plans/subscriptions/subscription_invoices`, freemium + paywall kontekstual, halaman harga, checkout langganan via gateway, entitlement server‑side, watermark versi gratis.
- **🚀 Alpha Gate** — siap rilis alpha bila semua di bawah lolos.

**Acceptance Criteria Alpha (tambahan dari Bagian 17):**
1. End user (calon pengantin) bisa daftar (free), membuat & pratinjau undangan, lalu **upgrade berbayar** via checkout lokal; entitlement berubah otomatis setelah webhook.
2. Fitur terkunci ditegakkan **di server**; paywall kontekstual tampil dengan copy hangat dan tombol upgrade yang berfungsi.
3. Superadmin bisa login dengan **2FA**, melihat metrik bisnis (jumlah end user, pendapatan, konversi, kesehatan sistem), dan **mengubah paket/harga** yang langsung berlaku untuk pembelian baru.
4. UI memakai palet sejuk konsisten, lolos WCAG AA, punya skeleton/placeholder di semua slot media, dan nyaman di mobile.
5. Autosave, upload presigned, dan ISR bekerja; dashboard dimuat < 1.5s pada data contoh.
6. Audit log mencatat aksi superadmin sensitif; isolasi tenant & rate‑limit lolos uji; backup & restore teruji.
7. Tidak ada dark pattern; pembatalan/penurunan paket jelas dan jujur.

---

## 27. Seed Data Alpha (tambahan)

Selain seed Bagian 19, sediakan: 1 akun **superadmin** (dengan 2FA contoh), 4 paket (`free/starter/premium/business`) beserta `features` JSONB, 1 kode promo, 8–10 end user contoh dengan paket beragam & beberapa langganan aktif/kedaluwarsa, serta data transaksi & metrik dummy agar **Overview superadmin** langsung terisi dan bisa dievaluasi.

---

### Catatan akhir untuk agent (diperbarui)
Prioritaskan **kesederhanaan & performa halaman tamu**, **kelengkapan + kenyamanan dashboard end user**, dan **kejelasan konsol superadmin**. Desain harus terasa **sejuk, hangat, dan terpercaya** — ini produk emosional (pernikahan) sekaligus produk bisnis (monetisasi). Setiap friksi yang dihilangkan dari alur "daftar → lihat nilai → upgrade" berbanding lurus dengan konversi. Jaga keamanan data sebagai fondasi kepercayaan, bukan tambahan. Jika harus memilih antara fitur baru dan (performa tamu / keamanan data), **pilih performa & keamanan**.
