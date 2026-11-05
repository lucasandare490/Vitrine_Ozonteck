# Acabamento e validações finais — 05/11/2026

Pedido do titular: concluir todo trabalho possível, manter custo zero e identidade visual; não gerar cobranças reais nem fabricar dados históricos. Base publicada `5db3391`, documentação `86a68db`.

- [ ] Paginação compartilhada: controles legíveis, foco, estados desabilitados, celular e tema escuro em catálogo, conta, administração, suporte e avaliações. Preservar paginação no servidor e carregamento de cada lista.
- [ ] Pagamentos visuais: artes nítidas, proporções/legendas coerentes, identidade do Pix reutilizada e condições do cartão sem promessa de aprovação ou débito garantido.
- [ ] Selo Netlify: conferir opção na conta; em 05/11 o painel exige plano pago para ocultar. Não contratar nem contornar bloqueio de plano. Registrar dependência de custo, apesar da documentação consultada anteriormente indicar possibilidade gratuita.
- [ ] Débito: verificar elegibilidade sem cobrança produtiva; homologação atual retorna restrição da conta.
- [ ] Checkout/webhook/banco/estoque: usar homologação separada e evidenciar exatamente o alcance, sem substituir credenciais produtivas.
- [ ] E-mails: ensaio controlado de eventos disponíveis, fila/worker/caixa de entrada; não disparar a clientes reais.
- [ ] Escritas publicadas: endereço, CSV, interessados, lembretes e avisos de alteração; registros de verificação identificados, reversão quando segura e nenhuma venda real alterada.
- [ ] Histórico: investigar somente leitura e fontes/backup existentes; não inventar categorias nem conciliar pagamento sem prova.
- [ ] Google: não repetir solicitação bloqueada por cota no mesmo dia; conferir rastreamento e apresentação sem prometer resultado.
- [ ] Testar, publicar fontes uma vez, conferir versão efetiva e atualizar registros sem apagar histórico.

Decisões de acabamento: controles com bordas suaves, teal da marca, alvos de toque de pelo menos 44px e indicador compacto em telas pequenas. Usar o mesmo componente também nas listas com total desconhecido, sem inventar total. Logos preservam a arte original, com fontes oficiais registradas. Não trocar todo o layout da loja.

## Resultado deste ciclo — 05/11/2026

- CONCLUÍDO LOCAL: paginação/brands/título/rótulos; 140 testes, 24 componentes, lint e build. Revisão independente sem achados importantes. Capturas desktop/celular registradas.
- CONCLUÍDO PUBLICADO: endereço secundário+edição, interessado+conclusão, lembrete+concluir/reabrir e CSV+restauração. Relatório de banco sanitizado anexado.
- DEPENDÊNCIA EXTERNA: selo exige plano pago; manter custo zero. Débito exige liberação do coletor. Boleto exige compensação. Google exige nova leitura/cota. Recuperação histórica exige fonte anterior.
- IMPLEMENTADO, NÃO COMPROVADO INTEGRALMENTE: fila/eventos/inbox individuais, checkout sandbox completo com webhook externo, gravação de alteração de compra+aviso e seleção de endereços no checkout.
- BLOQUEIO DE ACESSO: Chrome desativado durante validação; login pessoal para suporte rejeitado pela revisão automática. Não contornar; continuar publicação via Git/HTTP.
- Ruling: preservar main e alterações locais existentes, com publicação direta já autorizada pelo titular; não criar projeto paralelo. Preservar documentos deste ciclo como histórico, sem excluir plano.
- Ruling: não contratar plano nem esconder recurso pago por injeção; o custo seria contrário à restrição explícita de gratuidade.
- Ruling: não forçar testes Orders na produção nem redirecionar e-mail da conta administrativa; isso quebraria o isolamento e a titularidade verificada.
- Final review: Parfit revisou diff e arquivos novos; sem achados importantes, 27 testes dirigidos aprovados.
