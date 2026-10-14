

## Catatan Serah Terima

Sebelum situs digunakan dengan data perusahaan, tim IT perlu meninjau dan mengamankan endpoint API MRO (`/api/mro-sales.php`). Pada pemeriksaan kode, endpoint tersebut belum terlihat memiliki pemeriksaan autentikasi dan otorisasi di sisi server. Pastikan hanya pengguna yang berwenang yang dapat membaca, membuat, mengubah, atau menghapus data MRO.

Jika pengamanan belum selesai, jangan gunakan fitur MRO dengan data sungguhan. Koordinasikan pembatasan atau penonaktifan sementara endpoint dengan tim IT/hosting agar fitur API lain tidak ikut terganggu.
