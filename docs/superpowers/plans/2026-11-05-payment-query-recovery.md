# Recuperação das consultas de pagamento — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restaurar o limite distribuído e alinhar os pedidos do cliente à confirmação financeira.

**Architecture:** Em produção, o limite passa a usar uma função atômica do PostgreSQL já contratado. Cada identidade é resumida com SHA-256; uma janela móvel mantém os limites atuais, com bloqueio se o banco falhar. Nenhuma cobrança ou credencial de pagamento muda. Pedidos antigos continuam acessíveis em Todo o histórico.

**Tech Stack:** Next.js existente, PostgreSQL/Supabase, Node.js, PGlite.

**Spec:** Comando de continuidade do titular; manter checkout, dados históricos, segurança e infraestrutura gratuita. Falha observada: endereço Upstash publicado não resolve DNS (ENOTFOUND); consulta autenticada mostra indisponibilidade. A aba confirmados também incluía reserva expirada.

## Restrições e revisão

- Não usar limite local em produção nem liberar acesso quando o armazenamento falhar.
- Função acessível exclusivamente ao servidor; tabela sem acesso público/cliente.
- Concorrência deve compartilhar a mesma contagem, limites independentes por rota e identidade.
- Expirar registros antigos e limitar o volume de cada janela; não guardar IP/usuário em texto.
- Preservar produção financeira; teste publicado consulta cobrança antiga, sem gerar outra.

## Tarefas

- [x] Reproduzir filtro divergente, escrever teste falhando e corrigir `lib/confirmed-sale.ts` / `app/conta/pedidos/page.tsx`; incluir histórico completo.
- [x] Criar teste SQL de janela móvel, isolamento, concorrência serializada, expiração, permissões e falha de parâmetros.
- [x] Criar migração aditiva `202611050001_database_rate_limit.sql`; não alterar migrações instaladas.
- [x] Criar `lib/server/database-rate-limit.ts` e teste de transporte/falhas; integrar produção em `lib/server/http.ts`.
- [x] Executar testes, lint e build; instalar incremento por executor com checksum.
- [x] Publicar, conferir pedido confirmado/histórico e consulta existente; registrar evidências e limitações do provedor legado.
- [x] Atualizar documentação final e checklist, mantendo histórico.

## Evidência de encerramento deste plano — 05/11/2026

Commit `62733dbe6df21ee06cafc2678e447b3072f81b7e`, deploy Netlify `6aec0abaf651cdf48285cc33`, Published às 01:50 de Recife. Consulta antiga voltou a mostrar expiração e opções de alteração, em vez da falha de limite. Pedidos confirmados mostrou somente a compra aprovada; Todo o histórico preservou as três compras da conta. Teste remoto concorrente: três aceites/nove negativas. Sete testes HTTP de SEO passaram contra produção. Nenhuma cobrança nem alteração financeira foi feita.

Ruling: completar os modelos copiáveis de atendimento, recompra e retomada na carteira de clientes — recurso aplicável das referências já solicitado; não envia contatos nem inventa aniversários, dívidas, descontos ou regras comerciais.
