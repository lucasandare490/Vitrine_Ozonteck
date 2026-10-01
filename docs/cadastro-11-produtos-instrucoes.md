# Cadastro dos 11 produtos e fotos

ATUALIZACAO: por solicitacao do responsavel em 30/09/2026, Toque Luminoso
e Energetico Xbooster 269 ml foram bloqueados para novas vendas no projeto.
Executar manualmente `supabase/manual/20260930_retirar_toque_luminoso_energetico.sql`
para marcar ambos como retirados no banco. Nao apagar registros nem fotos.
Xbooster em capsulas permanece disponivel. A lista de 11 abaixo documenta o cadastro
original; apenas 9 deste lote permanecem destinados a venda. Nao repetir o cadastro.

## Arquivo a executar

SQL completo: `supabase/manual/20260929_cadastrar_11_produtos.sql`.
Foi atualizado em 30/09/2026 e substitui a versao resumida anterior do MESMO arquivo.
Abra o arquivo e execute seu conteudo integral no SQL Editor do projeto correto,
depois de guardar um backup. Nao execute todas as migrations para cadastrar produtos.
O assistente nao executou este SQL no Supabase.

O diagnostico enviado pelo responsavel foi conferido, inclusive os produtos retirados.
Os 11 nao constam nele; VG Sexy 17 ml, VG Sexy 100 ml e Hidratante VG Sexy 120 g
ja existem e nao sao incluidos. Tampouco entram locoes antigas ou acessorios.
Esse resultado representa a data da captura; cadastros posteriores precisam ser considerados.
O registro de teste com nome generico `asdasd` nao permite inferir outra identidade;
nao foi convertido, apagado ou tratado como produto oficial.

## O que sera cadastrado

| Nome | Codigo interno | Codigo original | EAN | Preco R$ | Arquivo da foto |
| --- | --- | --- | --- | ---: | --- |
| Amyno Ozon Caixa | NUT-AMYNO-CX | IMP-189 | Nao informado | 299,90 | amynoozoncaixa.webp |
| Amyno Ozon Unidade | NUT-AMYNO-UN | IMP-197 | Nao informado | 10,00 | amynoozonunidade.webp |
| Ozon Power Unidade | NUT-POWER-UN | IMP-49 | Nao informado | 10,00 | ozonpowerunidade.webp |
| Ozon Munity Unidade | NUT-MUNITY-UN | IMP-48 | Nao informado | 10,00 | ozonmunityunidade.webp |
| Sérum Facial Lumino3 | BE-SER-LUM | 40566 | 7898760210585 | 175,90 | serumfaciallumino3.webp |
| Condicionador Ozon-Kesen | CAP-CO-KES | 40548 | 7898996428235 | 109,90 | condicionadorozonkesen.webp |
| Pro Kesen | CAP-PRO-KES | 40544 | 7898760210097 | 499,90 | prokesen.webp |
| Ativador Master Curls | CAP-AT-MC | 40559 | 7898996428228 | 119,90 | ativadormastercurls.webp |
| Condicionador Mel & Ozônio | CAP-CO-MEL | 40551 | 7898996428266 | 109,90 | condicionadormelozonio.webp |
| Toque Luminoso | BE-TOQUE-LUM | IMP-206 | Nao informado | 565,60 | toqueluminoso.webp |
| Energético Xbooster 269 ml | BE-XBOOST-269 | IMP-99 | Nao informado | 27,80 | energeticoxbooster269ml.webp |

Estoque inicial: 9999, conforme regra anterior, somente para os novos itens.
Nomes com acentos e grafia comercial ficam preservados no SQL. Amyno e a grafia
confirmada nas capturas, apesar de o texto original escrever "amnyo".
Caixa e unidade sao registros separados; o energetico nao e o Xbooster em capsulas.

## Como as fotos funcionam

1. Coloque as fotos corretas em `C:\Vitrine_Ozonteck-main\public\produtos`, com os nomes exatos da tabela.
2. Os arquivos precisam ser realmente WebP. Mudar apenas a extensao de JPG/PNG nao converte a imagem.
3. O SQL ja define `image_url` como `/produtos/NOME.webp`. Nao incluir `public` nesse endereco.
4. Publique tambem os arquivos no servidor/hospedagem do site. Salvar no computador
   nao atualiza automaticamente o site publicado. Recarregue a pagina apos disponibiliza-los.

