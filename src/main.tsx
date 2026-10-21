import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/index.css';
import { App } from './App';
import { ToastProvider } from './components/ui/Toast';
import { SettingsProvider } from './lib/settings';

function Providers({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <SettingsProvider>
        <ToastProvider>{children}</ToastProvider>
      </SettingsProvider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById('root')!);

// Katalog /design hanya dimuat di mode dev, jadi dihapus dari build produksi.
if (import.meta.env.DEV && window.location.pathname === '/design') {
  void import('./pages/DesignCatalog').then(({ DesignCatalog }) => {
    root.render(
      <Providers>
        <DesignCatalog />
      </Providers>,
    );
  });
} else {
  root.render(
    <Providers>
      <App />
    </Providers>,
  );
}
