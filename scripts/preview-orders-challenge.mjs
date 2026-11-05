// Local, test-only challenge viewer. Never reads the production .env or shop DB.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
const env = parseEnv(await readFile('.env.orders-test.local', 'utf8'));
const get = async path => {
  const response = await fetch('https://api.mercadopago.com' + path, {
    headers: { Authorization: 'Bearer ' + env.ORDERS_TEST_ACCESS_TOKEN }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('TEST_PROVIDER_UNAVAILABLE');
  return response.json();
};
if (!(await get('/users/me')).tags?.includes('test_user')) throw new Error('REFUSING_NON_TEST_ACCOUNT');
const escaped = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:3457');
    const name = url.pathname.split('/').pop();
    if (!['approved', 'rejected'].includes(name)) { response.writeHead(404).end(); return; }
    const session = JSON.parse(await readFile(`sandbox-runtime/credit-challenge-${name}.json`, 'utf8'));
    const challenge = new URL(session.url);
    if (!/^ORDTST[A-Z0-9]+$/.test(session.orderId) || challenge.protocol !== 'https:'
      || challenge.hostname !== 'www.mercadopago.com.br' || !challenge.pathname.startsWith('/auth/card/validation/')) throw new Error('INVALID_TEST_CHALLENGE');
    if (url.pathname.startsWith('/status/')) {
      const raw = await get('/v1/orders/' + session.orderId);
      if (raw.external_reference !== session.reference) throw new Error('TEST_REFERENCE_MISMATCH');
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ status: raw.status, detail: raw.status_detail,
        authentication: raw.transactions?.payments?.[0]?.payment_method?.transaction_security?.status || null })); return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Homologação 3DS Ozonteck</title><style>body{font:16px Arial;max-width:850px;margin:25px auto;color:#102438}iframe{width:100%;height:620px;border:1px solid #ccc;border-radius:12px}p{padding:14px;background:#e6f7f4}button{padding:12px}</style><h1>Homologação 3DS — dados fictícios</h1><p>Conta de teste confirmada. Sem pedido na loja e sem cobrança real.</p><pre id="status">Consultando...</pre><iframe title="Desafio 3DS de teste" src="${escaped(challenge.href)}"></iframe><button onclick="refresh()">Atualizar status</button><script>let timer;async function refresh(){try{const r=await fetch('/status/${name}');const s=await r.json();document.getElementById('status').textContent=JSON.stringify(s,null,2);if(['processed','failed','canceled'].includes(s.status))clearInterval(timer);}catch{document.getElementById('status').textContent='Consulta indisponível';}}refresh();timer=setInterval(refresh,15000);setTimeout(()=>clearInterval(timer),300000);</script></html>`);
  } catch { response.writeHead(503, { 'Content-Type': 'text/plain' }).end('Conferência de teste indisponível.'); }
});
server.listen(3457, '127.0.0.1', () => console.log('Test-only 3DS viewer on 127.0.0.1:3457/approved and /rejected.'));
