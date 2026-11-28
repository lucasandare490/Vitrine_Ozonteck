# Mobile, PWA e revisão de UX — 28/11/2026

## Estado e limites da entrega

Continuação do código existente, a partir de `1117321`, sem reiniciar o projeto. A implementação abaixo está no repositório local; não foi publicada nesta etapa. O último deploy autenticado observado anteriormente era `8558a5e`, com publicação pausada por créditos. Isso é uma observação anterior, não uma nova consulta de saldo.

O usuário informou que está fora de casa e preferiu reativar o Chrome quando retornar. O acesso local do navegador está indisponível nesta conversa. A inspeção de código, testes de estado, SQL isolado e HTTP não substituem conferência visual, teclado real, leitor de tela, instalação em Android/iOS ou medição de Core Web Vitals. Não foram inventados participantes ou resultados de pesquisa.

**Decisões preservadas:** checkout atual; sem cobrança real; sem fiado/carnê; sem sincronização presumida com o escritório oficial; preço por conta e benefício existentes. Quantidade provisória **9999 é autorizada e não é pendência**. A pesquisa formal de usabilidade será posterior ao lançamento e não impede concluir a implementação.

## Pendências anteriores revisadas

- O ajuste de troca de endereço principal, a simplificação de benefício na carteira, os bloqueios de gravações duplicadas e a tabela geral de consultor já existiam; foram preservados e novamente cobertos pelas suítes. Não se voltou a exibir edição de preço por cliente.
- Os eventos de suporte/retirada e outros avisos já possuem implementação e evidências anteriores. A documentação de entrega distingue o teste SMTP/banco isolado da cadeia do ambiente publicado. Nenhum teste foi enviado a clientes nesta etapa.
- Paginação compartilhada e centralizada e artes de pagamentos já existiam. Foram mantidas; o catálogo agora preserva também seu contexto ao retornar do produto. Não foram prometidos débito liberado, novas condições comerciais ou estoque físico.
- Corrigidos nesta etapa: ausência de navegação própria de celular, filtros inadequados ao toque, perda do retorno ao catálogo, falta de favorito na ficha individual, feedback de limite de 100 unidades no card, confirmações sem garantia de linha afetada na exclusão, campos sem nome acessível, erro de favoritos apresentado como estado vazio e respostas antigas de perfil/favoritos após trocar de conta.

## Mobile: arquitetura de aplicativo

`MobileNavigation` cria cabeçalho específico e cinco destinos fixos: Catálogo, Buscar, Favoritos, Carrinho e Conta. O cabeçalho desktop deixa de executar sua interface no celular após a identificação do breakpoint. Não há segunda instância do antigo carrinho flutuante.

- `/busca` reúne busca com sugestões e links de categorias. Usa o mecanismo de pesquisa já existente; resultados permanecem no catálogo.
- `MobileCatalogFilters` oferece painel inferior nativo com categorias e ordenação. A aplicação é explícita, permitindo rever a seleção antes de confirmar. Ordenação utiliza o preço vigente da conta.
- Categoria, busca e ordenação estão na URL. Um registro opcional de `sessionStorage` guarda apenas contexto/página do catálogo; não contém conta, token ou pedido. Voltar do produto restaura esse contexto quando disponível. A navegação continua funcional se o armazenamento for recusado.
- Cards próprios para toque, imagem contida, ação com texto e foco visível. Hero mais compacto e remoção de efeitos decorativos pesados no celular.
- Barra de produto apresenta quantidade, subtotal e a mesma ação de adicionar usada no painel principal. Respeita os limites anteriores de 100 unidades por produto e 50 produtos distintos.
- Áreas seguras do sistema, viewport e tratamento de foco/teclado evitam manter barras fixas durante edição. WhatsApp é reposicionado e fica oculto no checkout, administração e edição mobile.
- `BottomSheet` e `AppDialog` usam `dialog.showModal`, fechamento por Escape/fundo, bloqueio de rolagem e devolução de foco. Operações em andamento impedem fechar a confirmação correspondente.

## PWA implementado

`app/manifest.ts`: nome Ozonteck Recife, nome curto Ozonteck, idioma pt-BR, identidade temática, escopo/início `/`, apresentação `standalone`, atalhos e ícones 192/512/maskable. Ícone Apple de 180 px. As imagens derivam do SVG existente da marca; não foram redesenhadas por IA. O gerador reproduz os quatro arquivos em `public/app-icons`.

`AppRuntime` registra o service worker somente em produção e conserva o site normal se a instalação não for possível. A tela `/instalar`, acessível pelo rodapé, apresenta instalação opcional quando o navegador fornece o evento e instruções para Safari/iOS e Chrome/Android. Não há instalação forçada, promessa de disponibilidade em todos os sistemas ou exigência de pagamento.

**Cache mínimo e deliberado:** `public/sw.js` guarda somente a página offline genérica e três ícones. Nunca grava catálogo, preços, estoque, HTML de conta, pedidos, APIs, tokens ou respostas de provedores. Mutações, autorizações, RSC/prefetch e terceiros passam fora desse cache. A navegação HTML consulta a rede; uma falha de rede mostra a página offline neutra. Erros HTTP do servidor não são falsamente apresentados como sucesso offline. Não existem fila de compras offline, repetição automática de pagamentos, push ou sincronização financeira em segundo plano.

