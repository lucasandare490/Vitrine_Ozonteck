# Benefício na carteira e clareza das ações

Atualização de 27/11/2026, solicitada por Lucas: simplificar a autorização de preços de consultor, retirar a edição por pessoa da interface e facilitar o uso do administrador por seu pai.

## Implementado no projeto

- Cada cartão em `/admin/clientes` possui o controle **Preço de consultor**, com estado ativo/inativo, ação de ativar/desativar e explicação expansível **Como funciona o benefício?**. A confirmação identifica a pessoa e informa que os pedidos anteriores são preservados.
- A lista de produtos e os campos de preço individual deixaram a interface do cliente. A rota antiga `/admin/clientes/[id]/precos` continua válida, mas mostra apenas o controle e sua explicação, evitando quebrar links antigos.
- `/admin/precos` permanece como **Tabela geral de preços de consultor**: uma definição por produto compartilhada pelos clientes autorizados. A navegação deixa claro que a tabela geral é distinta da aprovação de uma pessoa.
- Não foram alterados valores de produto, benefício de cliente ou cálculo do checkout durante o desenvolvimento. A consulta agregada de produção encontrou **zero preços individuais cadastrados** na conferência. Nenhuma condição foi apagada. As estruturas e funções antigas do banco foram preservadas para compatibilidade.
- O controle usa as funções administrativas já existentes: `admin_pricing` para leitura e `admin_set_pricing` com ação `access` para gravar. Não é necessária migração, chave nova ou ampliação de permissões. A operação de autorização continua protegida e auditada pelo banco.
- A consulta ocorre para os cartões montados na página, limitada pela paginação compartilhada de 12 itens; não são feitas consultas de benefício para cada cliente de todas as páginas. A função de leitura existente ainda retorna a tabela de produtos, embora o cartão use somente o estado do benefício. Isso preserva compatibilidade com o banco atual; uma consulta menor poderá ser considerada em futura otimização autorizada.
- Falha de leitura não é tratada como benefício inativo: o estado é exibido como não confirmado e o botão fica desabilitado. Após salvar, inclusive após falha de conexão, o controle consulta novamente o estado persistido. Cliques repetidos não duplicam a solicitação; respostas antigas e conclusões após desmontagem não atualizam a tela.

## Ajustes de leitura e navegação

- Nome, contato, endereço e histórico dos cartões ficaram mais legíveis. Nome e e-mail podem quebrar linha; pesquisa possui rótulo acessível e texto em português brasileiro.
- Menu do administrador, retorno à vitrine, tema e saída receberam alvos de interação maiores. A ordem e os destinos da navegação foram preservados.
- Campos administrativos de texto, seleção e mensagem usam tamanho de leitura de 16 px e altura mínima de 44 px. O novo botão de benefício tem altura mínima de 48 px.
- Os sublinhados comuns de ações foram substituídos por dois padrões: `action-link`, com contorno e fundo, e `inline-link`, para links dentro de textos. Foram ajustados carteira, categorias, relatórios, pedidos, suporte, catálogo, favoritos, rodapé, produtos e páginas de apresentação/cadastro.
- Os dois padrões incluem foco visível, estados de interação e tema escuro. As opções explícitas de acessibilidade que sublinham links no modo de leitura ou de cores foram preservadas; a alteração é do visual padrão, não a retirada dessas preferências.
- Não houve reformulação da identidade da loja ou remoção de histórico, filtros, paginação, contatos, relatórios ou recursos de acessibilidade. Esta etapa não equivale a uma certificação integral de acessibilidade ou avaliação com o pai do usuário.

## Verificações

- Suíte principal: **149 aprovados, zero falhas, um teste HTTP condicional ignorado**, em `test-results-beneficios-2026-11-27.log`.
- Componentes: **32 aprovados**, incluindo sete casos do novo controle, em `component-results-beneficios-2026-11-27.log`. Foram exercitados leitura indisponível, confirmação/cancelamento, ativação, desativação, falha de gravação, concorrência de leituras e término após desmontagem.
- Integração SQL em banco descartável PGlite: permissões, MFA, aprovação/revogação, resolução de preços, rejeição de valor alterado e auditoria passaram. O teste de condições individuais legadas permanece como proteção de compatibilidade do banco, embora sua edição tenha saído da interface. Resultado em `sql-results-beneficios-2026-11-27.log`.
- Os roteiros históricos de navegador foram atualizados para os novos nomes e controles; **não foram executados** nesta etapa. A atualização do roteiro não é evidência de uma interação visual realizada.
- Compilação webpack/TypeScript e lint dirigido: resultados nos arquivos `build-results-beneficios-2026-11-27.log` e `lint-results-beneficios-2026-11-27.log`. A primeira compilação encontrou EPERM ao criar arquivos gerados em `.next`; foi repetida com permissão para a compilação local. A revisão de whitespace também foi corrigida, preservando as demais linhas dos arquivos.

## Conferência visual e publicação

O login autorizado na prévia local funcionou e a primeira leitura da nova carteira mostrou o cabeçalho, a explicação e a pesquisa atualizados. A ferramenta de controle do navegador ficou indisponível antes de concluir a leitura dos cartões, o teste em celular, a conferência de foco e as capturas finais. Esses pontos continuam **pendentes de validação visual**, sem alegação de revisão completa ou screenshot final.

Não houve publicação desta etapa. Na última leitura autenticada da Netlify, em 27/11/2026, novos deploys estavam pausados por créditos e o site público seguia no commit anterior. Não foi contratado plano nem assumida renovação/publicação automática. A solução está preparada no projeto para publicar quando o ambiente permitir.

## Revisão automática e alternativa adotada

Uma proposta inicial incluía uma função administrativa pequena para consultar somente o estado do benefício. A revisão automática rejeitou até a tentativa de plano de execução, interpretando que ela alteraria acesso/permissões em produção. A proposta de migração foi retirada e não foi aplicada. O código final reutiliza exclusivamente as funções existentes; não contorna o bloqueio e não depende de autorização adicional para alterar permissões.

## Manutenção e próximos passos

1. Publicar o commit preparado quando a Netlify permitir e confirmar o identificador efetivamente publicado.
2. Conferir a carteira, detalhes, confirmação e tabela geral no desktop e em 320/390 px, com teclado e tema escuro. Validar dados lidos sem alterar benefício de clientes reais para testar.
3. Se for necessário testar uma gravação no ambiente publicado, usar uma conta de verificação explicitamente autorizada e registrar/restaurar o estado anterior.
4. Confirmar com o responsável a política comercial antes de atualizar a tabela de valores. Esta melhoria não sincroniza preços, estoque ou comissões com o escritório oficial.
5. Para reverter a interface, reverter o commit deste incremento. Não existe migração de banco a desfazer.

As pendências anteriores de pagamento, e-mail, Google, publicação, catálogo e histórico permanecem descritas na revisão principal e não foram encerradas por esta alteração de usabilidade.
