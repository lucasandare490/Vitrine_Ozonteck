# Comparação e continuidade — 30/10/2026

Este registro distingue observação, implementação e publicação. Não é declaração de equivalência completa com os sites de referência.

## Google

- Propriedade com prefixo `https://ozonteck-recife.netlify.app/` verificada no Search Console.
- Arquivo de verificação publicado no commit aa97e6e.
- Sitemap observado como processado, com 113 páginas. Isso não garante indexação nem posição nos resultados.

## Referências e decisões

| Função observada | Situação da loja / encaminhamento |
| --- | --- |
| Catálogo, categorias, preços e estoque | Já existem; preservar fonte de dados e administração atuais. |
| Cadastro, pedidos e acompanhamento | Já existem; não substituir o fluxo de confirmação após pagamento. |
| Relatórios por período, produtos e clientes | Publicado em `/admin/relatorios`, com exportação CSV. Navegação autenticada confirmou carregamento e filtros: outubro mostra 1 pedido/R$ 9,99; todo o histórico mostra 9 pedidos/R$ 1.449,39. Exportação e revisão visual completa ainda pendentes. |
| Lucro e pontos | Não calcular sem custos, taxas e regras de pontuação confiáveis. Total vendido não é lucro. |
| Fiado e carnê | Excluídos do escopo por decisão expressa do usuário. |
| Comprovante do Ozon Vendas | A própria página inspecionada é uma proposta visual com dados de exemplo; diz que envio em texto, imagem e PDF será aplicado após aprovação. Não tratar isso como função real comprovada. |
| Lembretes e mensagens de WhatsApp | Referência tem textos de recompra, cobrança, aniversário e reativação. Notificações de celular são indicadas como futuras pela própria referência. Não enviar mensagens sem ação/autorização do usuário. |
| Importação de produtos | Referência aceita lista e sugere preço 2x custo. Não aplicar esse cálculo automaticamente ao catálogo oficial da loja. |
| Captação de interessados | A loja tem página de oportunidade e links oficiais; referência possui formulário nome/e-mail/WhatsApp. Avaliar fluxo e consentimento antes de adicionar persistência. |
| PWA / aplicativo | Explicitamente reservado para etapa futura. |

## E-mails

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
