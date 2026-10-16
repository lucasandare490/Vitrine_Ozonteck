import fs from 'node:fs';
import { parseEnv } from 'node:util';

// Read only: never log credential values or contact external services.
const file = process.argv[2] || '.env';
const env = parseEnv(fs.readFileSync(file,'utf8'));
const checks = [];
const add = (name, ok, detail) => checks.push({name,ok,detail});
function publicHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && !url.search && !url.hash
      && !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(url.hostname)
      && !url.hostname.endsWith('.invalid') && !url.hostname.endsWith('.local')
      && !url.hostname.endsWith('.trycloudflare.com');
  } catch {return false;}
}
add('Endereco publico do site',publicHttps(env.NEXT_PUBLIC_SITE_URL),'Exige HTTPS estavel, sem localhost ou tunel temporario.');
add('Endereco de notificacoes',publicHttps(env.MP_WEBHOOK_URL),'Exige HTTPS estavel. Acessibilidade e propriedade precisam de verificacao separada.');
let correctPath=false;
try {correctPath=new URL(env.MP_WEBHOOK_URL).pathname==='/api/webhook';} catch {}
add('Caminho de notificacoes',correctPath,'Deve terminar em /api/webhook.');
add('Credenciais de pagamento para publicacao',Boolean(env.MP_ACCESS_TOKEN?.startsWith('APP_USR-')&&env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('APP_USR-')),
  'Prefixo apenas; nao comprova identidade da conta, permissao ou homologacao.');
add('Assinatura de notificacoes',Boolean(env.MP_WEBHOOK_SECRET?.trim()),'Deve corresponder ao segredo configurado no painel.');
add('Limite distribuido de requisicoes',Boolean(env.UPSTASH_REDIS_REST_URL?.trim()&&env.UPSTASH_REDIS_REST_TOKEN?.trim()),
  'O checkout bloqueia requisicoes em producao sem o servico de limite configurado.');
add('Configuracao Supabase',Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim()&&env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()&&env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  'Presenca apenas; nao verifica banco, migracoes ou permissoes.');
console.log(JSON.stringify({scope:'Configuracao local, sem rede ou pagamentos. Nao certifica prontidao de producao.',checks},null,2));
if(checks.some(check=>!check.ok))process.exitCode=1;
