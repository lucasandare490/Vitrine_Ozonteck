# Páginas de produto e pesquisa do Visaris — 27/11/2026

## Decisão de preço

Lucas autorizou **R$ 89,95 para cliente e consultor somente no novo Visaris**. Os demais preços públicos e de consultor permanecem como estão. Na loja, o preço público vale para visitantes e contas comuns; o preço de consultor exige a aprovação manual já implementada. O novo valor foi registrado no rascunho, sem criar oferta ativa no banco.

## Alterações implementadas

- Novo padrão compartilhado da página individual `/produto/[code]`: imagem maior com ampliação, título e categoria, painel de compra, quantidade/subtotal, navegação para descrição, especificações, avaliações e dúvidas, além dos produtos relacionados.
- Acabamento em verde da identidade atual, superfícies arredondadas, tabela de especificações alternada e cartões de leitura. Sem alterar a página inicial, checkout ou área administrativa.
- Preço da conta, limites de estoque/lista, consulta de preços, lista e contato pelo WhatsApp preservados. Sem avaliações, descontos, prazos ou frete gratuitos fictícios. O resumo é apenas uma apresentação; a descrição integral e os grupos de conteúdo permanecem disponíveis.
- Galeria mantém o fechamento pelo botão, fundo e Escape, com animação reduzida respeitada. Alvos dos atalhos recebem margem para não ficarem ocultos pelo cabeçalho.
- **Correção de conteúdo encontrada na conferência:** a ampola Soft Hair não tinha a apresentação na projeção pública, apesar da confirmação anterior de 20 ml pelo responsável. Acrescentada `Ampola de 20 ml` em `lib/product-public-content.ts`. O teste novo reproduziu a ausência antes da correção e passou depois. O histórico de pesquisa original foi preservado.

Arquivos de interface: `app/produto/[code]/page.tsx`, `components/ProductActions.tsx`, `components/ProductGallery.tsx`, `components/ProductSpecifications.tsx` e `components/ProductReviews.tsx`.

## Pesquisa do Visaris

Fontes consultadas em 27/11/2026:

