'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share, CheckCircle2 } from 'lucide-react';

import { getInstallPrompt, getServerInstallPrompt, setInstallPrompt, subscribeInstallPrompt } from '@/lib/pwa-install';
export default function InstallApp() {
  const prompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, getServerInstallPrompt);
  const [installed, setInstalled] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const update = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const done = () => { setInstallPrompt(null); setInstalled(true); };
    const timer = window.setTimeout(update, 0);
    display.addEventListener('change', update); window.addEventListener('appinstalled', done);
    return () => { clearTimeout(timer); display.removeEventListener('change', update); window.removeEventListener('appinstalled', done); };
  }, []);
  return <section className="rounded-3xl border border-teal-100 bg-white p-6 text-slate-900">
    {installed ? <p className="flex items-center gap-2 font-bold text-teal-800" role="status"><CheckCircle2 />Você está usando o aplicativo.</p> : <>
      {prompt && <button type="button" disabled={busy} className="action-link w-full" onClick={async () => {
        const pending = prompt; if (busy) return; setBusy(true); setMessage(''); setInstallPrompt(null);
        try { await pending.prompt(); await pending.userChoice; } catch { setMessage('O navegador não concluiu a instalação. Você pode usar as instruções abaixo.'); } finally { setBusy(false); }
      }}><Download size={20} />{busy ? 'Abrindo instalação…' : 'Instalar Ozonteck'}</button>}
      {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
      <h2 className="mb-3 mt-4 text-xl font-bold">Um atalho para cuidar de você</h2>
      <p className="text-sm leading-relaxed text-slate-600">Abra a loja pela tela inicial, com a mesma conta e os recursos disponíveis neste navegador. A instalação é opcional e não exige pagamento.</p>
      <div className="mt-5 space-y-4 text-sm leading-relaxed"><p><strong>iPhone ou iPad:</strong> no Safari, toque em Compartilhar <Share className="inline" size={16} aria-hidden="true" />, escolha “Adicionar à Tela de Início” e confirme. A opção depende da versão do sistema.</p><p><strong>Android:</strong> no Chrome, use “Instalar Ozonteck”, quando disponível, ou abra o menu e procure “Instalar aplicativo” / “Adicionar à tela inicial”.</p><p className="rounded-xl bg-teal-50 p-4 text-teal-900">Compras, preços e pedidos exigem conexão. Os dados da sua conta não ficam disponíveis no cache offline do aplicativo. Ao mudar de navegador ou usar uma sessão separada do sistema, pode ser necessário entrar novamente.</p></div>
    </>}
  </section>;
}
