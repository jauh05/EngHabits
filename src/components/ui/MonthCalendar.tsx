/**
 * Kalender satu bulan, Senin di awal minggu, seperti kartu kalender di referensi MedBoard.
 * Hari yang sudah ada sesinya diberi warna mint, dan hari ini diberi latar ungu terang.
 */
export function MonthCalendar({ sessionDates, today }: { sessionDates: ReadonlySet<string>; today: string }) {
  const [year, month] = today.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay(): Minggu = 0. Digeser supaya Senin = 0.
  const offset = (first.getDay() + 6) % 7;
  const title = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(first);
  const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-base font-bold capitalize text-ink">{title}</p>
      <div role="grid" aria-label={title} className="grid grid-cols-7 gap-y-1.5 text-center">
        {weekdays.map((label) => (
          <span key={label} aria-hidden="true" className="pb-1 text-xs font-semibold text-muted">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = iso === today;
          const done = sessionDates.has(iso);
          const tone = isToday
            ? 'bg-banner font-extrabold text-ink'
            : done
              ? 'bg-tint-mint font-bold text-ink'
              : 'text-ink';
          return (
            <span
              key={iso}
              role="gridcell"
              aria-label={`${day} ${title}${done ? ', ada sesi selesai' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              className={`mx-auto grid size-9 place-items-center rounded-full text-sm tabular-nums ${tone}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
