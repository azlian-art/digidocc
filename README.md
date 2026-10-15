

## Catatan Keamanan dan Serah Terima

Hak akses API diperiksa di server: customer dapat membaca data docking dan mengirim/melihat permintaan workshop setelah login; hanya admin/pegawai dapat mengubah data docking; hanya pegawai dapat mengakses MRO; daftar akun hanya dapat dibaca admin. API workshop meminta login customer, termasuk untuk melihat status permintaan. Pendaftaran customer dan pegawai tetap terbuka untuk umum; akun pegawai baru langsung memperoleh akses pegawai, termasuk MRO. Siapa pun yang dapat membuka halaman pendaftaran dapat membuat akun pegawai; kebijakan ini harus disetujui perusahaan sebelum situs digunakan dengan data sungguhan. Halaman HTML statis masih dapat dibuka langsung; data dan operasi API yang dibatasi tetap ditolak oleh server.

Admin dan pegawai dapat meninjau permintaan workshop melalui `admin-review.html` dan API `api/admin-review.php`. Untuk menyimpan alasan penolakan, jalankan `database.sql` pada database yang sudah ada; migrasi menambahkan kolom yang diperlukan tanpa menghapus data booking.

Sesi API berakhir setelah 30 menit tidak aktif. Sebelum deploy, tim IT perlu meninjau kebijakan pendaftaran, menguji penolakan API tanpa login dan akses oleh jenis akun yang tidak berwenang, serta mengonfigurasi HTTPS dan kredensial database produksi. Admin hanya dapat dibuat melalui CLI dengan variabel lingkungan `DIGIDOCC_ADMIN_USERNAME`, `DIGIDOCC_ADMIN_PASSWORD`, dan `DIGIDOCC_ADMIN_ID`; endpoint web seed admin dinonaktifkan.

Jika database pernah dibuat menggunakan akun admin bawaan lama (`admin` / `admin123`), nonaktifkan atau ganti kredensial akun tersebut sebelum deploy. Jangan gunakan kembali password default.