1. [Listagem pública de suplementos do Grupo Ozonteck](https://grupoozonteck.com/produtos-lista/suplementos-alimentares): a listagem examinada não contém Visaris. Isso não comprova inexistência do lançamento.
2. [Página de uma revenda](https://grupoozonteck.lojavirtualnuvem.com.br/produtos/visaris-cuidado-dos-olhos-1a7vy/): anuncia Visaris com 60 cápsulas, mas não disponibiliza o rótulo completo. Não foi tratada como ficha oficial do fabricante. Não foram copiados preço, dosagem nem alegações de tratamento de doenças.
3. [Comunicado da Anvisa de 06/08/2026](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-determina-apreensao-de-suplementos-alimentares-com-ozonio/): informa medida envolvendo suplementos fabricados pela Lemavi, CNPJ 38.540.165/0001-29, e referencia a RE 3.054/2026.
4. [Notícia posterior de suspensão judicial](https://multinivelnews.com.br/justica-federal-suspende-resolucoes-da-anvisa-apos-questionamento-sobre-processo-de-revisao/): menciona o processo 5019935-67.2026.4.02.5001/ES e suspensão de resoluções. É fonte secundária; a vigência e o alcance atuais não foram confirmados em documento oficial nesta consulta.

Essas fontes **não permitem concluir a situação regulatória atual do frasco específico**. Não foi presumida liberação, nem declarada uma proibição vigente de toda a marca. Nenhum produto existente foi desativado nesta etapa por essa pesquisa. Foi solicitado a Lucas o fabricante e o CNPJ do verso do frasco para confrontar a documentação aplicável.

Dados confirmados pelo material recebido: nome Visaris; suplemento alimentar; frasco com 60 cápsulas de 500 mg; destaque para astaxantina, luteína e zeaxantina. Os 500 mg são a massa indicada por cápsula, não o teor de cada ingrediente. Não estão confirmados fórmula completa, teores, alergênicos, modo de uso, EAN ou código oficial. A imagem original e o texto factual permanecem preparados, com `publish=false`.

O código interno `NUT-VISARIS` é somente uma proposta. A quantidade 9999 foi autorizada por Lucas e não representa uma contagem física auditada. O pedido de ativação não foi executado enquanto a identificação do fabricante e a documentação estão pendentes.

## Validação

- Testes Node: **149 aprovados, zero falhas e um teste HTTP condicional ignorado**, total de 150. Log `test-results-2026-11-27.log`.
- Componentes: **25 aprovados, zero falhas**. Log `component-results-2026-11-27.log`.
- Lint dos sete arquivos TypeScript/TSX alterados e `git diff --check` sem erros.
- Compilação de produção webpack/TypeScript aprovada, com 29 páginas estáticas. A primeira tentativa encontrou bloqueio de criação de pasta temporária (`EPERM`); a repetição com permissão adequada terminou com sucesso. Log final `build-results-2026-11-27.log`.
- Revisão no navegador local: Cinderela 17 ml, Ampola Soft Hair e Ozon Flex Caixa; larguras 320, 390, 1200 e 1440. Sem transbordamento horizontal nas medidas verificadas. Imagem, descrição integral, especificações e alvos de navegação presentes.
- Ampliação da Cinderela abriu e fechou com Escape. Duas unidades geraram subtotal de R$ 90,00 e foram conferidas na lista. O item criado na conferência foi removido e a lista voltou ao estado vazio inicial. Nenhum pedido ou pagamento foi criado.
- Link do WhatsApp conferido com código, quantidade, preço e observação codificados; nenhuma mensagem foi enviada. Filtros de avaliação por nota e ordenação conferidos, com retorno vazio real, sem criar avaliações.
- Evidências visuais: `evidencias/produto-desktop-2026-11-27.jpg` e `evidencias/produto-mobile-2026-11-27.jpg`. São capturas da prévia local, não de produção.

## Publicação e continuidade

O painel autenticado da Netlify foi conferido em 27/11/2026 na janela correta. Continua informando que os sites publicados estão no ar, porém novos deploys de produção estão pausados por falta de créditos. O botão `Trigger deploy` está desativado e o commit publicado permanece **8558a5e**. Não foi contratado plano nem consumido crédito adicional. Esta etapa deve ser enviada com `[skip ci]` e publicada manualmente quando a conta liberar novos deploys.

Após a liberação: publicar o `main` mais recente, conferir o commit efetivamente publicado e repetir os fluxos e a conferência visual no domínio público. Não confundir a compilação local ou o envio ao Git com publicação. As dependências anteriores de pagamentos, e-mails e dados históricos continuam no documento de revisão; esta etapa não as declara concluídas.

Para concluir Visaris: obter identificação do fabricante e documento atual aplicável, preencher somente dados do rótulo/fonte confirmada, conferir inexistência de código/nome duplicado e cadastrar com preço público e de consultor de R$ 89,95, mantendo a quantidade solicitada documentada.

## Confirmações posteriores na mesma data

O levantamento acima foi complementado pela leitura do escritório oficial: código **5002901**, EAN **7898760211513**, dimensões logísticas **5 × 11 × 5 cm** e peso logístico **110 g**. O responsável confirmou, em mensagem encaminhada por Lucas, **60 cápsulas de 590 mg**. Assim, a anotação de 500 mg do material promocional acima permanece como histórico e não é a apresentação atual do rascunho.

Foto oficial de 590 mg preservada sem edição em `public/produtos/visaris-590mg.webp`, agora principal no rascunho. A arte anterior permanece em `public/produtos/visaris.jpg`. Preços autorizados e quantidade provisória foram preservados. O verso do rótulo e a documentação ainda não foram fornecidos; `publish=false` continua separado dessas confirmações de embalagem.
