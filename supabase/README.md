# Permissoes e instalacao

## Novas tabelas

Nao dependa de privilegios automaticos do Supabase. Toda migration que cria
uma tabela acessada pela Data API deve declarar os GRANTs necessarios, habilitar
RLS e definir as policies correspondentes. Tabelas privadas podem permanecer
sem grants para clientes. Nao conceda CRUD a todos os papeis indiscriminadamente.

As avaliacoes de produtos sao lidas publicamente por RPC, nao por SELECT direto
na tabela. O envio tambem usa RPC autenticada. Preserve essa separacao.

## Verificacao local

Execute com o caminho de uma instalacao externa do PGlite:

```powershell
node scripts/test-product-reviews-sql.mjs "CAMINHO/PGLITE/dist/index.js"
node scripts/test-store-reviews-sql.mjs "CAMINHO/PGLITE/dist/index.js"
```

Os testes usam banco temporario e nao acessam o Supabase remoto. O primeiro
confirma que tabelas novas nao recebem acesso automatico, que service_role
recebe as permissoes explicitas e que anon nao pode acessar a tabela diretamente.
Tambem valida os fluxos de leitura, envio e moderacao de avaliacoes.

## Limite da cadeia atual

As migrations iniciais pressupõem tabelas preexistentes. Este diretorio NAO
constitui um bootstrap completo de banco vazio. Nao executar db reset no
projeto existente para testar essa mudanca. A reproducao integral exige uma
baseline de estrutura revisada e teste em ambiente separado, incluindo Auth
e Storage. Isso e independente da mudanca de grants para novas tabelas.

Uma migration local ou teste aprovado nao prova instalacao no banco remoto.

## Limite de acessos em producao — 05/11/2026

`202611050001_database_rate_limit.sql` instala contadores tecnicos isolados.
O servidor usa `consume_api_rate_limit` com service_role; a tabela fica sem
acesso direto e sem policies publicas. A funcao serializa chamadas por chave,
conta uma janela movel e remove no maximo 64 chaves expiradas ha mais de um dia
por chamada aceita. Identidades sao resumidas com SHA-256 antes de sair do servidor.
Se o banco ou a RPC falhar, checkout/webhooks/consultas continuam bloqueados.
Nao substituir por um contador local para contornar indisponibilidade.

Verificacao local: `node scripts/check-database-rate-limit.mjs`.
Instalacao remota pelo executor existente, com nome explicito e checksum;
nao modifica pedidos, produtos ou credenciais. Registro de concorrencia:
`docs/database-rate-limit-verification-2026-11-05.json`.
Reversao: reverter o codigo somente se o backend anterior estiver novamente
disponivel; preservar a tabela e o historico de instalacao ate revisao separada.
