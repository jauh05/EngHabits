import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { DayPage } from './pages/DayPage';
import { MapPage } from './pages/MapPage';
import { MistakesPage } from './pages/MistakesPage';
import { ProfilePage } from './pages/ProfilePage';
import { PracticePage } from './pages/PracticePage';
import { ReadinessPage } from './pages/ReadinessPage';
import { StatsPage } from './pages/StatsPage';

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-ink">Halaman tidak ditemukan</h1>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-btn-bg px-6 font-semibold text-btn-fg">
        Ke beranda
      </Link>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="peta" element={<MapPage />} />
          <Route path="kesalahan" element={<MistakesPage />} />
          <Route path="statistik" element={<StatsPage />} />
          <Route path="laporan" element={<ReadinessPage />} />
          <Route path="latihan" element={<PracticePage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>
        <Route path="hari/:n" element={<DayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
