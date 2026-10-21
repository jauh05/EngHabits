import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-3xl font-bold text-[var(--primary-700)]">EngHabits</h1>
      <p className="text-[var(--ink)]">Bangun kebiasaan Inggris, 2 jam setiap pagi, 90 hari.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
