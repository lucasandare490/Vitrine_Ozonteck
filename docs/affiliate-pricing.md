# Precos de afiliados - 2026-10-09

## Regras implementadas

- Visitantes e contas sem beneficio usam `produtos.price`, preservado integralmente.
- Aprovacao manual em Administrador > Clientes > Beneficio e precos. Nenhuma aprovacao automatica, exigencia de compra minima ou expiracao mensal.
- O cadastro da loja nao confirma cadastro na Ozonteck. O administrador verifica essa condicao antes de aprovar. Afiliados de outras equipes tambem sao elegiveis, sempre com ativacao manual.
- Tabela padrao em `/admin/precos`, acessivel pela carteira de clientes.
- Preco efetivo: conta aprovada + excecao individual, senao tabela de afiliados, senao preco comum. Conta desativada sempre usa preco comum, mesmo mantendo excecoes salvas.
- Excecoes sao valores fixos em reais por produto e cliente; a remocao retorna ao padrao. Valores nao sao calculados por porcentagem.
- Pedidos existentes preservam seus valores. Desativar beneficio nao altera compras anteriores.

## Fonte dos valores

`202610090002_affiliate_price_source.sql` transcreve os precos das 12 imagens enviadas pelo usuario. Cruza codigos existentes e nao excluidos; nao cria produtos. Perfumes comuns de 17 ml: R$15,00; quatro especiais: R$18,00. NXCAP: R$79,96. Nao foi aplicada a proposta anterior de R$29,90.

Resultado na instalacao do projeto `tnqdecfmpkmnihpctumo`: 103 precos, zero aprovacoes. Os seis produtos WO3 (PRO-AMR, PRO-CIF, PRO-DEEP, PRO-HMS, PRO-LPC, PRO-SOFT) nao tem desconto, conforme confirmacao do usuario: usam preco comum, sem pendencia de tabela. O relatorio de instalacao tambem enumera quatro registros internos de teste, sem tabela de afiliados.

## Seguranca

- Aprovacao, tabela de afiliados e excecoes ficam em tabelas separadas do perfil editavel pelo cliente.
- RLS ativada; tabelas sem permissoes diretas para anon/authenticated, inclusive administrador. Mutacoes somente por RPC com verificacao de `is_admin()` e MFA existente.
- Cada alteracao administrativa registra autor, data, valor anterior e novo em `pricing_audit`.
- Consulta publica usa somente `auth.uid()` do token validado pelo Supabase; nao aceita ID de outro cliente. Resolver que aceita ID e reservado ao servidor.
- Checkout verifica o token e MFA, ignora precos do navegador, recalcula pelo banco e compara o total exibido. Divergencia interrompe antes de iniciar pagamento.
- Reserva usa uma verificacao adicional no banco, serializada com alteracoes de beneficio/preco, preservando a reserva de estoque existente.
- Erro na consulta de precos bloqueia pagamento, sem reutilizar silenciosamente preco persistido em carrinho.
- Segredos de servico permanecem no servidor. Nao existe garantia absoluta de seguranca; os controles e testes descritos cobrem este fluxo.

## Banco

Instaladas as migracoes `202610090001_affiliate_pricing.sql` e `202610090002_affiliate_price_source.sql`. Nao e necessario o usuario executar SQL novamente neste projeto. Relatorio: `affiliate-pricing-installation.json`.

A instalacao verificou pre-requisitos de MFA, protecao de role e reserva privada; comparou contagem e hash de produtos, perfis e pedidos antes/depois na mesma transacao. Nao mudou esses registros. Para outro ambiente, aplicar as migracoes na ordem, depois das migracoes anteriores do repositorio. Publicar o codigo junto com esse banco atualizado.

## Verificacao

- TypeScript e lint dos arquivos alterados.
- 56 testes unitarios existentes.
- Testes SQL isolados em PGlite: permissao anon/cliente, autoaprovacao, precos personalizados, consulta de outro usuario, MFA, validacao monetaria, aprovacao/revogacao, exclusao de excecao, historico e reaplicacao sem sobrescrever ajustes.
- API real: `my_store_prices` retorna preco comum; anon nao acessa `admin_pricing`, `resolve_customer_prices` ou `affiliate_access`.
- Teste de navegador passou em 320, 390 e 1440 px: aprovacao, excecao e remocao, tabela padrao, precos em favoritos/catalogo/carrinho e revogacao. Usa dados simulados, nunca pagamentos nem aprovacoes reais.

Nao foram testados pagamentos reais. Integracao de comissoes, cadastro automatico na Ozonteck e frete Correios estao fora desta alteracao.

### Revalidacao em 2026-10-10

Testes SQL isolados e TypeScript passaram novamente. O servidor local foi reiniciado em http://localhost:3002 com Webpack. A repeticao dos testes visuais nao concluiu: primeiro houve timeout de compilacao; na tentativa seguinte a pagina respondeu HTTP 200, mas o checkbox de aprovacao nao apareceu dentro de 30 segundos. A causa desse segundo timeout nao foi determinada. Os passes visuais acima pertencem a rodada anterior; nao considerar a repeticao atual aprovada. Nenhuma nova alteracao remota ou aprovacao real foi feita nesta retomada.

### Conclusao da retomada

A rodada seguinte passou em 320, 390 e 1440 px, incluindo detalhe de produto, aprovacao e revogacao. O timeout anterior nao se reproduziu; sua causa exata permanece indeterminada. WO3 agora aparece como "Sem desconto; preco comum", fora das pendencias de tabela. O preco comum continua sendo consultado dinamicamente, sem copiar um valor que poderia ficar desatualizado.

`node scripts/test-affiliate-checkout.cjs` executa o POST real transpilado com dependencias simuladas e sem rede: aprovado/pendente/em analise, visitante, conta comum, afiliado, WO3 sem desconto, total adulterado, outra identidade, revogacao entre consulta/reserva e erro de consulta. Confere que falhas interrompem antes de chamar o pagamento. Isso nao substitui uma homologacao completa com o provedor de pagamentos e webhook.
