# Struktur Ritual Pribadi

Bagian ritual akan menjadi daftar yang sepenuhnya dimiliki pengguna. Pengguna dapat memasukkan nama ritual dan area singkat sebagai konteks, lalu menghapusnya bila ritual tidak lagi relevan. Daftar definisi ritual disimpan secara lokal, sedangkan status selesai disimpan per tanggal agar checklist hari sebelumnya tidak memengaruhi hari berikutnya.

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | string | Identitas ritual lokal. |
| `label` | string | Nama ritual yang ditulis pengguna. |
| `area` | string | Konteks singkat ritual, misalnya hidrasi atau istirahat. |
| `createdAt` | string | Waktu penambahan ritual. |
| `routineLogs` | object | Pemetaan status selesai berdasarkan tanggal dan identitas ritual. |

