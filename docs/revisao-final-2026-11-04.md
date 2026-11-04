# Revisão de continuidade — 04/11/2026

Este registro não declara conclusão integral do projeto.

## Evidências desta revisão

- `npm test`: 81 testes passaram, sem falhas. Abrange regras de pedidos, pagamentos Orders, endereços, carrinho, relatórios, conteúdo e notificações. Não comprova operação bancária nem entrega na caixa de entrada.
- Categorias já possuem arquivamento e restauração no código. Ainda é necessária a conferência do fluxo autenticado com persistência no banco.
- O suporte atual encaminha ao WhatsApp. Não existe protocolo interno que possa disparar legitimamente `support_received`; o modelo isolado não significa suporte recebido.
- Retirada pronta não possui estado operacional próprio. Não emitir esse e-mail ao aprovar o pagamento, pois aprovação não prova preparação concluída.
- O CardPayment instalado não oferece callback de foco por campo na interface pública. Não capturar dados de cartão nem depender de acesso ao conteúdo dos campos protegidos para implementar ajuda de CVV.
- A fila de despacho passa a exigir `approved`, em coerência com os totais financeiros. A atualização confirma retorno de uma linha do banco antes de informar sucesso.

## Dependências ainda abertas

- Conferir entrega real dos e-mails e ligar os eventos operacionais de suporte/retirada após implementar os respectivos fluxos.
- Revisão visual autenticada do cartão e validação individual dos meios de pagamento; não gerar cobranças durante inspeção.
- Concluir levantamento das referências e implementar recursos aplicáveis com persistência, permissões e regras definidas.
- Conferir arquivamento/restauração, produtos vinculados, múltiplos endereços e alterações com aviso administrativo na loja publicada.
- Google recebeu nome/descrição/ícone atualizados no site. A nova solicitação de leitura foi recusada por cota diária; a atualização do resultado depende de novo rastreamento.

Fiado e carnê excluídos; PWA futuro. A marcação de suporte e retirada acima identifica trabalho pendente, não uma restrição definitiva desses recursos.
