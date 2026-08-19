# Struktur Target Nutrisi Manual

Target nutrisi bersifat opsional dan sepenuhnya dimasukkan pengguna. Aplikasi hanya membandingkan akumulasi catatan hari ini dengan angka yang ditentukan pengguna, tanpa menyarankan angka target atau memberi penilaian terhadap capaian.

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `kcal` | number | Target energi harian dalam kilokalori. |
| `carbs` | number | Target karbohidrat harian dalam gram. |
| `protein` | number | Target protein harian dalam gram. |
| `fat` | number | Target lemak harian dalam gram. |

Nilai target disimpan lokal dan dapat dibiarkan kosong. Ringkasan nutrisi menampilkan jumlah catatan dan target dalam bentuk `tercatat / target` apabila pengguna telah mengisi target tersebut.

