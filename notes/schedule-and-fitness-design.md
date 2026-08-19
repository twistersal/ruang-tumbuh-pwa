# Alur Jadwal & Kebugaran

Refleksi dan latihan akan dilebur menjadi satu halaman **Refleksi & Langkah**. Catatan refleksi tetap dapat menghasilkan eksperimen perilaku, tetapi eksperimen tersebut ditampilkan sebagai langkah kecil tanpa halaman latihan terpisah.

Halaman **Jadwal** menjadi tempat pusat untuk kegiatan hari ini. Setiap item memiliki waktu opsional, judul kegiatan, keterangan singkat, status checkpoint, dan asal data. Ritual pribadi tetap dikelola dari Jadwal. Rencana Kebugaran dibuat di Kesehatan untuk tanggal hari ini, lalu ditampilkan otomatis sebagai item Jadwal berstatus khusus agar tidak perlu dicatat dua kali.

| Data | Field utama | Perilaku |
| --- | --- | --- |
| To-do Jadwal | `id`, `date`, `time`, `title`, `note`, `done` | Dibuat dan dikelola mandiri di Jadwal. |
| Ritual | `id`, `label`, `area` | Dikelola dari Jadwal dan dapat dicentang per hari. |
| Rencana Kebugaran | `id`, `date`, `time`, `activity`, `duration`, `note`, `done` | Dibuat di Kesehatan dan otomatis terlihat di Jadwal pada tanggal yang sama. |
| Langkah refleksi | data refleksi dan eksperimen | Tetap berada di halaman terpadu Refleksi & Langkah. |

