# Preparação para a próxima publicação — 27/11/2026

> Atualização de escopo em 28/11/2026: o relatório [Mobile, PWA e UX](mobile-pwa-ux-2026-11-28.md) complementa esta preparação. A quantidade provisória **9999 permanece autorizada e não impede o lançamento**; a orientação histórica do item 8 sobre substituí-la antes das vendas foi superada pela decisão explícita do usuário. PWA passou a ser escopo atual e foi implementado. A pesquisa formal de usabilidade ficará para depois do lançamento. Os resultados antigos abaixo são históricos, não os totais da nova execução.

## Correções implementadas nesta etapa

### Tabela geral de preços

Foi reproduzido um falso retorno de sucesso: a gravação era aceita, a consulta posterior falhava e a tela terminava com “Alteração salva”, sem tabela conferida. Também foi reproduzida a duplicação da chamada ao clicar duas vezes antes de uma nova renderização.

`components/AdminPricing.tsx` agora bloqueia gravações concorrentes, mantém campos bloqueados até a releitura e distingue valor salvo de tabela não confirmada. Uma consulta desconectada oferece **Conferir novamente**. Falhas de gravação são seguidas por leitura, pois uma resposta perdida não prova que o banco deixou de gravar. Respostas após sair da tela são ignoradas. O RPC continua alterando somente a tabela geral; nenhum valor comercial foi alterado para testar.

Seis regressões do componente real foram adicionadas a `scripts/check-admin-pricing.mjs`. Os testes falharam antes da correção e passaram depois. São testes de estado em memória, não prova de interação em navegador.

### Endereços salvos

Foi reproduzido o erro PostgreSQL `23505` ao tornar principal um endereço que vinha antes do endereço atual na ordem física dos registros. O `UPDATE` anterior tentava trocar todos os indicadores em uma instrução e podia colidir transitoriamente com o índice único parcial.

`202611270001_primary_address_switch.sql` preserva assinatura e acessos existentes, serializa chamadas do mesmo titular, valida e bloqueia o endereço solicitado e separa a desmarcação anterior da marcação nova, dentro da transação. Não cria ou exclui endereços. A validação local cobre 22 verificações: conflito anterior, reaplicação, preservação de proprietário/ACL no ambiente local, alternância nos dois sentidos, repetição, edição, remoção, unicidade, rejeição de registro de terceiro/inexistente e autenticação. O PGlite não certifica concorrência entre conexões PostgreSQL de produção.

A consulta remota confirmou a definição antiga, o índice e o histórico de migrações. Foi salva uma cópia privada da função anterior fora do repositório. A migração foi aplicada pelo executor transacional autorizado e a leitura posterior confirmou o corpo e o checksum instalados. Os acessos efetivos consultados para `anon` e `authenticated` permaneceram iguais; o corpo exige usuário autenticado e dono do endereço. Não houve leitura nem modificação de endereços de clientes. Evidência: `prepublicacao-endereco-migration-2026-11-27.json`.

A tela `app/conta/enderecos/page.tsx` agora distingue falha de consulta de lista vazia, oferece recuperação, trata desconexões de remoção/troca, impede ações duplicadas, confere o titular na exclusão e relê o estado após gravações incertas. Uma resposta que chega depois da navegação não modifica a tela. Busca de CEP tem limite de espera e permite preenchimento manual. Alvos de tornar principal/remover têm pelo menos 44 px. Cinco testes de componente cobrem recuperação, dupla ação, filtros de titular, releitura e desmontagem. A revisão visual no navegador continua separada.

## Verificação repetível antes da publicação

```sh
npm run verify:release
```

O comando executa suíte principal, 43 testes de componentes, 12 roteiros SQL com bancos descartáveis, lint do código desta etapa e compilação webpack/TypeScript. `npm run test:integration` executa somente os 12 roteiros SQL. Os roteiros não migram banco remoto, não acionam provedores de pagamento e não enviam e-mail. A compilação pode consultar recursos de leitura usados pelo Next; não é um teste de operação comercial.

Os logs e `result.json` ficam por padrão em uma pasta datada em `tmp/`. Pode-se escolher uma pasta interna:

```sh
npm run verify:release -- --output docs/prepublicacao-verificacao-2026-11-27
```

O resultado registra revisão de origem, presença de alterações locais, hashes dos arquivos principais e status/saída de cada etapa. Qualquer falha retorna código de saída não zero. **`productionReady` permanece falso**: passar localmente não certifica publicação, navegador, provedor ou configuração remota. O teste HTTP de SEO é executado separadamente; seu parâmetro é removido da execução local para evitar misturar as provas.

O comando padrão `npm run build` foi alinhado a `next build --webpack`, o compilador efetivamente validado. O padrão anterior usava a escolha automática/Turbopack, cuja execução local já tinha apresentado falha em etapas históricas. Isso evita que o comando padrão escolha uma compilação diferente da preparada; não afirma uma falha atual do Turbopack em todas as plataformas. Conferir que a hospedagem usa `npm run build` ou comando equivalente com `--webpack`. Os testes TypeScript com remoção de tipos exigem uma versão de Node compatível com `--experimental-strip-types`, como a usada nesta verificação local.