Atualização disponível exige ação explícita e confirmação antes de recarregar. Não há recarga automática; o aviso de atualização fica oculto durante o checkout. Novas versões não apagam sessão/carrinho. O navegador ou contêiner instalado pode ter sessão própria e exigir novo login, explicado na tela. O service worker é servido com `no-store`/revalidação e escopo explícito.

Fontes técnicas primárias consultadas: [Next.js, PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [web.dev, cache](https://web.dev/learn/pwa/caching), [MDN, ciclo de service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [MDN, instalação](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) e [WebKit, áreas seguras](https://webkit.org/blog/7929/designing-websites-for-iphone-x/). Também foi lida a documentação da versão Next instalada antes das alterações. A orientação WebKit citada é sobre áreas seguras, não uma certificação atual de Safari.

## Produtos, UX e acessibilidade

A ficha anterior já possuía imagem ampliável, descrições, especificações, avaliações filtráveis e relacionados. Isso foi conservado. Não foram inventadas fotografias adicionais, ingredientes ou alegações de saúde. Nesta etapa foram acrescentados favorito persistente por titular, retorno ao produto após login, skeleton real, hierarquia mobile e ação fixa com preço correto da conta.

O favorito espera confirmação e relê o estado após escrita. Uma falha de resposta não é interpretada automaticamente como sucesso ou remoção. Respostas de outra sessão e após desmontagem são descartadas. O mesmo cuidado foi aplicado à lista de favoritos; em falha há mensagem e recuperação, não uma lista falsamente vazia.

A auditoria estática identificou 44 declarações de controles sem associação de nome acessível. As 101 declarações atuais foram revisadas; labels, nomes, autocomplete e teclados apropriados foram adicionados sem mudar a validação comercial. O roteiro `check-form-labels` verifica esse recorte e não certifica leitores de tela nem os campos internos do provedor de cartão.

Páginas de erro, carregamento e não encontrado oferecem recuperação legível. No erro geral há orientação para conferir pedido existente antes de repetir pagamento. O botão de busca da ajuda agora leva ao resultado real, em vez de não executar ação. Zoom de página permanece permitido. As preferências de acessibilidade existentes e montagem única dos widgets foram preservadas.

## Administração e desktop

No celular: Início, Pedidos, Produtos e Mais opções; o menu inferior oferece todas as dez áreas, incluindo tabela geral de preços. Tabelas existentes passam a usar a apresentação de cards mobile com rótulos por célula e semântica explícita; desktop continua com tabelas. A carteira e seu botão único de benefício foram preservados.

Edição/exclusão de produto, pedidos e endereços usam diálogo com foco modal. “Salvar” e “Usar preço comum” substituem ações apenas por ícone na tabela de preços. A confirmação de exclusão explica o alvo; uma única gravação é enviada, e zero linhas afetadas não geram mensagem de sucesso. **Nenhum registro real foi excluído para testar.** O painel nega conteúdo quando não consegue confirmar autorização e oferece recuperação. RLS e MFA não foram removidos.

O breakpoint mobile é menor que 768 px. Identidade, dados, fluxo de pagamentos e organização desktop anterior permanecem; melhorias compartilhadas são nomes acessíveis, diálogos, erros e navegação administrativa. A ausência de regressão visual ainda precisa de conferência em navegador, expressamente separada dos testes de código.

## Rotas examinadas no código

O inventário automatizado registra **26 rotas de página** e suas fontes em `mobile-form-route-audit-2026-11-28.json`:

| Grupo | Rotas e elementos considerados |
| --- | --- |
| Loja | `/`, `/busca`, `/produto/[code]`, `/lista`, favoritos e componentes de busca, filtros, avaliações, relacionados e carregamento |
| Conta | `/login`, `/conta`, `/conta/dados`, `/conta/enderecos`, `/conta/favoritos`, `/conta/pedidos`, `/conta/seguranca` |
| Institucional | `/sobre_cliente`, `/suporte`, `/junte-se-a-nos`, `/instalar` |
| Administração | `/admin`, `/admin/pedidos`, `/admin/produtos`, `/admin/categorias`, `/admin/clientes`, `/admin/clientes/[id]/precos`, `/admin/precos`, `/admin/relatorios`, `/admin/suporte`, `/admin/interessados`, `/admin/lembretes` |

Isso é inspeção especializada de arquitetura/código e simulação técnica de estados, não relato de navegação em todos os aparelhos. A pesquisa futura com participantes deve complementar essa inspeção.

## Segurança, desempenho e evidências

Verificação final de 28/11: **166 testes principais aprovados, zero falhas, um HTTP condicional ignorado; 56 testes de componentes aprovados; 12 roteiros SQL aprovados; auditoria estática de 101 controles e 26 rotas sem associação ausente; lint sem erros; build webpack/TypeScript aprovado**. O lint registrou 12 avisos: navegações completas existentes ligadas a autenticação/MFA e contadores de invalidação de respostas em limpezas de efeitos. Não foram ocultados nem corrigidos trocando navegação de segurança por navegação parcial sem avaliação.

Separadamente, o servidor iniciado a partir desse build passou em **dez verificações HTTP do PWA** e **sete verificações de SEO, incluindo HTTP**. A primeira tentativa de alcançar um servidor entre sessões isoladas não conectou; o teste foi realizado com servidor e verificadores no mesmo processo supervisor. A primeira sonda SEO comparou a origem pública já compilada com a origem local padrão do processo de testes; foi corrigida a configuração `NEXT_PUBLIC_SITE_URL` do verificador para a mesma origem pública do build, sem mudar o site ou afrouxar asserções. Logs finais: `mobile-pwa-http-2026-11-28.json` e `mobile-seo-http-2026-11-28.log`.

- Não foram adicionadas dependências. Auditoria de dependências executada: zero vulnerabilidades reportadas; isso não garante ausência de toda vulnerabilidade. Metadados sem credenciais em `mobile-dependency-audit-2026-11-28.json`.
- Consulta remota somente a metadados: RLS ativo nas 13 tabelas selecionadas; quatro funções financeiras presentes e executáveis somente pelo serviço, sem execução direta de anon/authenticated. Nenhuma linha de cliente lida ou alterada. Escopo e resultado em `mobile-database-access-verification-2026-11-28.json`; não é auditoria completa de cada política.
- Integrações SQL rodam em bancos descartáveis. Nenhuma migração nova, cobrança, envio de mensagem ou escrita comercial remota nesta etapa.
- Efeitos decorativos pesados reduzidos no mobile, navegação desktop não mantida renderizada e ícones locais pequenos. Não há número de LCP/INP/CLS ou pontuação Lighthouse inventados. Medições em aparelho e na versão publicada continuam separadas.
- Logs finais e hashes: `mobile-pwa-verificacao-2026-11-28/result.json`. Os hashes identificam o conteúdo verificado antes do commit; `revision` identifica o commit de origem, com alterações locais declaradas.

## Manutenção e validação após publicação

1. Executar `npm run verify:release`. O roteiro não publica, migra banco remoto, envia e-mail nem cobra. O resultado `productionReady=false` preserva os limites de evidência externa.
2. Compilar e iniciar `npm start -- --port 3108`; executar `node scripts/check-pwa-http.mjs http://localhost:3108 docs/mobile-pwa-http-2026-11-28.json`. HTTP não instala service worker nem verifica geometria.
3. Publicar a revisão escolhida quando a hospedagem permitir. Usar `npm run build` com webpack, HTTPS, headers e rotas estáticas existentes. Confirmar manifest, ícones, `sw.js` e página offline no domínio real.
4. Ao modificar página offline ou seus ícones, incrementar `OFFLINE_CACHE` no worker e executar testes. Nunca incluir endpoints comerciais, autenticação ou páginas privadas em `STATIC_FILES`. Manter atualização explícita, sem recarregar checkout automaticamente.
5. Quando o Chrome for reativado, conferir 320/375/390/768/1440 px, temas, teclado, zoom e áreas seguras; todos os grupos de rotas; menu/filtros; salvar/fechar diálogos; retorno/paginação; carrinho e formulário. Em aparelhos reais, validar instalação/standalone, perda de conexão, reabertura e atualização entre duas versões. Testes reais com usuários continuam para depois do lançamento.
6. Reversão: reverter o commit de interface preservando dados e publicar um worker substituto de limpeza controlada se for necessário desativar PWA já instalado. Simplesmente apagar `sw.js` não remove imediatamente workers já instalados. Não apagar sessão ou armazenamento do usuário como rotina de atualização.

## Dependências externas reais que continuam

- Reativação do navegador para conferência visual/interações; instalação e compatibilidade reais Android/iOS; medições de performance. O usuário decidiu aguardar seu retorno para liberar o Chrome.
- Publicação Netlify, crédito/acesso e confirmação do commit efetivamente servido; selo condicionado ao plano na última consulta, sem contratação autorizada.
- Débito restringido no coletor de homologação; compensação do boleto; cadeia pública completa checkout → provedor → webhook → banco/estoque → telas → fila agendada → entrada autorizada. Testes locais/SMTP anteriores não substituem isso.
- Aprovação de sete apresentações adicionais, política global de preços e duas divergências dos perfumes. Visaris: preço e 590 mg resolvidos; verso/fabricante/documentação ainda necessários. Sem ativação comercial por inferência.
- Google processar nome/descrição/ícone e nova solicitação quando houver acesso/cota; comprovantes para oito pedidos antigos e backup de categorias antigas. Nenhum estado financeiro ou registro histórico foi fabricado.

Quantidade real de estoque e pesquisa formal de usabilidade **não são impedimentos introduzidos por esta revisão**. Não se declara o projeto “100% concluído” enquanto essas validações externas não tiverem evidência.
