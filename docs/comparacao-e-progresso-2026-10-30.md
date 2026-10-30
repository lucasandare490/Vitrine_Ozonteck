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
| Relatórios por período, produtos e clientes | Implementação local em `/admin/relatorios`, com exportação CSV. Ainda requer validação visual e publicação. |
| Lucro e pontos | Não calcular sem custos, taxas e regras de pontuação confiáveis. Total vendido não é lucro. |
| Fiado e carnê | Não habilitar nesta etapa, conforme decisão conversada. |
| Comprovante do Ozon Vendas | A própria página inspecionada é uma proposta visual com dados de exemplo; diz que envio em texto, imagem e PDF será aplicado após aprovação. Não tratar isso como função real comprovada. |
| Lembretes e mensagens de WhatsApp | Referência tem textos de recompra, cobrança, aniversário e reativação. Notificações de celular são indicadas como futuras pela própria referência. Não enviar mensagens sem ação/autorização do usuário. |
| Importação de produtos | Referência aceita lista e sugere preço 2x custo. Não aplicar esse cálculo automaticamente ao catálogo oficial da loja. |
| Captação de interessados | A loja tem página de oportunidade e links oficiais; referência possui formulário nome/e-mail/WhatsApp. Avaliar fluxo e consentimento antes de adicionar persistência. |
| PWA / aplicativo | Explicitamente reservado para etapa futura. |

## E-mails

- Painel Supabase autenticado confirmou uso dos modelos padrão e ausência de SMTP próprio configurado.
- Recuperação de senha usa Supabase Auth. Não foi localizado envio de e-mails de pedidos no código pesquisado.
- Não confundir comprovantes enviados pelo Mercado Pago com notificações enviadas pela loja.
- `lib/customer-email.ts`: modelo HTML responsivo e versão texto para boas-vindas, pagamento pendente/aprovado/recusado, alteração, envio, retirada, entrega, cancelamento, reembolso confirmado e recebimento de suporte.
- Essa função **somente renderiza**. Ainda não envia mensagens e não está ligada aos eventos. A ativação depende de remetente e serviço de envio reais.
- Modelos de autenticação devem preservar tokens e links gerados pelo Supabase; não gerar links de recuperação no navegador.
- Antes de ativar envio: implementar persistência de eventos, prevenção de duplicidade, tentativas controladas e observabilidade. Falha de e-mail não pode desfazer pagamento ou pedido.
- Não enviar confirmação de reembolso sem evento confirmado; não anunciar retirada pronta sem essa informação operacional.

## Pagamento visual

- Seleção local atualizada com ícones de Pix/cartão/boleto, destaque da opção escolhida, descrições e foco por teclado.
- Não altera criação de cobranças nem credenciais.
- Falta concluir avaliação visual no navegador e publicação.

## Verificações desta retomada

- TypeScript passou antes da inclusão dos modelos de e-mail.
- ESLint dos relatórios e checkout passou após correção que também preserva filtros ao atualizar.
- Seis testes de relatórios/modelos de e-mail passaram: datas de Recife, apenas pedidos confirmados, cálculos, proteção CSV, escape HTML e restrição de links ao domínio da loja.
- Compilação Turbopack encontrou falha de rede em Google Fonts e depois erro interno ao iniciar processo de CSS no Windows. `next build --webpack` concluiu com sucesso, incluindo TypeScript e geração de todas as páginas.
- ESLint dos modelos de e-mail passou.
