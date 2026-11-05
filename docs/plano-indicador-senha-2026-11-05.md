# Indicador informativo de senha — 05/11/2026

Pedido: mostrar a força estimada enquanto a pessoa digita no cadastro, sem exigir uma classificação mínima nem novas regras de composição.

Decisão: componente compartilhado nas duas entradas de cadastro (`app/login/page.tsx`, `components/LoginModal.tsx`), barra de quatro segmentos e texto Fraca/Razoável/Boa/Forte. Vazio não mostra resultado. A estimativa é local e não envia a senha a serviço, log ou armazenamento. O indicador não determina validade, não bloqueia envio e não altera o mínimo de oito caracteres já existente no projeto. Não prometer invulnerabilidade; explicitar estimativa e caráter orientativo. Preferir comprimento e evitar elevar sequências, repetições e senhas comuns somente por incluírem símbolos. Não impor checklist obrigatório.

Plano:
- [x] Teste de avaliação informativa: vazio, repetições/sequências, senhas comuns, frases longas, unicode, ausência de mutação/alteração das regras de validação.
- [x] Função pura em `lib/password-strength.ts`; componente `components/PasswordStrength.tsx` sem estado ou efeito externo.
- [x] Integrar somente no cadastro, com `aria-describedby`, nomes acessíveis dos campos e sem alterar handlers de submissão.
- [x] Testar localmente, compilar e conferir no Chrome com exemplos fictícios, sem criar conta nem alterar credencial.
- [ ] Publicar e conferir versão pública; registrar junto da retomada de suporte/fila/caixa.

Continuidade paralela: protocolo técnico na própria conta autorizada de Lucas; destinatário confirmado vem do Auth, sem criar cobrança ou enviar a cliente comercial. Acompanhar o worker agendado, comprovar mensagem na caixa e concluir protocolo. Acesso e dados específicos foram autorizados em 05/11 nesta mensagem do titular.

Revisão: detectada repetição de blocos maiores que quatro caracteres; teste novo falhou antes e passou após ampliar a detecção. Suíte 145 aprovados/zero falhas/um HTTP condicional ignorado; componentes 24/24, build passou. Prévia real do cadastro completo em desktop/celular e modal do carrinho confirmada sem submeter cadastro; dados fictícios e carrinho local foram limpos.
