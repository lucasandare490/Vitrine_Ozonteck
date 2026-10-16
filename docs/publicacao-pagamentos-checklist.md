# Publicacao e troca da conta de pagamentos

## Preparado em 13/10/2026

- Recuperacao autenticada de Pix/boleto nos pedidos, consulta automatica e nenhuma nova cobranca para reabrir instrucoes.
- Migration 202610130002_payment_lifecycle.sql testada em PostgreSQL temporario: preserva enviado/entregue em aprovacao repetida; ignora eventos atrasados apos aprovacao/reembolso; reembolso nao significa retorno fisico ao estoque.
- A migration nova NAO foi aplicada ao Supabase remoto nesta etapa. Revisar a definicao instalada antes da aplicacao e confirmar permissoes service_role depois. Nao executar scripts de teste contra pedidos reais.

## Troca de conta

1. Concluir ou tratar as cobrancas pendentes da conta antiga. Trocar credenciais nao transfere pagamentos antigos; a consulta deles pode falhar com credenciais de outra conta. Definir suporte ao historico antes da troca.
2. Criar a aplicacao na conta autorizada do vendedor. Login, MFA e verificacao de identidade ficam com o titular.
3. Configurar NEXT_PUBLIC_MP_PUBLIC_KEY, MP_ACCESS_TOKEN e MP_WEBHOOK_SECRET no ambiente da hospedagem. Nao salvar valores em documentacao ou Git.
4. Configurar NEXT_PUBLIC_SITE_URL e MP_WEBHOOK_URL (HTTPS definitivo, caminho /api/webhook); atualizar URLs autorizadas do Supabase Auth e provedores de login.
5. Configurar Supabase e limite distribuido de requisicoes no servidor. Conferir flags PAYMENT_SANDBOX e NEXT_PUBLIC_PAYMENT_SANDBOX para o ambiente correto.
6. Recompilar/reiniciar: variaveis NEXT_PUBLIC sao incorporadas ao frontend. Executar scripts/check-payment-readiness.mjs com arquivo seguro do ambiente alvo; esse teste verifica configuracao, nao certifica operacao.
7. Validar conta beneficiaria, notificacao assinada, banco, estoque e telas com cada meio que sera oferecido. Debito nao esta habilitado atualmente.

## Antes de abrir vendas

- Informar estoque fisico real; ocultar produtos de teste sem apagar historico.
- Definir frete. Atualmente o pagamento nao inclui frete e a entrega depende de combinacao com a loja.
- Validar login/retorno de autenticacao no dominio definitivo e acesso administrativo com MFA.
- Conferir pagamentos aprovados, recusados, expirados e reembolsados. Reembolso financeiro nao e implementado por estes ajustes: nenhuma devolucao de dinheiro e disparada automaticamente.
- Verificar concorrencia no ambiente de homologacao antes de afirmar cobertura completa de estoque.
- Tunel temporario nao substitui hospedagem permanente; computador desligado interrompe o atendimento.
