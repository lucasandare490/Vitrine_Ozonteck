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

## Suporte ponta a ponta comprovado — 05/11/2026, 13h13 de Recife

Após autorização específica do titular para usar sua própria conta e caixa de entrada, o formulário público criou o protocolo técnico (identificador omitido no repositório público). A administração respondeu e resolveu; a conta cliente exibiu a resposta após recarga. Os dois eventos seguiram a fila e o worker realmente agendado, sem acionamento manual e sem destinatário arbitrário:

- `support_received`: criado às 12:48:03, enviado às 12:50:18, uma tentativa e nenhum erro.
- `support_updated`: criado às 12:58:44, enviado às 13:00:17, uma tentativa e nenhum erro.

Ambos foram abertos no Gmail do titular e continham a mesma referência e link correto para `/suporte`. **A primeira mensagem foi classificada como spam**. Foi marcada como legítima nessa caixa; só depois apareceu na entrada. A segunda chegou diretamente à entrada após essa classificação. Isso comprova entrega desses dois eventos e não garante ausência de spam em outras caixas. Não foi criado filtro global nem desativada proteção do Gmail. Registro sanitizado em `support-delivery-verification-2026-11-05.json`. As três capturas do Gmail permanecem apenas no computador do titular; não são publicadas no Git.

Os demais eventos (boas-vindas, compra/pagamento, status, retirada) continuam com as provas locais anteriores; estes dois envios não os validam automaticamente. Nenhuma compra foi criada/alterada e nenhum cliente comercial recebeu mensagem de verificação.

## Recuperação de senha recebida no Gmail — 07/11/2026

O mesmo endpoint do Supabase Auth usado pelo formulário da loja aceitou um pedido de recuperação para a conta verificada e autorizada pelo titular. O Gmail registrou a mensagem na caixa de entrada às 18h36 de Recife, com assunto de recuperação em português, identidade Ozonteck Recife e remetente esperado. Os cabeçalhos registraram SPF, DKIM e DMARC como aprovados. A evidência foi conferida por metadados, sem abrir o link de recuperação, redefinir a senha ou reproduzir o link no repositório.

Esse resultado comprova a entrega de recuperação de senha via Supabase Auth. Boas-vindas, pagamentos e mudanças de pedido usam a fila agendada da Netlify e ainda precisam de confirmação individual em uma caixa autorizada.
