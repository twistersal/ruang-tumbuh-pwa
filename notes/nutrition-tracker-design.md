# Struktur Pelacak Makanan & Minuman

Pelacak berada pada halaman **Kesehatan** dan berfungsi tanpa akun atau server. Pengguna mencatat konsumsi secara mandiri; aplikasi tidak menghitung atau memberikan rekomendasi nutrisi.

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | string | Identitas catatan lokal. |
| `date` | string | Tanggal catatan dengan format `YYYY-MM-DD`. |
| `type` | string | Kategori: makanan atau minuman. |
| `meal` | string | Waktu/jenis konsumsi, misalnya sarapan atau minuman. |
| `name` | string | Nama makanan atau minuman yang diinput pengguna. |
| `kcal` | number | Energi yang diinput manual, dalam kilokalori. |
| `carbs` | number | Karbohidrat yang diinput manual, dalam gram. |
| `protein` | number | Protein yang diinput manual, dalam gram. |
| `fat` | number | Lemak yang diinput manual, dalam gram. |

Ringkasan harian menjumlahkan setiap nilai di atas untuk catatan dengan tanggal yang sama. Data disimpan bersama data kesehatan lain di penyimpanan lokal perangkat.

