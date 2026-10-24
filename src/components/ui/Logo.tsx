/**
 * Logo EngHabits (kucing). Satu sumber untuk semua halaman, supaya gambarnya selalu sama.
 * Ukuran diatur lewat className. Rasio asli gambar dijaga oleh object-contain.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      // Penanda versi memaksa browser dan service worker mengambil logo baru, bukan salinan lama.
      src={`${import.meta.env.BASE_URL}logo.png?v=2`}
      alt="Logo EngHabits"
      width={458}
      height={439}
      className={`object-contain ${className}`}
    />
  );
}