Exemplo: `public/produtos/prokesen.webp` corresponde a `/produtos/prokesen.webp`.
Nao existe reconhecimento automatico do nome do produto nem busca automatica na pasta:
o campo `image_url` precisa corresponder ao arquivo. Se escolher outra extensao/nome,
o endereco no cadastro tambem precisa mudar. Nenhuma foto foi baixada, inventada ou
substituida por captura de tela. Os 11 arquivos ainda precisam ser fornecidos.
Sem imagem disponivel, o cartao mostra o icone padrao e a ficha mostra imagem indisponivel.

Arquivos que usam o endereco: `app/page.tsx`, `components/ProductCard.tsx`,
`lib/server/products.ts` e `components/ProductGallery.tsx`.
O painel administrativo tambem admite imagem enviada ao Storage; nesse caso,
o endereco do Storage em `image_url` substitui a necessidade do arquivo local.

## Conteudo e armazenamento

- Supabase: nome, codigo interno, categoria, preco, estoque, caminho da foto e descricao.
  O texto armazenado inclui apresentacao, ativos/componentes, modo de uso e precaucoes quando informados.
- Projeto: `lib/product-registration.ts` concentra os dados aprovados deste lote.
  `lib/product-official-codes.ts` associa codigo original/EAN ao SKU e ao JSON-LD.
  `lib/product-research.ts` e `lib/product-specs.ts` organizam descricao, especificacoes,
  modo de uso e precaucoes na ficha, seguindo a arquitetura anterior.
- Nao foram criadas colunas novas no Supabase. Codigo original e EAN NAO substituem
  `produtos.code`; permanecem no projeto e na tabela de correspondencia do SQL.
- Amyno caixa/unidade vieram com apenas ponto: sem descricao inventada. Toque Luminoso
  e energetico vieram apenas por imagem: sem inventar ingredientes ou conteudo do kit.
- Textos completos originais, dimensoes e pesos recebidos estao preservados em
  `docs/product-registration-evidence.json`, ligados a cada produto. Peso do catalogo
  nao foi convertido em conteudo liquido. Exemplos que exigem confirmacao: caixa Amyno
  com 1 g e Pro Kesen com 1963 g. Esses dados nao foram usados no frete.
- Alegacoes terapeuticas, emagrecimento, protecao contra infeccoes, garantias de eficacia
  e a afirmacao regulatoria antiga RDC 240/18 nao foram publicadas como fatos comprovados.

## Precisa alterar a lista de produtos?

Nao. A Home e as paginas individuais consultam `public.produtos`. Depois de executar
o SQL e publicar a versao atualizada do projeto, os novos produtos ficam disponiveis
sem adicionar onze cartoes manualmente. A ficha usa a rota existente `/produto/CODIGO`.
Precos e estoque continuam vindo do banco, nao da lista editorial TypeScript.

## Protecoes e limites

Transacao unica; em erro, nao prosseguir e informar a mensagem. Nao altera produtos
existentes, nao os reativa, nao muda seus precos/estoque/imagens nem seus codigos.
Reexecutar o arquivo nao duplica o mesmo SKU. Colisao de nome com outro codigo ou
de codigo com outro nome/categoria interrompe o lote. Nomes alternativos ainda exigem
analise humana. Categoria ausente e preco invalido tambem interrompem o cadastro.
Se a versao anterior ja foi executada, este SQL NAO complementa os registros existentes:
e necessario um UPDATE especifico, apos conferir os dados, para nao sobrescrever edicoes.

## Validacao

TypeScript e 30 testes de conteudo/codigos aprovados. Home com os 11 produtos simulados
validada em 1440, 390 e 320 px, sem overflow horizontal ou excecoes do navegador.
Resultado em `docs/product-registration-browser.json`. SQL testado somente em banco local
descartavel: insercao, reexecucao, duplicidade, preservacao de dados e precos invalidos.
A confirmacao final das novas rotas no banco real depende da execucao manual do cadastro;
sem essa execucao elas ainda nao existem no catalogo real. Nao houve SQL remoto.
