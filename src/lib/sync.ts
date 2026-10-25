import type { BackupData } from './db';

/**
 * Mengirim seluruh progres perangkat ke server dan menerima hasil gabungannya.
 * Server menyimpan salinan gabungan dari semua perangkat untuk akun yang sama.
 */
export async function syncWithServer(token: string, local: BackupData): Promise<BackupData> {
  const response = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(local),
  });
  const data = (await response.json().catch(() => ({}))) as BackupData & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Sinkron gagal. Coba lagi nanti.');
  return data;
}
