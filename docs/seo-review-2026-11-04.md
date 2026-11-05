# Revisão de SEO — Ozonteck Recife — 04/11/2026

## Escopo e diagnóstico

Revisão limitada a `app/layout.tsx`, `app/favicon.ico`, imagens `public/brand*`, testes de SEO e este documento. Interface, navegação, produtos, autenticação e pagamentos preservados. Sem commit, push, publicação ou mudanças em outros módulos.

O commit `0cc7406` já continha `WebSite` JSON-LD, PNG de marca de 192 × 192 e prévia social de 1200 × 630. Contudo, `app/favicon.ico` ainda era o ícone inicial da Vercel (triângulo branco sobre fundo preto), com versões de 16, 32, 48 e 256 pixels. A configuração manual do PNG não elimina o favicon que o Next.js injeta automaticamente a partir desse arquivo. Havia ainda títulos e descrições diferentes entre metadados gerais, Open Graph e Twitter, além de alegações de autorização e nanotecnologia não verificadas nesta revisão.

Antes da implementação, foram lidos os guias instalados do Next.js 16.4.3:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`;
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (prioridade de arquivos, ícones, URLs e herança);
- `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`.

## Alterações realizadas

| Arquivo | Alteração |
| --- | --- |
| `app/layout.tsx` | Centraliza nome, título e descrição; alinha `applicationName`, `og:site_name`, títulos, descrições e `WebSite.name`. Retira alegações não verificadas dos metadados e do texto alternativo. |
| `app/favicon.ico` | Substitui todas as versões do ícone inicial por versões da marca existente, em 16, 32, 48 e 192 pixels. Mantém o endereço `/favicon.ico`. |
| `public/brand-share.svg` | Substitui “Distribuidor autorizado” por “Atendimento em Boa Vista, Recife”, mantendo composição, cores e identidade existentes. |
| `public/brand-share.png` | Reexporta o SVG atualizado em 1200 × 630 e confere visualmente todas as linhas. |
| `tests/seo.test.ts` | Verifica identidade, JSON-LD, dimensões e caminhos das imagens, todos os quadros ICO, ausência das alegações removidas, presença de texto no PNG e, quando solicitado, respostas HTTP reais. |
| `docs/seo-review-2026-11-04.md` | Registra diagnóstico, evidências, fontes e limites da validação. |

O ícone existente `public/brand-icon.png` e seu SVG permanecem iguais. Nenhuma foto pessoal foi utilizada. O nome alternativo já existente, “Ozonteck Recife — Rogério André”, foi preservado; não foram inventadas outras marcas ou um domínio de produção. A serialização segura do JSON-LD foi mantida.

## Orientações oficiais do Google

Fontes consultadas em 04/11/2026:

- [Nome do site no Google Search](https://developers.google.com/search/docs/appearance/site-names): recomenda nome conciso e consistente na página inicial; `WebSite` com `name` e `url` é o principal sinal de preferência. `alternateName` é opcional. O nome é definido por domínio ou subdomínio, não por subdiretório. O título de uma página é um elemento diferente do nome do site.
- [Favicon nos resultados](https://developers.google.com/search/docs/appearance/favicon-in-search): requer ícone quadrado, de pelo menos 8 × 8 pixels, e recomenda resolução superior a 48 × 48. A página inicial e o ícone precisam estar acessíveis aos respectivos rastreadores. O endereço do ícone deve ser estável e a imagem deve representar a marca.

O ICO e o PNG agora representam a mesma marca. A versão de 192 × 192 satisfaz a recomendação de resolução. A implementação expressa uma preferência: o Google decide a apresentação e não garante a exibição do nome ou do ícone. Após publicação, pode levar dias ou semanas para rastrear e processar a mudança.

## Validação

- Antes das correções: os testes reproduziram três falhas — títulos divergentes, favicon inicial e alegações não verificadas nos metadados.
- Testes de SEO locais: seis verificações passaram; a verificação HTTP é opcional e fica explicitamente ignorada sem `SEO_TEST_BASE_URL`.
- **Validação final no servidor de produção local: sete testes de SEO aprovados, zero falhas e nenhuma verificação ignorada.** Conferidos HTML da página inicial com um único `WebSite`, nome consistente, links de ícone emitidos pelo Next.js, recursos de marca respondendo 200 com conteúdo de imagem, bytes iguais aos arquivos finais, texto presente no PNG e `robots.txt` permitindo acesso. O servidor de verificação foi encerrado após os testes.
- Última execução completa de `npm test`: **88 testes passaram, zero falhas, um teste HTTP opcional ignorado**, em 89 testes. Outras alterações surgiram simultaneamente no checkout durante esta revisão; foram preservadas, o que explica a contagem maior que a primeira execução de 87 testes.
- ESLint dirigido a `app/layout.tsx` e `tests/seo.test.ts`: execução final concluída sem erros. `git diff --check` dirigido aos arquivos textuais de SEO também passou.
- Build padrão: a execução com acesso restrito à rede falhou ao buscar Inter em `fonts.googleapis.com`, usada previamente pelo projeto. A execução com acesso à rede falhou internamente no Turbopack ao iniciar o processo de transformação de `app/sobre_cliente/badge.module.css` (`node process exited before we could connect to it with exit code: 0`). Não foram alterados CSS, fontes ou configuração para contornar essas falhas.
- **Build alternativo aprovado:** `node node_modules/next/dist/bin/next build --webpack` terminou com código 0, incluindo TypeScript e geração de todas as páginas. Isso não transforma a falha do build padrão com Turbopack em aprovação; são verificações distintas.
- Conferência visual: favicon anterior identificado como Vercel; marca existente preservada; prévia PNG final legível e sem foto. A conversão com Sharp omitiu texto neste ambiente; a exportação final usou Edge headless com o SVG local e fontes do Windows. O teste das cinco linhas protege contra esse problema de renderização.

Comandos reproduzíveis, a partir da raiz do projeto:

```powershell
npm test
node node_modules/eslint/bin/eslint.js app/layout.tsx tests/seo.test.ts
npm run build
# Alternativa validada após a falha interna do Turbopack:
node node_modules/next/dist/bin/next build --webpack

# Em outra janela, com o servidor local em execução:
$env:SEO_TEST_BASE_URL = 'http://127.0.0.1:3011'
node --env-file=.env --test --experimental-strip-types tests/seo.test.ts
```

O teste HTTP não autentica usuários, cria pedidos ou grava dados de negócio. Os avisos do Node sobre remoção experimental de tipos e ausência de `type: module` já decorrem da forma de execução da suíte; `package.json` foi preservado.

## Limites e acompanhamento após publicação

Esta revisão verifica os arquivos e o servidor local. Não comprova implantação, rastreamento público, indexação, posição ou aparência atual dos resultados do Google.

Na publicação, `NEXT_PUBLIC_SITE_URL` precisa conter a URL pública correta da página inicial, preferencialmente HTTPS na raiz do domínio ou subdomínio. O helper existente usa localhost quando a configuração está ausente ou inválida; não foi alterado neste escopo. Não se deve confundir esse fallback local com um endereço de produção verificado.

Após publicar, conferir o HTML público, `/favicon.ico`, `/brand-icon.png`, `/brand-share.png`, `robots.txt`, redirecionamentos e eventuais cabeçalhos da hospedagem. Validar o JSON-LD no [Schema Markup Validator](https://validator.schema.org/) e solicitar novo rastreamento da página inicial pela inspeção de URL do Search Console, se houver acesso. O Rich Results Test não valida o recurso de nome do site. Nenhuma dessas etapas externas foi executada ou declarada concluída nesta revisão.
