# Confirmações do responsável e continuidade

Data: 27/11/2026. Resposta encaminhada por Lucas: no escritório há uma aba Pedidos para cada afiliado acompanhar suas últimas compras; o estoque é por conta do centro de distribuição; o valor correto da cápsula de Visaris é **590 mg**.

## Decisões resolvidas

| Assunto | Entendimento e aplicação |
| --- | --- |
| Pedidos do escritório | São as compras do próprio afiliado no sistema da empresa, conforme explicado pelo responsável. Não presumir que sejam as vendas de varejo registradas na Vitrine. |
| Pedidos do cliente na Vitrine | A implementação já consulta as compras do usuário autenticado por `user_id`. Foi esclarecida a descrição da tela para indicar que acompanha compras feitas nesta loja. |
| Pedidos do administrador | Continuam sendo as vendas da Vitrine, com pagamento, preparação, entrega/retirada e avaliações. A descrição da auditoria foi esclarecida sem mudar consulta, totais ou status. |
| Estoque oficial | É responsabilidade do centro de distribuição. Não há sincronização automática comprovada com a quantidade cadastrada na Vitrine. A resposta não autoriza reproduzir estoque de outro centro. |
| Quantidade provisória | Lucas já explicou que o responsável atualizará as quantidades reais no nosso painel antes do início das vendas. Essa questão não será perguntada novamente como impedimento para preparar o catálogo. |
| Visaris | A apresentação preparada passa a ser **60 cápsulas de 590 mg**. Divergência de massa resolvida pela confirmação do responsável e pela foto frontal oficial. |

O esclarecimento não equivale a uma confirmação de todos os procedimentos internos/contratuais de um centro de distribuição. Não foi criado envio automático de vendas ao escritório nem uma promessa de pontos ou comissões oficiais por compras feitas na Vitrine.

## Material do Visaris preparado

- Rascunho: `visaris-cadastro-pendente-2026-11-26.json`.
- Código oficial **5002901**, EAN **7898760211513**, dimensões logísticas **5 × 11 × 5 cm**, peso logístico **110 g**.
- Foto oficial principal: `public/produtos/visaris-590mg.webp`, original recebido por download direto da URL de imagem previamente conferida no escritório, **sem edição por IA**. A presença de 590 mg foi conferida visualmente no arquivo baixado.
- SHA-256: `f59cb10be774f96f4f0e416354bd67e866b3d0ff924286999a1f4b08cbcd6c6f`.
- A divulgação anterior de 500 mg foi preservada em `public/produtos/visaris.jpg`, separada da foto principal do rascunho. Não foi alterada ou apagada.
- Preços autorizados para Visaris: **R$ 89,95 público e consultor**. Quantidade provisória solicitada anteriormente: 9999. Não foram aplicados esses valores aos outros produtos.
- `publish=false` permanece por falta de verso, composição/instruções integrais, identificação do fabricante do lote e documentação atual aplicável. A confirmação de massa não resolve essas pendências distintas. Não houve criação de oferta ativa ou alteração do estoque comercial nesta etapa.

## Conferência adicional da tabela pública

Reprocessada a comparação salva na leitura de 27/11/2026, por código/EAN, somente para os 107 produtos comerciais correspondentes ativos:

- **105 valores públicos coincidem** com os preços exibidos no catálogo oficial consultado.
- **Duas diferenças** ficaram para conferência comercial:

| Produto | Código interno | Código oficial | Vitrine na consulta | Catálogo oficial na consulta |
| --- | --- | --- | ---: | ---: |
| Férias no Caribe by Virgínia Esquivel | PERF-FER-VE | 45171 | R$ 179,90 | R$ 119,90 |
| Lua de Mel em Paris by Virgínia Esquivel | PERF-LUA-VE | 45170 | R$ 179,90 | R$ 119,90 |

Não foi inferido que a diferença seja erro, promoção permanente ou autorização para baixar preços. Esta conferência trata da tabela pública observada, **não comprova a igualdade de todos os preços de consultor**. Não se calculam preços de consultor dividindo os valores públicos por dois.

## Atualização de escopo — 28/11/2026

A quantidade provisória 9999 é decisão confirmada, sem impedimento por falta de contagem física e sem divulgar ao consumidor 9.999 unidades físicas garantidas. PWA e reformulação mobile passaram a ser escopo atual; implementação e validação técnica estão em [mobile-pwa-ux-2026-11-28.md](mobile-pwa-ux-2026-11-28.md). Pesquisa com participantes reais foi adiada por decisão do usuário, sem bloquear a entrega de código. As confirmações comerciais e documentais abaixo não foram presumidas.

## Pendências mantidas separadas

1. Confirmar a comercialização dos sete itens adicionais: Supremo Elixir de 100 ml e seis WO3 de 300 ml. Visaris já possui aprovação de inclusão e não é perguntado novamente como intenção comercial.
2. Definir a regra geral de preços comum/consultor e conferir as diferenças acima. O controle de ativação/desativação por cliente já foi implementado; a tabela não foi alterada por uma interpretação da resposta sobre Pedidos.
3. Obter o verso e a documentação do Visaris. Não voltar a perguntar 500/590 mg.
4. Retomar a inspeção visual e responsiva da carteira quando o controle de navegador estiver disponível. Nova tentativa nesta retomada retornou indisponibilidade do acesso local para esta conversa.
5. Publicar e validar no domínio público quando houver acesso autorizado e hospedagem liberada. Não há token ou identificação de projeto Netlify configurados no ambiente local conferido; a última leitura autenticada ainda indicava limite de créditos. Isso não é uma nova consulta à cota.
6. As dependências anteriores de débito, compensação de boleto, entrega individual dos eventos de e-mail, Google e dados históricos continuam no documento principal. Esta confirmação não serve como prova de conclusão desses fluxos.

## Verificações desta retomada

Foram verificados o arquivo de imagem WebP e seu hash, a preservação da arte anterior, a apresentação de 590 mg nos dois rascunhos, os preços/quantidade autorizados e `publish=false`. A nova busca por ficha do fabricante não forneceu o verso completo; páginas institucionais ou revendas não foram tratadas como substituto do rótulo.

As duas telas de pedidos receberam apenas texto explicativo. Sua lógica de autenticação, consulta e pagamento ficou inalterada. Testes da suíte principal, lint dirigido e compilação possuem registros em `test-results-confirmacao-visaris-2026-11-27.log`, `lint-results-confirmacao-visaris-2026-11-27.log` e `build-results-confirmacao-visaris-2026-11-27.log`.

## Avanço independente: recebimento dos avisos de pedido

Após a lista de pendências acima, foi concluída a verificação individual dos nove eventos de pedidos com gatilhos/fila/worker reais em banco descartável e entrega SMTP real, exclusivamente à caixa autorizada. O Gmail confirmou as nove mensagens diretamente em `INBOX`, com os identificadores esperados e autenticação aprovada. Não foram criados pedidos em produção. Consulte `email-delivery.md` e `order-email-delivery-verification-2026-11-27.json`. A entrega pelo sistema publicado continua com escopo separado, dependente de publicação e teste do fluxo público.

Também passaram as sete verificações da suíte de SEO com a sonda HTTP do domínio publicado, em `seo-results-publico-2026-11-27.log`. Não foi acessado novamente o Search Console nem confirmada mudança da apresentação do resultado no Google.
