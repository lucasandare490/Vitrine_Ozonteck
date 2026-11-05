# Comparação e continuidade — 30/10/2026

Este registro distingue observação, implementação e publicação. Não é declaração de equivalência completa com os sites de referência.

## Google

- Propriedade com prefixo `https://ozonteck-recife.netlify.app/` verificada no Search Console.
- Arquivo de verificação publicado no commit aa97e6e.
- Sitemap observado como processado, com 113 páginas. Isso não garante indexação nem posição nos resultados.
- Em 03/11/2026: robots.txt, sitemap.xml e arquivo de verificação responderam HTTP 200; sitemap com 113 URLs. Search Console mostrou última leitura em 01/11, status Processado. Relatório de indexação ainda informa dados em processamento.

## Referências e decisões

| Função observada | Situação da loja / encaminhamento |
| --- | --- |
| Catálogo, categorias, preços e estoque | Já existem; preservar fonte de dados e administração atuais. |
| Cadastro, pedidos e acompanhamento | Já existem; não substituir o fluxo de confirmação após pagamento. |
| Relatórios por período, produtos e clientes | Publicado em `/admin/relatorios`, com exportação CSV. Navegação autenticada confirmou carregamento e filtros: outubro mostra 1 pedido/R$ 9,99; todo o histórico mostra 9 pedidos/R$ 1.449,39. Em 03/11 o CSV foi baixado pelo botão e conferido: nove registros, cabeçalho, valores e datas coerentes com o relatório. |
| Clientes sem compra recente | Acrescentados filtros de 30/60 dias sem compra, compras recentes e ausência de compra confirmada, última compra, quantidade e total por conta. Carregamento paginado e mensagem de contato copiável, sem envio automático. Validação local concluída; conferir publicação. |
| Lucro e pontos | Não calcular sem custos, taxas e regras de pontuação confiáveis. Total vendido não é lucro. |
| Fiado e carnê | Excluídos do escopo por decisão expressa do usuário. |
| Comprovante do Ozon Vendas | A própria página inspecionada é uma proposta visual com dados de exemplo; diz que envio em texto, imagem e PDF será aplicado após aprovação. Não tratar isso como função real comprovada. |
| Lembretes e mensagens de WhatsApp | Referência tem textos de recompra, cobrança, aniversário e reativação. Notificações de celular são indicadas como futuras pela própria referência. Não enviar mensagens sem ação/autorização do usuário. |
| Importação de produtos | Referência aceita lista e sugere preço 2x custo. Não aplicar esse cálculo automaticamente ao catálogo oficial da loja. |
| Captação de interessados | A loja tem página de oportunidade e links oficiais; referência possui formulário nome/e-mail/WhatsApp. Avaliar fluxo e consentimento antes de adicionar persistência. |
| PWA / aplicativo | Explicitamente reservado para etapa futura. |

Revisão adicional em 03/11: histórico da referência não contém vendas nesta conta, portanto não foi possível comprovar os detalhes de uma venda real sem criar dados. Minha conta exibe dados cadastrais, plano gratuito limitado a 10 clientes e exclusão irreversível. Nenhuma conta ou venda foi excluída. O relatório de clientes da nossa loja agrupa por conta cadastrada, não por nome do destinatário de cada pedido.

### Conciliação financeira em 03/11

A conferência posterior do banco encontrou oito registros `entregue/pending`, um `preparando/approved`, um `pending/pending` e uma reserva expirada. Os totais antigos acima são evidência da versão anterior, não valores financeiros conciliados. Não foi estabelecida a origem dos oito registros legados; nenhum foi apagado ou aprovado manualmente.

Visão geral, relatórios e atividade de clientes passam a usar a mesma regra: pagamento `approved` e pedido em preparação, enviado ou entregue. Divergências continuam na auditoria e ganham aviso e links no relatório, fora do faturamento. Histórico completo deve apresentar uma venda aprovada de R$ 9,99 com os dados observados nesta data. Auditoria e visão geral agora carregam todas as páginas do banco; relatório e carteira de clientes atualizam ao focar a aba e a cada 30 segundos. Testes cobrem entrega sem aprovação, reembolso, paginação acima de mil registros e falha sem exposição de resultado parcial.

## E-mails

### Conferência publicada em 04/11/2026

- Netlify mostrou o commit `6693512` publicado; o rodapé da loja exibiu Visa, Mastercard, Elo, American Express, boleto e Pix.
- Relatório autenticado, opção Todo o histórico: uma venda paga, R$ 9,99, e oito divergências financeiras fora do total. O link de uma divergência abriu o pedido correspondente na auditoria com o aviso de conferência.
- Captura local: `docs/evidencias/relatorio-conciliado-2026-11-04.png`.
- Encontrada e corrigida outra inferência antiga: a linha do tempo do cliente chamava entrega/preparação de pagamento aprovado. Agora consulta `status_pagamento` e só exibe Pago quando esse campo confirma aprovação. O estado de entrega continua preservado. Nove testes relacionados, ESLint dos arquivos alterados e compilação de produção passaram.
- Essa conferência não comprova entrega de e-mails na caixa de entrada, indexação efetiva no Google ou equivalência completa com as referências. Essas pendências continuam abertas.

