/**
 * Normalisasi jawaban untuk perbandingan: huruf kecil, tanpa aksen,
 * tanpa apostrof dan tanda baca, spasi tunggal.
 * Dipakai oleh grading di aplikasi dan oleh validator konten.
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
