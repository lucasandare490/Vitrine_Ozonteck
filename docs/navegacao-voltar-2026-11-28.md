# Retorno entre telas — 28/11/2026

Correção solicitada: produto → Revisar carrinho → Voltar deve retornar ao produto visitado, sem encaminhamento fixo à vitrine.

## Implementação

- Componente compartilhado BackButton aplicado aos controles de retorno da loja, produto, login, conta, painel, benefício de cliente e páginas de erro do produto. Texto padronizado como “Voltar”; cabeçalho mobile usa o mesmo comportamento.
- Consulta ao histórico navegável da própria aba, sem atravessar destinos externos. Alterações de filtro/âncora na mesma página e passagens intermediárias pelo login são ignoradas para retornar à tela anterior. O endereço anterior conserva seus filtros, paginação e âncora.
- Para navegadores antigos, acompanhamento pelos métodos públicos de History, preservando os campos do roteador. Somente caminhos de páginas são acrescentados ao estado de histórico; nenhuma senha, token, consulta ou informação comercial é copiada para armazenamento adicional. Limite de 100 entradas acompanhadas.
- Acesso direto sem histórico interno usa um destino local de segurança por substituição, evitando criar um ciclo artificial. Tela do produto/carrinho usa catálogo; páginas internas da conta usam a conta; detalhes do benefício usam a carteira.
- Checkout mantém pagamento → entrega/dados → carrinho. Tanto o retorno do conteúdo quanto a seta do cabeçalho mobile respeitam essas etapas, sem enviar pagamento ou pedido. Paginação, galeria, acessibilidade, retorno ao topo e recuperação de autenticação mantêm ações próprias.
- Nenhuma alteração em preços, estoque, registros de clientes, meios de pagamento ou banco de dados.

## Verificações locais

- Suíte principal: 188 aprovações, zero falhas, um teste HTTP condicional ignorado.
- Componentes: 63 aprovações, zero falhas. Incluem o botão de texto e a seta mobile ligados à navegação comum; as transições de pagamento/entrega/carrinho; limpeza dos eventos; e saída da confirmação sem reabrir etapas de uma compra já confirmada.
- Treze regressões de histórico: produto/carrinho, catálogo filtrado, âncoras nativas, login intermediário, entrada direta, substituição, remontagem, avanço, nova ramificação, limite de origem e prevenção de saída do checkout; cobertura de Navigation API e alternativa antiga.
- Compilação webpack e TypeScript aprovados, após corrigir a tipagem do receptor dos métodos de histórico durante esta implementação.
- Lint: zero erros e 12 avisos anteriores, relacionados a limpezas de efeitos e navegações completas de autenticação. Auditoria estática: 101 controles em 26 rotas, nenhuma associação de rótulo ausente.
- Logs locais: tmp/back-navigation-unit.log, tmp/back-navigation-components.log, tmp/back-navigation-lint.log, tmp/back-navigation-build.log.

## Manutenção

Use BackButton para ações de retorno entre páginas e forneça fallback local quando existir um destino de segurança mais adequado. Links normais continuam sendo usados para abrir uma seção específica. O evento cancelável ozonteck:back permite ao checkout voltar uma etapa antes de sair da página.

Documentação consultada: guia instalado do Next.js 16.4.5 (useRouter e linking-and-navigating) e [Navigation.entries — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/entries). A compatibilidade de navegadores antigos é tratada pelo acompanhamento de History; não se pressupõe Navigation API disponível.

A prévia local e o código do repositório não equivalem a publicação na Netlify. O bloqueio de publicação anteriormente documentado permanece separado.

## Conferência no Chrome

Conferidos no build local: catálogo com busca wo3 → produto PRO-AMR → Revisar carrinho → Voltar → mesmo produto; novo Voltar recupera a busca wo3. O mesmo carrinho retorna ao produto pela seta do cabeçalho mobile a 390 × 844 px. Recarregar o carrinho mantém o retorno ao produto. Uma aba nova aberta diretamente no carrinho utiliza /#catalogo. Na sessão existente, conta → endereços → Voltar recuperou a conta, sem gravação de endereços. Nenhum erro de console foi capturado na aba visitante durante essa sequência.

A sessão autenticada estava com carrinho vazio: não foram adicionados itens nem preenchidos dados para fabricar um teste de pagamento. As etapas e o retorno após confirmação foram validados pelo componente real em memória, sem cobrança. Não se afirma validação de pagamento real nesta tarefa. As capturas de atendimento fornecidas não foram interpretadas como autorização para apagar solicitações.
