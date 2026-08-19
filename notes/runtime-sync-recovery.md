# Pemulihan Pratinjau Setelah Sinkronisasi

Galat `useState` terjadi karena service worker lama menyajikan modul pengembangan Vite yang tersimpan dari sesi sebelumnya. Akibatnya, React renderer yang baru dimuat bersama modul hooks yang sudah kedaluwarsa, sehingga dispatcher hook tidak tersedia.

Perbaikan menjaga semua perubahan aplikasi dengan melakukan deduplikasi React di Vite, memindahkan stylesheet target nutrisi ke titik masuk, menaikkan versi cache PWA, mengecualikan modul pengembangan dari cache service worker, dan membatalkan service worker serta cache lama hanya pada pratinjau lokal. Pratinjau berhasil dirender kembali setelah restart.

