const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parseEnv } = require('node:util');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const dir = path.join(root, 'sandbox-runtime');
fs.mkdirSync(dir, { recursive: true });
const test = parseEnv(fs.readFileSync('.env.payment-test', 'utf8'));
assert.ok(test.MP_ACCESS_TOKEN?.startsWith('TEST-'), 'TEST token required');
assert.ok(test.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('TEST-'), 'TEST public key required');
// Only this signature secret is reused. No Supabase configuration enters the child.
const webhookSecret = test.MP_WEBHOOK_SECRET || parseEnv(fs.readFileSync('.env', 'utf8')).MP_WEBHOOK_SECRET;
assert.ok(webhookSecret, 'Webhook signature secret required');
const access = crypto.randomBytes(24).toString('hex');
const port = 3012;
let server, tunnel;
let stopped = false;
function stop() { if (stopped) return; stopped = true; server?.kill(); tunnel?.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop); process.on('exit', stop);
const childEnv = Object.fromEntries(['SystemRoot','WINDIR','PATH','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA'].filter(k => process.env[k]).map(k => [k,process.env[k]]));
Object.assign(childEnv, { MP_ACCESS_TOKEN:test.MP_ACCESS_TOKEN, NEXT_PUBLIC_MP_PUBLIC_KEY:test.NEXT_PUBLIC_MP_PUBLIC_KEY,
  MP_WEBHOOK_SECRET:webhookSecret, SANDBOX_ACCESS:access, SANDBOX_PORT:String(port) });
if (process.argv.includes('--local')) start(`http://127.0.0.1:${port}`);
else {
  tunnel = spawn('C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', ['tunnel','--url',`http://127.0.0.1:${port}`,'--no-autoupdate'], {env:childEnv,windowsHide:true});
  const log = fs.createWriteStream(path.join(dir,'tunnel.log'),{flags:'a'});
  let output = '';
  const timeout = setTimeout(()=>{console.error('Tunnel URL timeout');stop();},90000);
  const receive = chunk => {
    log.write(chunk); output=(output+chunk.toString()).slice(-16000);
    const match=output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if(match&&!server) {clearTimeout(timeout);start(match[0]);}
  };
  tunnel.stdout.on('data',receive);tunnel.stderr.on('data',receive);
  tunnel.on('error',()=>{clearTimeout(timeout);console.error('Tunnel failed');stop();});
  tunnel.on('exit',()=>{clearTimeout(timeout);stop();});
}
function start(url) {
  childEnv.MP_WEBHOOK_URL=url+'/api/webhook';childEnv.SANDBOX_URL=url;
  server=spawn(process.execPath,['scripts/payment-sandbox-server.cjs'],{cwd:root,env:childEnv,windowsHide:true,stdio:['ignore','pipe','pipe']});
  const log=fs.createWriteStream(path.join(dir,'server.log'),{flags:'a'});
  server.stdout.pipe(log);server.stderr.pipe(log);
  server.on('error',()=>{console.error('Server failed');stop();});server.on('exit',stop);
  fs.writeFileSync(path.join(dir,'status.json'),JSON.stringify({url,link:`${url}/?access=${access}`,webhook:childEnv.MP_WEBHOOK_URL,
    port,supervisorPid:process.pid,tunnelPid:tunnel?.pid,serverPid:server.pid,isolatedDatabase:true,startedAt:new Date().toISOString()},null,2));
  console.log('Isolated sandbox starting at '+url);
}
