const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parseEnv } = require('node:util');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const base = parseEnv(fs.readFileSync('.env', 'utf8'));
const live = process.argv.includes('--live');
const test = live ? base : parseEnv(fs.readFileSync('.env.payment-test', 'utf8'));
assert.ok(test.MP_ACCESS_TOKEN?.startsWith(live ? 'APP_USR-' : 'TEST-'));
assert.ok(test.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith(live ? 'APP_USR-' : 'TEST-'));
assert.ok(base.MP_WEBHOOK_SECRET);
fs.mkdirSync('sandbox-runtime', {recursive:true});
let server, started=false, output='';
const tunnel=spawn('C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',['tunnel','--url','http://127.0.0.1:3013','--no-autoupdate'],{windowsHide:true});
const log=fs.createWriteStream('sandbox-runtime/store-tunnel.log',{flags:'a'});
const stop=()=>{server?.kill();tunnel.kill();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('exit',stop);
const timer=setTimeout(()=>{if(!started)stop();},90000);
function receive(chunk){
  log.write(chunk);output=(output+chunk.toString()).slice(-16000);
  const match=output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if(!match||started)return;
  started=true;clearTimeout(timer);
  const url=match[0];
  const env={...process.env,...base,MP_ACCESS_TOKEN:test.MP_ACCESS_TOKEN,NEXT_PUBLIC_MP_PUBLIC_KEY:test.NEXT_PUBLIC_MP_PUBLIC_KEY,
    MP_WEBHOOK_URL:url+'/api/webhook',NEXT_PUBLIC_SITE_URL:url,PAYMENT_SANDBOX:String(!live),NEXT_PUBLIC_PAYMENT_SANDBOX:String(!live),STORE_TUNNEL:'true',LIVE_TEST_PRODUCT:live?'TESTE-001':'',NEXT_PUBLIC_LIVE_TEST_PRODUCT:live?'TESTE-001':''};
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3013'],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  const logs=fs.createWriteStream('sandbox-runtime/store-server.log',{flags:'a'});
  server.stdout.pipe(logs);server.stderr.pipe(logs);
  server.on('exit',()=>tunnel.kill());server.on('error',stop);
  fs.writeFileSync('sandbox-runtime/store-status.json',JSON.stringify({url,product:url+'/produto/TESTE-001',webhook:env.MP_WEBHOOK_URL,port:3013,serverPid:server.pid,tunnelPid:tunnel.pid,supervisorPid:process.pid,startedAt:new Date().toISOString(),database:'existing',payments:live?'LIVE':'TEST'},null,2));
  console.log(url);
}
tunnel.stdout.on('data',receive);tunnel.stderr.on('data',receive);
tunnel.on('error',()=>{clearTimeout(timer);stop();});tunnel.on('exit',()=>{clearTimeout(timer);server?.kill();});