Na execução desta etapa passaram **149 testes principais, com um HTTP condicional ignorado; 43 testes de componentes; os 12 roteiros SQL; lint dirigido e compilação**. Evidências: `prepublicacao-verificacao-2026-11-27/result.json` e logs associados. A conferência pública de SEO anterior desta mesma data passou em sete verificações e não foi apresentada como prova do código novo.

O lint terminou com zero erros e um aviso sobre o contador de CEP na limpeza do efeito. O incremento usa propositalmente o contador atual para invalidar respostas pendentes, não uma referência a nó DOM; o aviso foi preservado no log. A revisão visual e a interação com o serviço externo de CEP não foram certificadas pelo teste de estado em memória.

## Ordem para publicar e validar

1. Recuperar acesso à conta Netlify e conferir saldo e configuração atuais. Não contratar plano nem mudar credenciais antigas automaticamente. Confirmar a branch/revisão escolhida e as variáveis privadas no ambiente correto. Os commits de preparação usam `[skip ci]`; é necessário iniciar a publicação autorizada quando houver disponibilidade.
2. Conferir o histórico de migrações do banco alvo. A migração de endereço desta etapa já está instalada no banco atual; em outro banco, usar o executor e verificar a definição depois. Não reaplicar cegamente migrações históricas nem alterar seus checksums.
3. Executar `npm run verify:release` e corrigir qualquer falha. Não tratar a criação de `.next` local como publicação.
4. Publicar a revisão escolhida e confirmar o commit/build no painel. Conferir páginas públicas, login e retorno de autenticação, itens/estoque do catálogo e acesso administrativo com MFA.
5. Executar `scripts/check-orders-webhook-deployment.mjs` com o arquivo privado do ambiente alvo: a assinatura inválida deve receber 401; a canônica deve alcançar a rejeição do tipo fictício com 400. A sonda não faz consulta ao provedor nem grava pedido. Não confundir isso com entrega de um webhook real.
6. Concluir o percurso de cada meio no ambiente de teste: checkout → provedor → notificação pública → banco/estoque → telas → fila/função agendada → caixa autorizada. Não cobrar clientes ou compensar boleto real para simular teste. Um estado financeiro não pode ser fabricado no banco como prova de confirmação do provedor.
7. Conferir em navegador desktop/celular, teclado e temas: carteira/benefício, tabela geral, cadastro/edição/seleção de endereços, importação confirmada, interessados, lembretes e alteração de compra/aviso administrativo. Usar somente contas/dados de verificação autorizados; não mudar benefícios nem registros de clientes reais para testar.
8. Antes de abrir vendas, o responsável substitui o estoque provisório pela quantidade real e confirma a tabela e os novos itens. Atualização do Google é uma etapa externa; registrar solicitação/status sem garantir título, descrição ou imagem exatos.

## Pendências que não podem ser preenchidas por suposição

| Dependência | Situação / limite |
| --- | --- |
| Chrome e revisão visual | A nova tentativa nesta etapa retornou acesso local indisponível. Sem prova final dos fluxos visuais ou gravações autenticadas publicadas. |
| Netlify e selo | Última leitura autenticada indicava deploys pausados por créditos e remoção do selo condicionada ao plano. Não houve nova publicação, contratação ou nova consulta autenticada de saldo nesta etapa. |
| Débito e boleto | Restrição do coletor em homologação e compensação do boleto permanecem sem resolução externa. Não foram criadas cobranças reais. |
| E-mails publicados | Os nove avisos chegaram ao Gmail em verificação com banco isolado; suporte/boas-vindas/recuperação têm suas evidências anteriores. A cadeia pública da nova versão continua sem comprovação integral. |
| Catálogo | Sete apresentações adicionais aguardam confirmação comercial. Visaris: 590 mg resolvidos; verso, fabricante e documentação ainda necessários. Não foi ativado por inferência. |
| Preços | Decisão global comum/consultor e duas divergências de perfumes aguardam esclarecimento. Só Visaris tem autorização específica de R$ 89,95 para ambos. |
| Estoque | Quantidade provisória já autorizada para desenvolvimento. O responsável atualizará antes das vendas; não se supõe sincronização com o centro de distribuição. |
| Google / histórico | Releitura e apresentação do resultado dependem do Google; oito pedidos antigos e categorias anteriores exigem comprovantes/backup que não foram encontrados. |

## Reversão e manutenção

As mudanças da interface podem ser revertidas por commit, mantendo os dados. Para reverter a função SQL, preparar uma **nova** migração a partir da cópia privada anterior, em transação e preservando os acessos; registrar a reversão, sem apagar o histórico de instalação. O corpo antigo reintroduz o conflito de troca de principal e não deve ser restaurado como procedimento normal.

Nenhuma parte desta etapa transfere vendas ao escritório oficial, promete pontos/comissões ou troca a tabela de preços. Fiado/carnê seguem fora do escopo e PWA continua reservado para depois.
