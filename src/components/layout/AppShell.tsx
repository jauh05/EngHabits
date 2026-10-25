import { motion } from 'motion/react';
import { BarChart3, BookX, Dumbbell, Home, LayoutGrid, Play, Swords, Trophy, User, type LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { easeOut, spring } from '../../lib/motion';
import { useAccountSync } from '../../lib/useAccountSync';
import { currentDay, TOTAL_DAYS } from '../../lib/progression';
import { useSettings } from '../../lib/settings';
import { useProgressData } from '../../lib/useProgressData';
import { BackgroundArt } from '../ui/BackgroundArt';
import { Logo } from '../ui/Logo';
import { ReminderWatcher } from './ReminderWatcher';

type NavItem = { to: string; label: string; icon: LucideIcon };

const MOBILE_ITEMS: NavItem[] = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/peta', label: 'Peta', icon: LayoutGrid },
  { to: '/battle', label: 'Battle', icon: Swords },
  { to: '/statistik', label: 'Statistik', icon: BarChart3 },
  { to: '/profil', label: 'Profil', icon: User },
];

const DESKTOP_ITEMS: NavItem[] = [
  ...MOBILE_ITEMS,
  { to: '/kesalahan', label: 'Kesalahan', icon: BookX },
  { to: '/latihan', label: 'Latihan', icon: Dumbbell },
];

function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full border border-line bg-surface p-2 shadow-card lg:hidden"
    >
      {MOBILE_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          aria-label={item.label}
          className="relative flex min-h-11 flex-1 flex-col items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-primary-300"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  transition={spring}
                  className="absolute inset-0 rounded-full bg-primary-100"
                />
              )}
              <item.icon
                size={22}
                strokeWidth={2}
                aria-hidden="true"
                className={`relative ${isActive ? 'text-primary-700' : 'text-muted'}`}
              />
              <span className="sr-only">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Sidebar desktop seperti gambar 7: logo, menu dalam kotak lavender, kartu promo hari berikutnya,
 * lalu profil dan dua angka kecil di bawah.
 */
function Sidebar() {
  const { settings } = useSettings();
  const data = useProgressData();
  const next = currentDay(data.mastered);
  const points = data.progress.reduce((sum, item) => sum + item.firstCorrect, 0);
  const percent = Math.round((data.mastered.size / TOTAL_DAYS) * 100);
  const name = settings.name.trim();
  const initial = (name || 'E').charAt(0).toUpperCase();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-line p-6 lg:flex">
      <div className="flex items-center gap-3">
        <Logo className="size-10" />
        <p className="text-lg font-extrabold text-ink">EngHabits</p>
      </div>

      <nav aria-label="Menu desktop" className="flex flex-col gap-1 rounded-3xl bg-bg p-2">
        {DESKTOP_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ${
                isActive ? 'bg-surface text-primary-700 shadow-card' : 'text-muted hover:text-ink'
              }`
            }
          >
            <item.icon size={20} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 rounded-3xl bg-banner p-5 text-white">
        <p className="text-sm font-semibold">Hari berikutnya</p>
        <p className="text-xl font-extrabold">{next ? `Hari ke-${next}` : 'Semua selesai'}</p>
        {next && (
          <Link
            to={`/hari/${next}`}
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-primary-700"
          >
            <Play size={16} aria-hidden="true" />
            Lanjut
          </Link>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 rounded-2xl bg-bg p-3">
            <Trophy size={16} aria-hidden="true" className="text-primary-700" />
            <span className="text-base font-extrabold tabular-nums text-ink">{points}</span>
            <span className="text-[11px] font-semibold text-muted">poin</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-bg p-3">
            <span className="text-base font-extrabold tabular-nums text-ink">{percent}%</span>
            <span className="text-[11px] font-semibold text-muted">selesai</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-line p-3">
          <span className="grid size-10 place-items-center rounded-full bg-tint-sky font-extrabold text-ink">{initial}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">{name || 'Pelajar'}</span>
            <span className="block truncate text-xs text-muted">{settings.account?.email ?? 'Belum masuk'}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

/** Kerangka halaman utama: navigasi bawah di HP, frame putih dengan sidebar di layar lebar. */
export function AppShell() {
  const location = useLocation();
  useAccountSync();
  return (
    <div className="isolate relative min-h-dvh overflow-hidden bg-bg lg:p-6">
      <BackgroundArt />
      <ReminderWatcher />
      <div className="lg:mx-auto lg:flex lg:min-h-[calc(100dvh-3rem)] lg:max-w-[1240px] lg:overflow-hidden lg:rounded-[32px] lg:bg-surface lg:shadow-card">
        <Sidebar />
        <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:max-w-xl lg:mx-0 lg:max-w-none lg:min-w-0 lg:flex-1 lg:bg-surface lg:px-10 lg:pb-12 lg:pt-10">
          {/* Pindah halaman: fade dan geser 12px, 250ms. Dikunci per rute supaya setiap halaman ikut animasi masuk. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
