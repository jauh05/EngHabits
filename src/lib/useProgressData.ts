import { useCallback, useEffect, useState } from 'react';
import { contentDays } from './content';
import { getAllMistakes, getAllProgress, type DayProgress } from './db';
import { isMastered } from './progression';
import type { MistakeEntry } from './srs';

export type ProgressData = {
  loaded: boolean;
  progress: DayProgress[];
  /** Hari yang sudah pernah dikirim, lulus atau belum. */
  completed: Set<number>;
  /** Hari yang lulus: skor inti terbaik minimal ambang mastery. Dipakai untuk membuka hari berikutnya. */
  mastered: Set<number>;
  completedDates: Set<string>;
  content: Set<number>;
  mistakes: MistakeEntry[];
  refresh: () => Promise<void>;
};

/** Muat progres, Buku Kesalahan, dan daftar hari yang punya konten. */
export function useProgressData(): ProgressData {
  const [state, setState] = useState<Omit<ProgressData, 'refresh'>>({
    loaded: false,
    progress: [],
    completed: new Set(),
    mastered: new Set(),
    completedDates: new Set(),
    content: new Set(contentDays()),
    mistakes: [],
  });

  const refresh = useCallback(async () => {
    try {
      const [progress, mistakes] = await Promise.all([getAllProgress(), getAllMistakes()]);
      setState((current) => ({
        ...current,
        loaded: true,
        progress,
        completed: new Set(progress.map((item) => item.day)),
        mastered: new Set(progress.filter((item) => isMastered(item.bestCorePercent)).map((item) => item.day)),
        completedDates: new Set(progress.map((item) => item.completedDate)),
        mistakes,
      }));
    } catch {
      setState((current) => ({ ...current, loaded: true }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
