# Auditoria de seguranca e otimizacao - Ozonteck

Data: 2026-09-24

## 1. Resumo executivo

O projeto foi revisado nas camadas de frontend, APIs, autenticacao, autorizacao,
Supabase/RLS, Storage, checkout, webhook, dependencias e configuracao web.
Foram corrigidos riscos de manipulacao financeira, concorrencia de estoque,
forja/replay de webhook, abuso de payload, upload malicioso, exposicao excessiva
de dados, persistencia insegura de estado e duplicacao de listeners/requests.

O codigo passa por build de producao, TypeScript, ESLint e testes automatizados.
Isso reduz o risco conhecido, mas nao representa garantia de seguranca absoluta.
A entrada em producao ainda depende das acoes externas listadas na secao 8.

## 2. Arquitetura e ativos analisados

- Next.js 16 e React 19 no frontend e nas rotas de API.
- Supabase Auth, PostgreSQL, RLS e Storage.
- Mercado Pago para criacao e conciliacao de pagamentos.
- Upstash Redis para rate limiting distribuido.
- Dados pessoais: nome, email, telefone, CPF e endereco.
- Dados comerciais: produtos, estoque, pedidos, pagamentos e avaliacoes.
- Superficies administrativas: clientes, produtos, categorias e pedidos.

## 3. Descobertas e correcoes

### SEC-001 - Credenciais exibidas em capturas

- Severidade: Critica.
- Estado: Acao externa obrigatoria.
- Evidencia: credenciais com aparencia real foram exibidas durante o trabalho.
- Impacto: acesso privilegiado ao banco, pagamentos, Redis ou outros servicos.
- Correcao: rotacionar todas as chaves expostas e atualizar o `.env` local e os
  secrets do ambiente de deploy. Nenhum segredo equivalente foi encontrado nos
  arquivos rastreados ou no historico Git analisado.

### SEC-002 - Estoque e pagamento sem reserva atomica

- Severidade: Alta.
- Estado: Corrigido no codigo; depende da migration 002.
- Impacto: duas compras simultaneas poderiam consumir o mesmo estoque.
- Correcao: reserva transacional com bloqueio, idempotencia, expiracao e
  reconciliacao de aprovacao tardia. Preco e estoque continuam sendo calculados
  pelo servidor, nunca pelo navegador.

### SEC-003 - Webhook e replay

- Severidade: Alta.
- Estado: Corrigido.
- Impacto: notificacoes forjadas ou repetidas poderiam alterar pedidos.
- Correcao: validador oficial de assinatura do Mercado Pago, verificacao de
  timestamp, consulta do pagamento real na API e processamento idempotente no
  banco. A assinatura e validada antes do rate limit.

### SEC-004 - Uploads confiavam em MIME e extensao

- Severidade: Alta.
- Estado: Corrigido no cliente e no Storage; limites do bucket dependem da
  migration 002.
- Impacto: arquivo ativo, excessivo ou adulterado em bucket publico.
- Correcao: allowlist JPG/PNG/WebP, assinatura magica, limite de bytes e pixels,
  nomes aleatorios e limpeza de upload abandonado. SVG foi excluido da allowlist.

### SEC-005 - Abuso das APIs

- Severidade: Alta.
- Estado: Corrigido.
- Impacto: consumo excessivo de memoria, brute force de checkout e indisponibilidade.
- Correcao: leitura limitada e progressiva de JSON, rate limit distribuido e
  comportamento fail-closed em producao quando o Redis estiver indisponivel.

### SEC-006 - Autorizacao e exposicao de dados

- Severidade: Alta.
- Estado: Corrigido no codigo e nas migrations.
- Impacto: IDOR/BOLA, elevacao para administrador e consultas de campos pessoais
  desnecessarios.
- Correcao: RLS por proprietario, papel de administrador validado no banco,
  service role restrita ao servidor, selects explicitos e protecao contra
  alteracao do campo `role`.

### SEC-007 - Avaliacoes publicas expunham identificadores

- Severidade: Media.
- Estado: Corrigido; depende da migration 002.
- Impacto: exposicao desnecessaria de `user_id`, `pedido_id` e nome completo.
- Correcao: view publica limitada, nome abreviado e tabela original acessivel
  apenas ao proprietario ou administrador. Uma avaliacao permanece vinculada a
  um unico pedido entregue.
- Risco residual: ainda nao existe fluxo de moderacao editorial antes da
  publicacao de comentarios bem avaliados.

