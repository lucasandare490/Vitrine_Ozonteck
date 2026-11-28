'use client';
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="pt-BR"><body style={{ margin: 0, fontFamily: 'system-ui,sans-serif', background: '#f5f8f8', color: '#153b38' }}><main style={{ maxWidth: 480, margin: '10vh auto', padding: 24 }}><h1 style={{ fontSize: 28 }}>Vamos tentar novamente?</h1><p style={{ lineHeight: 1.7 }}>Não foi possível abrir a loja. Confira sua conexão. Se estava pagando, confira seus pedidos antes de repetir a compra.</p><button onClick={reset} style={{ minHeight: 48, background: '#0f766e', color: 'white', border: 0, borderRadius: 12, padding: '12px 24px', fontSize: 16 }}>Tentar novamente</button><p><a href="/conta/pedidos">Consultar meus pedidos</a></p></main></body></html>;
}
