import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesAuditFilter } from '../lib/confirmed-sale.ts';
test('confirmed audit view matches the financial reports and retains review/history access', () => {
  const paid={status:'preparando',status_pagamento:'approved'};
  const legacy={status:'entregue',status_pagamento:'pending'};
  const expired={status:'reserva_expirada',status_pagamento:'pending'};
  assert.equal(matchesAuditFilter(paid,'Todos'),true);
  assert.equal(matchesAuditFilter(legacy,'Todos'),false);
  assert.equal(matchesAuditFilter(expired,'Todos'),false);
  assert.equal(matchesAuditFilter(legacy,'revisao'),true);
  assert.equal(matchesAuditFilter(expired,'historico'),true);
  assert.equal(matchesAuditFilter(legacy,'entregue'),true);
});
