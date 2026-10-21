import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/plus-jakarta-sans';
import './styles/index.css';
import { App } from './App';
import { ToastProvider } from './components/ui/Toast';

function Providers({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
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