- Na primeira inspeção, o Supabase usava os modelos padrão e não tinha SMTP próprio; essa situação foi corrigida na retomada.
- Recuperação de senha usa Supabase Auth. Não foi localizado envio de e-mails de pedidos no código pesquisado.
- Não confundir comprovantes enviados pelo Mercado Pago com notificações enviadas pela loja.
- `lib/customer-email.ts`: modelo HTML responsivo e versão texto para boas-vindas, pagamento pendente/aprovado/recusado, alteração, envio, retirada, entrega, cancelamento, reembolso confirmado e recebimento de suporte.
- Essa função **somente renderiza**; o envio agora é feito separadamente pela função agendada `customer-emails`. Consulte [estado e limites do envio](email-delivery.md).
- Remetente: `ozonteckrecife2@gmail.com`. O titular ativou a verificação em duas etapas e forneceu uma senha de aplicativo. SMTP foi configurado no Supabase e na Netlify; nenhuma credencial foi adicionada ao código. Autenticação Gmail aceita em 01/11/2026; recebimento na caixa de entrada ainda não conferido.
- Modelos de autenticação devem preservar tokens e links gerados pelo Supabase; não gerar links de recuperação no navegador.
- Fila persistente, deduplicação, reservas e tentativas limitadas instaladas no banco. Função publicada e executada com fila vazia; falha no envio não desfaz pagamento ou pedido.
- Não enviar confirmação de reembolso sem evento confirmado; não anunciar retirada pronta sem essa informação operacional.

## Pagamento visual

- Seleção local atualizada com ícones de Pix/cartão/boleto, destaque da opção escolhida, descrições e foco por teclado.
- Não altera criação de cobranças nem credenciais.
- Seleção estilizada publicada anteriormente no commit `1f9f729`; revisão visual completa do cartão continua pendente. A ajuda CVV aparece somente na modalidade cartão; exibição especificamente ao focar o campo ainda não implementada.

## Verificações desta retomada

- TypeScript passou antes da inclusão dos modelos de e-mail.
- ESLint dos relatórios e checkout passou após correção que também preserva filtros ao atualizar.
- Seis testes de relatórios/modelos de e-mail passaram: datas de Recife, apenas pedidos confirmados, cálculos, proteção CSV, escape HTML e restrição de links ao domínio da loja.
- Compilação Turbopack encontrou falha de rede em Google Fonts e depois erro interno ao iniciar processo de CSS no Windows. `next build --webpack` concluiu com sucesso, incluindo TypeScript e geração de todas as páginas.
- ESLint dos modelos de e-mail passou.

## Atualização consolidada — 05/11/2026

As observações acima preservam o histórico e não substituem a situação atual em `revisao-final-2026-11-04.md`.

| Recurso aplicável das referências | Situação verificada |
| --- | --- |
| Catálogo, busca, filtros, preços e administração | Existentes; editor e prévia de atualização CSV conferidos na loja publicada, sem gravar alterações de ensaio. |
| Captação e acompanhamento de interessados | Formulário autenticado/consentimento, persistência e lista administrativa; testes SQL e consulta publicada sem erro. Não equivale ao cadastro oficial da rede. |
| Importação de informações | CSV de preço/estoque de códigos já existentes, prévia e confirmação atômica; cadastro de novos produtos permanece no formulário próprio. Não importa automaticamente clientes ou dados financeiros de outro sistema. |
| Lembretes | Agenda administrativa persistente com concluir/reabrir; sem mensagem automática de cobrança ou WhatsApp. |
| Pedidos, relatórios e clientes | Aprovação financeira compartilhada; uma venda de R$ 9,99 e oito legados em conferência, preservados fora do faturamento. Filtro do cliente corrigido para não chamar reserva expirada de pedido confirmado. |
| Suporte e retirada | Protocolo, resposta, fila deduplicada; retirada por ação explícita em pedido elegível. SQL/componentes testados; não foi mudado um pedido real para fabricar prova de e-mail. |
| Identidade dos e-mails | Uma entrega real em português comprovada na caixa da loja, com modelo/SMTP reais. Ciclo individual de todos os eventos remotos ainda não comprovado. |
| Cartão e CVV | Secure Fields oficiais; ajuda abre no foco real do CVV e fecha ao sair. Aprovação/recusa/3DS e débito dependem da validação do provedor, adiada pelo titular. |
| Rodapé e métodos de pagamento | Logos institucionais dos meios já publicados e visíveis na vitrine. |

Fora do escopo por decisão do titular: fiado/carnê; PWA/aplicativo ficam para depois. Não reproduzir cobrança premium, alegações de renda/saúde, prévia de comprovante demonstrativa nem indicadores de lucro/pontos sem fontes e regras reais. A loja não é declarada equivalente a 100% de ambos os sistemas.

### Conferência posterior em 05/11

- Mensagens prontas aplicáveis: Atendimento, Recompra e Retomar contato disponíveis para copiar na carteira, com nome, link da loja e preferência de contato. Sem envio automático. Aniversário sem data e cobrança de dívida não confirmada não são inferidos.
- CVV conferido no formulário publicado: abre no foco/fecha ao sair. Ensaios isolados com a conta test_user do provedor confirmaram Pix aprovado, emissão/cancelamento de boleto e aprovação/recusa/3DS/reembolso de crédito. Débito devolveu restrição da conta de teste e permanece sem aprovação comprovada. Ver `payment-review-2026-11-04.md`.
- O deploy `62733db` foi confirmado publicado e a consulta de pagamento antigo voltou a funcionar com o limite distribuído no PostgreSQL. Evidência e pendências externas estão na revisão final, mantendo os registros anteriores como histórico.
