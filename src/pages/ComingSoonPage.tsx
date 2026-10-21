import { Card } from '../components/ui/Card';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <Card>
        <p className="text-muted">Fitur ini dibuat di Fase 11 (statistik dan grafik). Data progres yang sudah ada tetap tersimpan.</p>
      </Card>
    </div>
  );
}
