import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesAccountOrderFilter } from '../lib/confirmed-sale.ts';

test('customer confirmed tabs require the same financial approval as sales reports', () => {
  for (const status of ['preparando', 'enviado', 'entregue']) {
    assert.equal(matchesAccountOrderFilter({ status, status_pagamento: 'approved' }, 'Todos'), true);
    assert.equal(matchesAccountOrderFilter({ status, status_pagamento: 'approved' }, status), true);
    for (const payment of ['pending', 'refunded', null]) {
      assert.equal(matchesAccountOrderFilter({ status, status_pagamento: payment }, 'Todos'), false);
      assert.equal(matchesAccountOrderFilter({ status, status_pagamento: payment }, status), false);
    }
  }
});

test('customer can still recover open payments and all terminal or legacy history', () => {
  for (const status of ['pending', 'aguardando_pagamento', 'in_process', 'authorized', 'falha_pagamento', 'pagamento_recusado']) {
    const order = { status, status_pagamento: 'pending' };
    assert.equal(matchesAccountOrderFilter(order, 'pagamentos'), true);
    assert.equal(matchesAccountOrderFilter(order, 'Todos'), false);
    assert.equal(matchesAccountOrderFilter(order, 'historico'), true);
  }
  for (const status of ['reserva_expirada', 'cancelado', 'reembolsado', 'revisao_pagamento', 'revisao_estoque', 'entregue']) {
    const order = { status, status_pagamento: 'pending' };
    assert.equal(matchesAccountOrderFilter(order, 'Todos'), false);
    assert.equal(matchesAccountOrderFilter(order, 'pagamentos'), false);
    assert.equal(matchesAccountOrderFilter(order, 'historico'), true);
  }
});
