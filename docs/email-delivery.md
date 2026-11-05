# Notificações da loja

## Estado de implementação

SMTP de autenticação foi configurado no painel Supabase; confirmação de cadastro e recuperação de senha receberam identidade visual em português. Isso é independente da função de envio de pedidos abaixo. Entrega real ainda precisa ser conferida.

Em 03/11/2026, os sete avisos de segurança foram conferidos após recarregar o painel: senha, e-mail, telefone, vínculo e remoção de método de acesso, inclusão e remoção de MFA estão habilitados. Os modelos de convite, link de acesso, troca de e-mail e reautenticação também receberam identidade em português, preservando os campos gerados pelo Supabase. Essa conferência comprova configuração salva, não recebimento na caixa de entrada.

A fila e a função SQL de reserva foram instaladas no banco em 01/11/2026. As credenciais SMTP foram salvas como configurações da Netlify, com a senha disponível somente no contexto de produção. A função `customer-emails` foi publicada no deploy `6ae7941778aa9cff94a79d63` (commit `a1da1a2`), com agendamento a cada cinco minutos e `CUSTOMER_EMAIL_ENABLED=true`. A execução manual da fila vazia terminou sem erro e a autenticação SMTP foi aceita pelo Gmail. A entrega de uma mensagem na caixa de entrada ainda não foi conferida.

## Ativação

1. Aplicar `202611010001_customer_email_outbox.sql` após as migrations de pedidos e alterações.
2. Configurar `SMTP_USER` e `SMTP_APP_PASSWORD` sem prefixo `NEXT_PUBLIC_`. A senha deve ser marcada como secreta e definida somente para produção. O plano atual não permite restringir individualmente o escopo Functions; a interface mantém Builds, Functions e Runtime. Nunca registrar valores no Git ou em logs.
3. Manter as variáveis existentes de Supabase e URL pública disponíveis para Functions.
4. Publicar e conferir a função agendada; habilitar `CUSTOMER_EMAIL_ENABLED=true` somente após a configuração.
5. Conferir uma entrega autorizada, o registro `sent` e a chegada na caixa de entrada. Aceite SMTP sozinho não prova entrega na caixa de entrada.

## Comportamento

- Um item por execução, a cada cinco minutos. Nenhum envio de pedidos históricos na instalação.
- Boas-vindas após confirmação do e-mail, cobrança pendente criada, aprovação, recusa, alteração vinculada, envio, entrega, cancelamento e reembolso confirmado.
- Reembolso depende do estado financeiro confirmado; não há mensagem automática de retirada pronta ou suporte sem um evento real correspondente.
- Só usa o e-mail confirmado da conta dona do pedido. Não aceita destinatários arbitrários do navegador.
- Eventos repetidos têm chave única. Leituras concorrentes reservam itens distintos; reservas abandonadas expiram.
- Até cinco tentativas com intervalo crescente. Mensagens ultrapassadas pelo estado atual são descartadas.
- SMTP não oferece garantia de envio exatamente uma vez: uma queda após aceite e antes de gravar pode exigir revisão. O identificador da mensagem é estável, mas não garante deduplicação pelo destinatário.
- Falha do trabalhador de e-mail não reverte pagamento ou pedido. Erros de configuração não devem ser silenciados na operação.
- Limite conservador de 100 registros tentados/enviados nas últimas 24 horas. Não é a cota oficial do Gmail e não inclui os envios do Supabase Auth.

## Verificação local

`node scripts/check-email-outbox.mjs` verifica os gatilhos SQL, confirmação final, deduplicação, reservas e limite de tentativas em banco temporário local. Não cria pagamentos nem altera o Supabase remoto.

`node --test --experimental-strip-types tests/customer-email*.test.ts` verifica conteúdo, escape de HTML, links restritos à loja, supressão de mensagens obsoletas e repetição limitada.

Fiado e carnê estão excluídos do projeto por decisão do usuário. PWA continua reservado para o futuro.

## Incrementos de 04/11/2026

Instalados os eventos reais de suporte recebido/respondido e retirada pronta. Suporte exige protocolo persistente e destinatário da conta verificada. Retirada exige ação explícita do administrador em pedido pago elegível; aprovação sozinha não aciona o aviso. O worker descarta retirada que perdeu elegibilidade. Consulte `202611040003_pickup_ready.sql` e `202611040004_support_tickets.sql`.

As credenciais locais SMTP não estão disponíveis nesta sessão. Não houve novo envio nem prova de caixa de entrada em 04/11 nesta continuação. As tabelas foram instaladas sem gerar mensagens para compras históricas; fila remota permaneceu vazia na conferência.

## Atualização comprovada em 04–05/11/2026

O parágrafo anterior descreve o momento anterior à reconexão. Às 22:10 de 04/11 (Recife), uma mensagem única de verificação foi recebida e aberta em `ozonteckrecife2@gmail.com`, com o renderizador real, remetente da loja e link de suporte. Evidência: `evidencias/email-recebido-2026-11-04.png`. Nenhum cliente recebeu mensagem de teste e nenhuma compra fictícia foi criada.

Na madrugada de 05/11, o painel Netlify confirmou a função `customer-emails` em produção, agendada a cada cinco minutos; registros até 00:40 mostraram execuções sem erro. A fila estava vazia na consulta anterior. Isso comprova o agendamento, mas ainda não comprova um protocolo real percorrendo gatilho, fila, trabalhador, confirmação `sent` e caixa de entrada. O teste direto SMTP e o teste do trabalhador não devem ser apresentados como essa mesma evidência.

`tests/customer-email-worker.test.ts` executa o trabalhador real com adaptadores locais e cobre seis cenários: destinatário verificado e dono, protocolo de terceiro, retirada elegível/obsoleta, tentativa após falha, quinta falha, aceite SMTP com confirmação incerta e desativação. Não há rede nesses testes. `npm run test:components` cobre preservação de rascunhos, troca de conta e respostas atrasadas nas telas de suporte e administração.
