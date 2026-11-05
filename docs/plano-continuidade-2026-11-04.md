# Continuidade integral — 04/11/2026

Especificação: comando de continuidade do titular nesta conversa. Checkout mantido por confirmação explícita. Preservar identidade visual, dados históricos e serviços gratuitos; fiado/carnê excluídos, PWA futuro.

## Ordem e verificações

- [x] Recuperar revisão, Git e decisões; base observada 5f404a9, sem alterações rastreadas locais.
- [x] Suporte: protocolos persistentes por usuário, resposta administrativa, acesso com MFA, fila deduplicada, testes de isolamento e transições.
- [x] Retirada: ação administrativa explícita, pagamento aprovado e modalidade retirada; estado visível ao cliente; e-mail suprimido quando obsoleto.
- [x] Categorias: trilha futura de alterações com autor, valores anteriores e novos; preservar registros existentes.
- [x] Google: revisar favicon/metadados, validar páginas publicadas e registrar dependência de rastreamento.
- [ ] Pagamentos: rever testes e recursos de homologação separados da produção, CVV e callbacks públicos.
- [ ] Referências: completar comparação das funcionalidades aplicáveis e implementar lacunas persistentes.
- [ ] Executar testes unitários e SQL, lint, compilação, conferir banco e publicação; revisar permissões e falhas.
- [ ] Atualizar revisão final com evidências e dependências reais; não equiparar código, publicação e comprovação externa.

## Critérios de revisão

Nenhum cliente pode acessar protocolo alheio ou responder como administrador. Repetir envio não duplica protocolo/e-mail. Falhas não exibem sucesso. Retirada depende de ação real. Dados financeiros continuam dependentes de aprovação do provedor. Nenhuma validação pode disparar cobrança real ou e-mail a cliente real.

## Situação em 05/11/2026

As caixas acima registram o alcance definido, não aprovação bancária ou equivalência integral com as referências. Seis migrações instaladas; commit operacional `6d40ab9` publicado. Entrega SMTP real na caixa da loja comprovada; trabalhador agendado observado sem erros, mas o ciclo completo de cada evento remoto ainda não está comprovado. Captação, atualização de produtos por CSV e lembretes estão implementados com persistência e testes SQL; manter revisão visual separada.

Novas correções locais: filtro financeiro da auditoria, preservação de rascunhos no suporte, retorno seguro do login, descarte de listas antigas e formulário com Secure Fields para ajuda do CVV no foco. O CVV foi conferido nos campos reais do provedor em prévia local sem envio. Homologação no Mercado Pago foi expressamente adiada pelo titular em 05/11 por falta de acesso ao celular de validação. Google recusou a nova solicitação por cota; não houve nova indexação solicitada com sucesso.
