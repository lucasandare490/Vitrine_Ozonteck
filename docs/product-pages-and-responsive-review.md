# Paginas de produto e revisao responsiva

Data: 2026-09-25. Estado: implementacao tecnica entregue; pesquisa editorial parcial.

## Inventario confirmado

Leitura publica do Supabase, sem usar service role: 116 registros ativos, todos com descricao vazia no momento da consulta. Categorias: Acessorios 4, Bem Estar 10, Cuidados Capilares 22, Nutraceuticos 22, Perfumaria 54, Teste 4.

Os quatro registros de teste foram preservados, mas excluidos do sitemap e marcados noindex nas suas paginas. Nao foram apagados produtos, alterados precos, imagens, estoques, pagamentos ou permissoes.

## Implementacao

- Rota unica `/produto/[code]`, sem copiar o catalogo para componentes. Novos registros ativos passam a ter pagina automaticamente.
- Consulta publica ao Supabase com RLS; campos explicitos, sem credencial administrativa; erro de consulta nao e tratado como produto inexistente.
- Nome, imagem, preco, estoque e descricao continuam na tabela `produtos`. A descricao ganhou textarea no formulario administrativo e link para visualizar a pagina.
- Cache por requisicao evita duplicar a consulta entre metadata e pagina. Sem cache persistente para precos e estoque.
- Relacionados limitados a quatro registros da mesma categoria. Falha nos relacionados nao bloqueia o produto principal.
- Imagem real, ampliacao em dialog nativo, fechamento por Escape, texto alternativo e fallback. Nao foram inventadas imagens adicionais.
- Quantidade, subtotal, lista existente e WhatsApp com codigo/nome/quantidade. Mensagem adicional permanece local ate o usuario abrir o WhatsApp.
- Limites da acao de detalhe: estoque, 100 unidades por produto e 50 produtos na lista. Validacoes financeiras continuam no backend existente.
- Metadata individual, canonical, Open Graph, Product e BreadcrumbList JSON-LD. Serializacao escapa `<` para impedir encerramento do script por texto de produto.
- Estados de carregamento, falha recuperavel e produto nao encontrado.
- Nenhuma avaliacao de pedido foi reutilizada como se fosse avaliacao especifica de produto. Nenhum rating ou numero de compradores foi inventado.

## Pesquisa e publicacao dos textos

Arquivo: `supabase/product-descriptions-reviewed.sql`.

Contem 21 textos curtos baseados em paginas individuais oficiais. Cada texto inclui a URL da fonte; a pagina transforma a linha `Fonte: https://...` em um link. O SQL preenche apenas descricoes vazias e retorna os registros alterados, em uma transacao. Nao exige mudanca de schema. Pode ser executado novamente sem substituir descricoes ja preenchidas.

**O SQL nao foi executado no banco remoto.** As paginas funcionam antes dele, mostrando que a descricao esta pendente. Depois da revisao/publicacao editorial, as descricoes podem ser mantidas no proprio painel administrativo, sem editar React.

Cobertura preparada: BE-SOFH, BE-OX3, BE-SHII, BE-LUSH, BE-FRESH, CAP-AMP-SF, CAP-SH-OK, CAP-MAS-OK, CAP-O-ACAI, CAP-O-CREAM, CAP-FOR-MEN, CAP-SH-MC, CAP-MAS-MC, CAP-KIDS-SH, CAP-KIDS-CO, CAP-KIDS-LE, NUT-XBOOST, NUT-OMEGA, NUT-TRIMAG, PERF-CAPA, AC-SQUEEZE.

Ainda faltam textos individuais revisados para 91 produtos comerciais. Isso nao foi classificado como pesquisa concluida. Entre as limitacoes encontradas: paginas oficiais de Boryslim e K2MK7 e D3 com texto apenas '.', detalhes incompletos de apresentacao e ausencia de rotulos integrais. Volume, quantidade de capsulas, dose, alergias, certificacoes e resultados nao foram inferidos. Hidratantes de 120g cadastrados precisam de confirmacao da apresentacao antes de aproveitar descricoes de outras versoes.

Fontes principais consultadas:

- https://grupoozonteck.com/produtos
- https://grupoozonteck.com/produtos-lista/capilar-ozonizada
- https://grupoozonteck.com/produtos-lista/suplementos-alimentares
- https://grupoozonteck.com/produtos-lista/perfumaria-premium
- As 21 paginas individuais estao registradas no SQL junto de cada descricao.

