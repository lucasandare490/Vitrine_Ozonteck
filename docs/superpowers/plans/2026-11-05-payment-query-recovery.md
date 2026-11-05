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
- [ ] Criar teste SQL de janela móvel, isolamento, concorrência serializada, expiração, permissões e falha de parâmetros.
- [ ] Criar migração aditiva `202611050001_database_rate_limit.sql`; não alterar migrações instaladas.
- [ ] Criar `lib/server/database-rate-limit.ts` e teste de transporte/falhas; integrar produção em `lib/server/http.ts`.
- [ ] Executar testes, lint e build; instalar incremento por executor com checksum.
- [ ] Publicar, conferir pedido confirmado/histórico e consulta existente; registrar evidências e limitações do provedor legado.
- [ ] Atualizar documentação final e checklist, mantendo histórico.
