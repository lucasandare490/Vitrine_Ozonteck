'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';
import { setInstallPrompt, type InstallPrompt } from '@/lib/pwa-install';

export default function AppRuntime() {
  const pathname = usePathname();
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const manualUpdate = useRef(false);
  useEffect(() => {
    let disposed = false;
    const registrations: ServiceWorkerRegistration[] = [];
    const cleanups: Array<() => void> = [];
    const network = () => setOffline(!navigator.onLine);
    const timer = window.setTimeout(network, 0);
    window.addEventListener('online', network); window.addEventListener('offline', network);
    const installAvailable = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', installAvailable); window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const controller = () => { if (manualUpdate.current) window.location.reload(); };
      navigator.serviceWorker.addEventListener('controllerchange', controller);
      cleanups.push(() => navigator.serviceWorker.removeEventListener('controllerchange', controller));
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(registration => {
        if (disposed) return;
        registrations.push(registration);
        if (registration.waiting) setWaiting(registration.waiting);
        const updateFound = () => {
          const worker = registration.installing;
          if (!worker) return;
          const changed = () => { if (!disposed && worker.state === 'installed' && navigator.serviceWorker.controller && registration.waiting) setWaiting(registration.waiting); };
          worker.addEventListener('statechange', changed);
          cleanups.push(() => worker.removeEventListener('statechange', changed));
        };
        registration.addEventListener('updatefound', updateFound);
        cleanups.push(() => registration.removeEventListener('updatefound', updateFound));
      }).catch(() => { /* Installation is optional; normal online navigation remains available. */ });
    }
    const visible = () => { if (!document.hidden) for (const registration of registrations) void registration.update().catch(() => undefined); };
    document.addEventListener('visibilitychange', visible);
    return () => { disposed = true; window.clearTimeout(timer); window.removeEventListener('online', network); window.removeEventListener('offline', network); window.removeEventListener('beforeinstallprompt', installAvailable); window.removeEventListener('appinstalled', installed); document.removeEventListener('visibilitychange', visible); cleanups.forEach(cleanup => cleanup()); };
  }, []);
  return <div className="app-runtime-status">
    {offline && <div role="status" className="app-connection-notice"><WifiOff size={18} aria-hidden="true" /><p>Sem conexão. Reconecte para consultar preços, pedidos e pagamentos.</p></div>}
    {waiting && !offline && pathname !== '/lista' && <div role="status" className="app-update-notice"><p>Uma nova versão da loja está pronta.</p><button type="button" onClick={() => {
      if (!window.confirm('A página será recarregada. Salve alterações em formulários antes de continuar. Atualizar agora?')) return;
      manualUpdate.current = true; waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
    }}><RefreshCw size={16} aria-hidden="true" />Atualizar</button></div>}
    {offline && <Link href={pathname} className="sr-only focus:not-sr-only">Tentar carregar esta página novamente</Link>}
  </div>;
}