### SEC-008 - Autenticacao e dados pessoais

- Severidade: Media.
- Estado: Parcialmente corrigido; configuracao externa pendente.
- Correcao: senha minima de oito caracteres, validacao real de CPF, provedores
  sociais ocultos quando nao configurados, perfil social automatico e textos de
  seguranca sem promessas tecnicamente falsas.
- Pendente: habilitar protecao contra senhas vazadas, revisar redirect URLs,
  configurar MFA para administradores e validar os consoles OAuth.

### SEC-009 - Endereco principal nao atomico

- Severidade: Media.
- Estado: Corrigido; depende da migration 002.
- Impacto: concorrencia poderia deixar zero ou varios enderecos principais.
- Correcao: funcao transacional e indice parcial unico por usuario.

### SEC-010 - Dependencias e supply chain

- Severidade: Informativa.
- Estado: Verificado.
- Resultado: `npm audit` encontrou zero vulnerabilidades conhecidas nas 458
  dependencias avaliadas. Tres dependencias diretas sem uso foram removidas.

### SEC-011 - Headers web

- Severidade: Media.
- Estado: Mitigado.
- Correcao: HSTS, protecao contra framing, `nosniff`, Referrer-Policy,
  Permissions-Policy, COOP e uma CSP inicial para `base-uri`, `frame-ancestors`
  e `object-src`.
- Risco residual: uma CSP estrita com nonce para scripts deve ser introduzida em
  ambiente de homologacao para evitar quebra de Next.js, Mercado Pago e VLibras.

## 4. Otimizacoes comprovadas

- Galeria convertida para WebP: 48.428.436 bytes para 6.901.408 bytes, reducao
  de 85,7% no conjunto otimizado.
- Apenas a imagem ativa da galeria e renderizada.
- Busca por URL nao recria mais sessao, consulta de produtos e canal Realtime.
- Carrinho restaura quantidades validas sem loops de atualizacao.
- Consultas deixaram de usar `select('*')` nas areas auditadas.
- Estados e contratos criticos deixaram de usar `any`.

## 5. Validacoes executadas

- Build de producao Next.js: aprovado, 23 rotas geradas.
- TypeScript (`tsc --noEmit`): aprovado.
- ESLint em `app`, `components`, `lib`, `store` e `tests`: aprovado.
- Testes automatizados: 6 aprovados, 0 falhas.
- `npm audit`: 0 vulnerabilidades conhecidas.
- Varredura de secrets rastreados e historico Git: 0 correspondencias.

## 6. Migration obrigatoria

Executar no SQL Editor do Supabase, depois da migration 001:

`supabase/migrations/202609240002_security_hardening.sql`

Sem essa migration, reserva de estoque, view publica de avaliacoes, limites dos
buckets e endereco principal atomico nao estarao disponiveis no banco remoto.

## 7. Pontos nao destrutivos preservados

- Identidade visual, rotas, paginas e fluxos principais.
- Supabase, Mercado Pago, Upstash, login social e painel administrativo.
- Carrinho, favoritos, enderecos, pedidos e avaliacoes.
- Acessibilidade, responsividade, VLibras e configuracoes do usuario.

## 8. Checklist antes da producao

- [ ] Rotacionar todas as credenciais exibidas em capturas.
- [ ] Executar e conferir a migration 002 no Supabase.
- [ ] Configurar `Site URL` e redirect URLs de producao no Supabase Auth.
- [ ] Confirmar Google/OAuth com dominio real e credenciais de producao.
- [ ] Ativar protecao de senha vazada e MFA para administradores.
- [ ] Definir `MP_WEBHOOK_URL` HTTPS permanente, sem tunnel temporario.
- [ ] Simular webhook assinado e realizar pagamento de teste ponta a ponta.
- [ ] Confirmar Upstash em producao e alertas para indisponibilidade.
- [ ] Configurar backups e executar um teste real de restauracao.
- [ ] Revisar logs/alertas sem armazenar CPF, token ou segredo.
- [ ] Executar DAST/pentest autorizado em staging.

## 9. Limitacoes da auditoria

Nao foram executados pagamento real, ataque ativo, restauracao de backup,
inspecao de DNS/TLS de producao ou verificacao dos consoles externos de OAuth,
Mercado Pago, Supabase e deploy. Esses controles precisam ser validados no
ambiente de homologacao antes da publicacao.
