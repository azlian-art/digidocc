# Digidocc

Panduan menjalankan aplikasi Digidocc dengan Laragon dan memeriksa koneksi MySQL melalui phpMyAdmin.

## Menjalankan aplikasi di Laragon

1. Letakkan folder proyek di `C:\laragon\www\digidocc`.
2. Jalankan Laragon dan pastikan Apache serta MySQL aktif.
3. Buka aplikasi melalui `http://localhost/digidocc/`. Untuk Dock Lamongan, buka `http://localhost/digidocc/lamongan.html`.
4. Jangan membuka file HTML langsung melalui `file://`, karena halaman perlu memanggil endpoint PHP di folder `api`.

## Menyiapkan database

1. Sebelum mengubah skema, buat backup database yang ada melalui phpMyAdmin: pilih `db_digidocc` → **Export**.
2. Buka phpMyAdmin Laragon di `http://localhost/phpmyadmin6/`.
3. Pilih database `db_digidocc`. Jika belum ada, buat database dengan nama tersebut.
4. Pilih tab **Import**, pilih file `database.sql` dari folder proyek, lalu jalankan import.
5. Pastikan tabel `docks` dan `ships` tersedia. Dock Lamongan harus memiliki `id = 4`; tabel `ships` juga perlu kolom `schedule_date`.

`database.sql` menyiapkan tabel dan data dock, serta menambahkan kolom yang belum ada. Jalankan pada database `db_digidocc` yang benar dan selalu backup terlebih dahulu jika database sudah berisi data penting.

## Memeriksa koneksi aplikasi ke MySQL

Koneksi aplikasi dikonfigurasi di `db.php`. Nilai database, host, dan akun di file tersebut harus sesuai dengan MySQL Laragon yang digunakan phpMyAdmin.

1. Buka `http://localhost/digidocc/api/docks.php`. Respons JSON dengan `"success": true` berarti API dapat membaca tabel dock.
2. Buka `http://localhost/digidocc/api/ships.php`. Respons JSON dengan `"success": true` berarti API dapat membaca tabel kapal.
3. Tambahkan kapal melalui halaman Dock Lamongan.
4. Di phpMyAdmin, pilih database `db_digidocc`, buka tab **SQL**, lalu jalankan:

   ```sql
   SELECT id, dock_id, ship_name, schedule_date, stay_start, stay_end
   FROM ships
   WHERE dock_id = 4
   ORDER BY id DESC;
   ```

   Baris yang baru ditambahkan harus muncul dengan `dock_id = 4`. Dock Lamongan dapat diperiksa dengan:

   ```sql
   SELECT id, code, name
   FROM docks
   WHERE id = 4;
   ```

Jangan menganggap kapal tersimpan di database hanya karena terlihat di halaman. Jika API gagal, halaman dapat menampilkan data dari penyimpanan lokal browser. Periksa juga pesan **Saved Locally Only** pada halaman.

## Sinkronisasi dengan Git/VCS

Git/VCS **tidak terhubung langsung ke server MySQL**. Git menyimpan perubahan berkas SQL (skema, migrasi, dan data awal) bersama kode aplikasi. Setiap database—di komputer sendiri, rekan tim, atau server—harus menjalankan SQL tersebut secara terpisah.

### Alur kerja saat mengubah database

1. Ubah `database.sql` saat menambahkan tabel, kolom, indeks, atau data awal yang memang diperlukan aplikasi. Jangan masukkan password, kredensial, atau dump data operasional pengguna ke berkas ini.
2. Backup database lokal melalui phpMyAdmin (**db_digidocc** → **Export**).
3. Terapkan dan uji perubahan SQL di database lokal melalui phpMyAdmin (**db_digidocc** → **Import** → pilih `database.sql`). Pastikan halaman/API tetap berjalan dan struktur yang diperlukan tersedia.
4. Dari terminal pada folder proyek, tinjau perubahan yang akan dikirim:

   ```powershell
   git status
   git diff -- database.sql
   ```

5. Tambahkan berkas skema dan berkas kode terkait, lalu commit dan push ke remote/branch yang dipakai tim. Contoh untuk branch `main` dan remote `origin`:

   ```powershell
   git add database.sql api/ships.php
   git commit -m "Update database schema"
   git push origin main
   ```

   Jika perubahan fitur juga melibatkan berkas lain, tambahkan berkas tersebut secara eksplisit, misalnya:

   ```powershell
   git add README.md lamongan.html lamongan.js
   ```

   Jangan gunakan `git add .` sebelum memeriksa `git status`, agar dump database, file rahasia, atau berkas lain yang tidak dimaksud tidak ikut ter-commit.

