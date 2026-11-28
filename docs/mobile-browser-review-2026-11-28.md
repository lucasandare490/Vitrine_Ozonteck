# Conferência no Chrome conectado — 28/11/2026

Continuação da entrega `1c7c9ee`, após Lucas reativar o acesso. Esta é uma inspeção especializada no Chrome do computador com viewport de teste; não houve pesquisa com participantes nem certificação de Safari/iOS ou aparelho Android.

## Evidências observadas

- Chrome da conta utilizada no projeto voltou a responder. A sessão administrativa de Rogério foi preservada em `http://localhost:3017`, sem pedir ou redefinir credenciais. O build também foi servido em `http://127.0.0.1:3108`, com sessão separada de visitante. Os dois servidores pertencem a esta revisão, sem publicação externa.
- Catálogo: carregou 107 produtos comerciais; categoria Cuidados Capilares retornou 21; ordenação crescente exibiu os valores em ordem; a segunda página mostrou 13–21 de 21. Abrir a Máscara Ozon-Kesen e voltar preservou categoria, ordenação e página 2 após concluir o carregamento.
- Busca dedicada: consulta `wo3` levou a `/?q=wo3#catalogo`, com seis resultados. O menor viewport de 320 px foi conferido também no alvo ativo; sem rolagem horizontal na geometria observada. Foram inspecionados ainda 375/390 px, menu de tablet em 768 px e catálogo desktop em 1440 px. As dimensões foram lidas da página, sem presumir que a configuração de outro tab tivesse sido aplicada ao alvo.
- Produto: preço de R$ 119,90, quantidade 2 e subtotal R$ 239,80 coerentes; ampliação abriu e Escape fechou a imagem. Uma unidade foi adicionada ao carrinho de visitante e apareceu no resumo por R$ 119,90. Não foi criada cobrança, não houve envio ao provedor nem aprovação simulada em produção.
- Favoritos de visitante: redirecionamento confirmado para `/login?redirect=%2Fconta%2Ffavoritos`. O botão de instalação foi ofertado pelo próprio Chrome em `/instalar`. Isso comprova oferta da instalação, não instalação concluída ou abertura em standalone.
- Carteira: busca pela própria conta autorizada, botão único de ativar benefício e explicação da tabela geral, sem alterar preço ou benefício de cliente. Menu inferior abriu todas as áreas. Edição do TESTE-001 abriu com os dados existentes e foi cancelada, sem gravar. O estoque encontrado nesse registro de teste não foi sobrescrito.
- Telas administrativas renderizadas: carteira, produtos, pedidos, categorias, tabela geral de consultor, relatórios, suporte, interessados, lembretes e visão geral. As leituras de títulos/largura não são prova de gravação de todos esses fluxos.
- Telas da conta na sessão existente: visão geral, dados, endereços, favoritos, pedidos e segurança. Páginas institucionais: ajuda, história e equipe. Sem rolagem horizontal nos estados medidos em torno de 390 px. Não foram publicados endereços ou outros dados pessoais nas evidências do repositório.
- Capturas de tela foram exibidas durante a revisão. Imagens de páginas privadas não foram exportadas para o repositório.

## PWA: teste real de falha de conexão

Foi encerrado somente o processo local de revisão na porta 3108, mantendo a internet e os demais serviços do computador. Ao navegar pelo Chrome para `/busca`, o service worker já instalado respondeu com **“Sem conexão | Ozonteck Recife”** e **“Vamos nos reconectar?”**. A tela explica que preços/produtos/pagamentos/pedidos exigem conexão e que não confirma compra ou pagamento. Não apresentou dados da conta. Esse resultado comprova controle e fallback reais nesse Chrome/origem local; os testes de código continuam verificando a lista restrita de arquivos em cache.

O teste não inclui ausência de internet no aparelho, instalação em iOS/Android, inicialização standalone, duas versões de worker com ativação manual ou medição de LCP/INP/CLS. Esses recortes continuam separados.

## Ajustes encontrados e implementados durante a inspeção

1. Ao usar Shift+Tab no primeiro botão do formulário, o navegador permitiu sair do foco do diálogo. `keepDialogFocus` passa a circular explicitamente entre o primeiro e o último controle visível, respeitando campos desabilitados/ocultos, edição normal e diálogo sem controles. Compartilhado por `AppDialog` e `BottomSheet`, sem mudar dados ou validação.
2. O atalho Catálogo usa agora somente `#catalogo` quando já se está na página do catálogo. Assim não reabre um contexto anterior salvo antes de uma seleção recente de filtros. Nas demais páginas preserva o retorno validado ao catálogo.
3. Rótulo do contador ajustado para “1 item” e plural para demais quantidades.

