import { motion } from 'motion/react';
import { BarChart3, BookX, Dumbbell, Home, LayoutGrid, User, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { easeOut, spring } from '../../lib/motion';
import { ReminderWatcher } from './ReminderWatcher';

type NavItem = { to: string; label: string; icon: LucideIcon };

const MOBILE_ITEMS: NavItem[] = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/peta', label: 'Peta', icon: LayoutGrid },
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
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full bg-ink p-2 shadow-card lg:hidden"
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
                  className="absolute inset-0 rounded-full bg-surface"
                />
              )}
              <item.icon
                size={22}
                strokeWidth={2}
                aria-hidden="true"
                className={`relative ${isActive ? 'text-primary-700' : 'text-surface/80'}`}
              />
              <span className="sr-only">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 border-r border-line bg-surface p-4 lg:flex">
      <p className="px-3 pb-6 pt-2 text-xl font-extrabold text-primary-700">EngHabits</p>
      {DESKTOP_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
              isActive ? 'bg-primary-100 text-primary-700' : 'text-muted hover:bg-bg'
            }`
          }
        >
          <item.icon size={20} aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}

/** Kerangka halaman utama: navigasi bawah di HP, sidebar di layar lebar. */
export function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-dvh">
      <ReminderWatcher />
      <Sidebar />
      <div className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:max-w-xl lg:max-w-4xl lg:pb-12 lg:pl-64 lg:pr-8 lg:pt-10">
        {/* Pindah halaman: fade dan geser 12px, 250ms. Dikunci per rute supaya setiap halaman ikut animasi masuk. */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <Outlet />
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