Nao foram reproduzidas promessas de cura/preventivas presentes em algumas fontes comerciais. O texto publicado deve ser conferido com o rotulo da apresentacao efetivamente vendida.

## Problemas responsivos corrigidos

| Prioridade | Evidencia / causa | Correcao e beneficio |
| --- | --- | --- |
| Alta | Navegacao administrativa `hidden md:flex`, sem alternativa mobile | Navegacao compacta com todas as rotas abaixo do cabecalho |
| Alta | Login em 320px: documento com 346px por selo e acoes do cabecalho | Selo compacto no mobile, texto acessivel preservado; documento medido depois com 305px uteis |
| Alta | Controles de quantidade/total/remocao extrapolavam a linha do carrinho em 320px e eram cortados pelo container | Quebra de linha, espacamento adaptativo e nomes acessiveis por produto |
| Media | Painel de acessibilidade fixo em 340px, alem da margem lateral | Largura limitada ao viewport; medido entre x16 e x304 em tela de 320px |
| Media | Painel fechado ainda tinha controles acessiveis/focaveis | `inert` e `aria-hidden` quando fechado |
| Media | Menu mobile sem foco contido e sem Escape | Foco inicial, ciclo de Tab, Escape, restauracao de foco e bloqueio temporario de rolagem |
| Media | Login baseado em altura vh e modal com duas colunas estreitas | Altura dvh no login e uma coluna no formulario do modal pequeno |
| Media | Carrinho flutuante concorria com WhatsApp | Carrinho acima do WhatsApp com safe-area e sem animacao infinita |
| Media | Botao Adicionar dependia de hover no desktop | Acao sempre visivel e altura minima de 44px |
| Media | Adicao rapida dos favoritos usava codigo no campo id e estoque ficticio de 99 | Usa id real e bloqueia estoque zero, mantendo identidade dos itens com o catalogo |

Nao foi aplicada ocultacao global de overflow para mascarar problemas.

## Validacao realizada

- TypeScript sem erros e ESLint nos arquivos alterados.
- Build de producao concluido, incluindo `/produto/[code]` e sitemap dinamico.
- Dez testes unitarios passaram: autenticacao existente, saneamento do carrinho e novos testes de URL, moeda, registros de teste e JSON-LD.
- Produto BE-SOFH carregado do Supabase com preco R$ 89,80 e imagem real.
- Zoom abre/fecha por Escape. Adicao de duas unidades refletiu R$ 179,60 no checkout existente. Itens criados pelo teste foram removidos pela interface.
- Link WhatsApp conferido sem enviar mensagem. Nao foi realizado pagamento.
- Produto inexistente exibe estado apropriado; canonical, titulo e JSON-LD conferidos no DOM.
- Smoke HTTP de todas as 116 URLs ativas sem falhas; sitemap respondeu 200 com 112 URLs de produto e sem os quatro cadastros de teste.
- Pagina de produto verificada geometricamente em larguras 320, 390, 768, 1024, 1440, 1920 e 3840. Imagens lazy fora da tela nao foram tratadas como erro de carregamento.
- Paginas publicas `/`, `/sobre_cliente`, `/suporte`, `/login`, `/lista` inspecionadas em larguras pequenas e grandes, incluindo paisagem. O teste encontrou o overflow do login e o corte no carrinho descritos acima.
- Login de 320px, abertura/fechamento do menu por Escape e painel de acessibilidade dentro da tela confirmados depois das correcoes.

## Limites e proximos testes

- Nao houve sessao administrativa/de cliente autenticada disponivel: paginas privadas tiveram revisao de codigo, nao testes completos de todos os formularios reais.
- Testes de viewport nao substituem aparelhos fisicos, Safari/iOS, teclado virtual, leitores de tela ou zoom de sistema. Nao ha declaracao de conformidade WCAG integral.
- Nao foram medidas melhorias de Core Web Vitals, memoria ou latencia contra uma baseline de producao.
- Pesquisa e publicacao de todas as descricoes continuam pendentes. Composicao completa exige rotulos/catalogo atualizado.
- Conferir `NEXT_PUBLIC_SITE_URL` com o dominio final antes do deploy; ambiente local gera canonical e sitemap localhost.
- Testar compra em sandbox, OAuth real, upload e permissao administrativa antes de publicar. Nenhuma garantia de ausencia de regressoes fora do escopo testado.