Regressões novas: quatro testes do helper real de foco e uma verificação de navegação contextual. O stub usado no executor de componentes só isola o módulo de DOM; as regras do helper são testadas diretamente e a interação do formulário é conferida no navegador após a compilação.

**Repetição no build corrigido:** Shift+Tab no primeiro botão levou a “Salvar Alterações”, e Tab no último voltou a “Fechar formulário”, mantendo foco dentro do diálogo. O painel inferior também passou: primeiro botão → último link “Meus lembretes” → primeiro botão. Escape e Cancelar fecharam sem salvar. O atalho Catálogo preservou `categoria=Nutracêuticos&ordem=price-desc` e passou a apontar para `#catalogo` na própria página.

O tema escuro foi ativado e o retorno ao tema claro foi confirmado, sem rolagem horizontal no estado observado; isso não é certificação de contraste de todos os componentes. A rota antiga de benefício por cliente também renderizou a tela simplificada “Benefício de consultor”, sem editor de preços individuais e sem gravar alteração. A recuperação online, após reiniciar o servidor, exibiu novamente “Encontre seu próximo cuidado”. O console capturado na aba final não registrou erro no recorte consultado; não se generaliza para todas as sessões ou provedores.

## Verificação final e arquivos

Passaram **171 testes principais, zero falhas e um HTTP condicional ignorado; 56 testes de componentes; 12 roteiros SQL; auditoria estática de 101 controles/26 rotas; lint sem erros, com 12 avisos documentados; compilação webpack/TypeScript**. Evidências e hashes: [mobile-browser-verificacao-2026-11-28/result.json](mobile-browser-verificacao-2026-11-28/result.json). Os testes HTTP/SEO do primeiro build continuam como evidência separada; não foram renomeados ou apresentados como uma nova execução.

Arquivos de execução alterados nesta retomada: `lib/dialog-focus.ts`, `components/AppDialog.tsx`, `components/BottomSheet.tsx`, `components/MobileNavigation.tsx`, `lib/mobile-navigation.ts`. Cobertura: `tests/dialog-focus.test.ts`, `tests/mobile-navigation.test.ts`, `scripts/component-test-harness.mjs` e `scripts/check-release.mjs`. Não houve migração, atualização de dependências ou mudança comercial.

A prévia do build foi deixada em `http://localhost:3017/`; ela é local, depende do servidor/PC ligados e não substitui a publicação permanente na Netlify. Os overrides temporários de tamanho foram removidos do alvo final, e a aba temporária de visitante foi fechada. A conexão do Chrome deixou de ser bloqueio nesta etapa.

## Hospedagem e Google: conferência atual, sem conclusão presumida

**Netlify:** painel autenticado ainda informa que as publicações de produção estão pausadas porque os créditos disponíveis do ciclo acabaram; Trigger deploy está desabilitado. O deploy publicado continua `8558a5e`, ID `6aef952e7ff5cec1e543fbca`. Nenhum plano foi contratado, limite pago aceito ou nova publicação executada.

**Search Console:** página inicial está indexada, com HTTPS, rastreamento/indexação permitidos. Último rastreamento informado: **30/10/2026 às 07:06:28**, Googlebot Smartphone. Esse é um registro antigo do índice, não uma verificação do novo código. O relatório agregado tinha atualização de 22/11 e mostrava uma página indexada e 112 “Detectada, mas não indexada no momento”.

Foi feita **uma** tentativa de solicitar nova leitura em 28/11, pois o rastreamento antecede os ajustes anteriores de identidade. A interface não mostrava cota disponível numericamente e o botão estava habilitado; após testar a URL, retornou **“A cota foi excedida”** e informou que a solicitação não pôde ser processada. **Solicitação não aceita.** Não houve repetição, CAPTCHA resolvido, envio de sitemap duplicado ou promessa de alteração imediata do resultado do Google.

## Limites que permanecem

Publicação Netlify; confirmação dos fluxos da nova versão efetivamente publicada; restrição de débito e compensação de boleto; cadeia pública de webhooks/estoque/avisos; documentos do Visaris e confirmações comerciais já listadas; processamento do Google e evidência dos registros históricos. Instalação/aparelhos e testes específicos de acessibilidade/desempenho não cobertos acima continuam sem certificação.

Quantidade provisória 9999 e pesquisa formal futura com usuários não são bloqueios de implementação. Nenhuma aprovação financeira, categoria histórica ou disponibilidade comercial foi fabricada nesta retomada.
