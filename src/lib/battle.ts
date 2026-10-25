/**
 * Klien untuk battle real-time. Semua penilaian ada di server, jadi klien hanya menampilkan dan mengirim jawaban.
 * Aliran perubahan memakai SSE yang dibaca dengan fetch, karena EventSource tidak bisa mengirim header Bearer.
 */

export type BattleMode =
  | 'kilat'
  | 'terjemahan'
  | 'tata_bahasa'
  | 'kosakata'
  | 'cerita'
  | 'esai'
  | 'campuran'
  | 'dengar'
  | 'susun'
  | 'bertahan';

export const BATTLE_MODES: Array<{ id: BattleMode; label: string; hint: string }> = [
  { id: 'kilat', label: 'Kilat', hint: 'Pilihan ganda, 15 detik per soal' },
  { id: 'terjemahan', label: 'Terjemahan', hint: 'Indonesia ke Inggris, diketik' },
  { id: 'tata_bahasa', label: 'Tata Bahasa', hint: 'Jebakan tata bahasa' },
  { id: 'kosakata', label: 'Kosakata', hint: 'Arti dan sinonim' },
  { id: 'cerita', label: 'Cerita', hint: 'Bacaan singkat lalu pertanyaan' },
  { id: 'esai', label: 'Esai', hint: 'Menulis, dinilai dengan rubrik' },
  { id: 'campuran', label: 'Campuran', hint: 'Atur sendiri jenis soalnya' },
  { id: 'dengar', label: 'Dengar', hint: 'Dengarkan lalu jawab' },
  { id: 'susun', label: 'Susun Kalimat', hint: 'Susun kata yang diacak' },
  { id: 'bertahan', label: 'Bertahan', hint: 'Tiga nyawa, salah berarti kehilangan satu' },
];

export const BATTLE_TOTALS = [8, 10, 15, 20] as const;
export type QuestionType = 'mcq' | 'translate' | 'story' | 'essay' | 'listen' | 'reorder';
export type Composition = Partial<Record<QuestionType, number>>;

export type PlayerName = { id: string; publicId: string; name: string } | null;

export type PublicItem = {
  index: number;
  type: QuestionType;
  prompt: string;
  seconds: number;
  passage?: string;
  script?: string;
  words?: string[];
  options?: Array<{ id: string; text: string }>;
  criteria?: string[];
};

export type RevealResult = { answered: boolean; correct: boolean; points: number; answer: string | null };

export type BattleSnapshot = {
  id: string;
  mode: BattleMode;
  modeLabel: string;
  status: 'pending' | 'active' | 'rating' | 'finished' | 'declined' | 'expired' | 'cancelled';
  phase: 'idle' | 'countdown' | 'question' | 'reveal' | 'rating' | 'finished';
  total: number;
  round: number;
  serverNow: number;
  deadlineAt: number | null;
  players: PlayerName[];
  you: string;
  lives: Record<string, number | null>;
  scores: Record<string, number>;
  current: PublicItem | null;
  answered: { you: boolean; opponent: boolean };
  reveal: null | {
    round: number;
    correct: string | null;
    explanation: string | null;
    modelAnswer: string | null;
    limitMs: number;
    results: Record<string, RevealResult>;
  };
  rating: null | {
    criteria: string[];
    essays: Array<{ index: number; answer: string; model: string; rated: boolean }>;
  };
  results: null | { winnerId: string | null; totals: Record<string, number>; players: PlayerName[] };
};

export type Invite = { battleId: string; mode: BattleMode; modeLabel: string; total: number; from: PlayerName };

export type BattleSummary = {
  id: string;
  mode: BattleMode;
  modeLabel: string;
  status: string;
  total: number;
  winner: 'you' | 'opponent' | null;
  opponent: PlayerName;
  createdAt: string;
};

const API = '/api';

async function request<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Permintaan gagal. Coba lagi.');
  return data;
}

export function fetchAccount(token: string) {
  return request<{ account: { email: string; name: string; publicId: string; canChangePublicId: boolean } }>(
    'GET',
    '/me',
    token,
  );
}

export function regeneratePublicId(token: string) {
  return request<{ account: { email: string; name: string; publicId: string; canChangePublicId: boolean } }>(
    'POST',
    '/me/public-id/regenerate',
    token,
  );
}

export function saveMastered(token: string, days: number[]) {
  return request<{ level: number; count: number }>('PUT', '/progress/mastered', token, { days });
}

export function lookupUser(token: string, publicId: string) {
  return request<{ publicId: string; name: string }>('GET', `/users/${encodeURIComponent(publicId.trim().toUpperCase())}`, token);
}

export function createBattle(
  token: string,
  input: { opponentPublicId: string; mode: BattleMode; total: number; composition?: Composition },
) {
  return request<{ battleId: string; poolDay: number; composition: Composition }>('POST', '/battles', token, input);
}

export function respondBattle(token: string, battleId: string, accept: boolean) {
  return request<{ status: string }>('POST', `/battles/${battleId}/respond`, token, { accept });
}

export function answerBattle(token: string, battleId: string, idx: number, answer: string) {
  return request<{ received: boolean }>('POST', `/battles/${battleId}/answer`, token, { idx, answer });
}

export function rateBattle(token: string, battleId: string, idx: number, scores: number[]) {
  return request<{ rated: boolean }>('POST', `/battles/${battleId}/rate`, token, { idx, scores });
}

export function getBattle(token: string, battleId: string) {
  return request<BattleSnapshot>('GET', `/battles/${battleId}`, token);
}

export function listBattles(token: string) {
  return request<{ battles: BattleSummary[]; invites: Invite[] }>('GET', '/battles', token);
}

export type BattleEvent =
  | { type: 'invites'; invites: Invite[] }
  | { type: 'invite'; invite: Invite }
  | { type: 'battle'; battle: BattleSnapshot };

/**
 * Membuka aliran SSE dengan fetch. Mengembalikan fungsi untuk menutup aliran.
 * Kalau koneksi putus, pemanggil diberi tahu lewat onError dan bisa menyambung ulang.
 */
export function openBattleStream(
  token: string,
  onEvent: (event: BattleEvent) => void,
  onError: (error: Error) => void,
): () => void {
  const controller = new AbortController();
  (async () => {
    try {
      const response = await fetch(`${API}/battles/events`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error('Aliran battle tidak bisa dibuka.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) throw new Error('Koneksi battle terputus.');
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const parsed = parseSseChunk(chunk);
          if (parsed) onEvent(parsed);
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) onError(error instanceof Error ? error : new Error('Koneksi battle terputus.'));
    }
  })();
  return () => controller.abort();
}

function parseSseChunk(chunk: string): BattleEvent | null {
  let name = 'message';
  const dataLines: string[] = [];
  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const data = JSON.parse(dataLines.join('\n'));
  if (name === 'invites') return { type: 'invites', invites: data };
  if (name === 'invite') return { type: 'invite', invite: data };
  if (name === 'battle') return { type: 'battle', battle: data };
  return null;
}

/** Hitung mundur dari server, dikoreksi dengan selisih jam server dan perangkat. */
export function remainingMs(snapshot: BattleSnapshot, clientNow: number): number {
  if (snapshot.deadlineAt === null) return 0;
  const skew = snapshot.serverNow - clientNow;
  return Math.max(0, snapshot.deadlineAt - (clientNow + skew));
}
