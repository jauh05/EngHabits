/** Konstanta animasi bersama. Lihat DESIGN_SPEC.md bagian 8. */
export const durations = { fast: 0.15, base: 0.25, slow: 0.45 } as const;

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Pegas standar untuk tombol, kartu, dan panel. */
export const spring = { type: 'spring', stiffness: 420, damping: 32 } as const;

/** Pegas memantul untuk jawaban benar dan lencana. */
export const bounce = { type: 'spring', stiffness: 520, damping: 18 } as const;
