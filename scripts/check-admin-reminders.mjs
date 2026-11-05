import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
const admin='00000000-0000-0000-0000-000000000001';
try {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('app.uid',true),'')::uuid$$;
    create function public.is_admin() returns boolean language sql stable as $$select coalesce(current_setting('app.admin',true),'false')='true'$$;
    create function public.account_mfa_allowed() returns boolean language sql stable as $$select coalesce(current_setting('app.mfa',true),'true')='true'$$;
    grant usage on schema public,auth to authenticated; grant execute on all functions in schema auth,public to authenticated;`);
  await db.exec(await readFile('supabase/migrations/202611040007_admin_reminders.sql','utf8'));
  await db.query('insert into auth.users values($1)',[admin]);
  await db.exec(`set role authenticated; set app.uid='${admin}';`);
  await assert.rejects(db.query("insert into admin_reminders(title,due_at) values('Retorno',now())"));
  await db.exec("set app.admin='true'; set app.mfa='false';");
  await assert.rejects(db.query("insert into admin_reminders(title,due_at) values('Retorno',now())"));
  await db.exec("set app.mfa='true';");
  const saved=(await db.query("insert into admin_reminders(title,note,due_at) values('Retorno de contato','Conferir solicitação',now()) returning id")).rows[0];
  await db.query('update admin_reminders set completed_at=now() where id=$1',[saved.id]);
  assert.ok((await db.query('select completed_at from admin_reminders where id=$1',[saved.id])).rows[0].completed_at);
  await db.query('update admin_reminders set completed_at=null where id=$1',[saved.id]);
  await assert.rejects(db.query('update admin_reminders set created_at=now()-interval \'1 day\' where id=$1',[saved.id]),/IMMUTABLE/);
  await assert.rejects(db.query('delete from admin_reminders where id=$1',[saved.id]));
  await db.exec("set app.admin='false';");
  assert.equal((await db.query('select * from admin_reminders')).rows.length,0);
  console.log('Reminders: admin/MFA isolation, persistence, completion/reopen, immutable author and deletion denial passed.');
} finally { await db.close(); }
