import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalesReport, reportCsv, saleDate, type ReportOrder } from '../lib/sales-report.ts';

const order = (changes: Partial<ReportOrder> = {}): ReportOrder => ({ id: '1', user_id: 'a', status: 'preparando', valor_total: 9.99, created_at: '2026-10-30T02:00:00Z', endereco_entrega: { nome: 'Cliente' }, itens: [{ code: 'A', nome: 'Produto', qtd: 2 }], ...changes });
test('reports only confirmed sales within Recife calendar dates', () => {
  const report = buildSalesReport([order(), order({ id: '2', status: 'aguardando_pagamento' }), order({ id: '3', status: 'cancelado' }), order({ id: '4', created_at: '2026-10-30T04:00:00Z' })], '2026-10-29', '2026-10-29');
  assert.equal(report.total, 9.99);
  assert.equal(report.orders.length, 1);
  assert.equal(saleDate('2026-10-30T02:00:00Z'), '2026-10-29');
});
test('aggregates cents and quantities and keeps same-name customers separate', () => {
  const report = buildSalesReport([order(), order({ id: '2', valor_total: 0.1 }), order({ id: '3', user_id: 'b', valor_total: 0.2 })], '2026-10-01', '2026-10-31');
  assert.equal(report.total, 10.29);
  assert.equal(report.returning, 1);
  assert.equal(report.customers.length, 2);
  assert.equal(report.products[0].quantity, 6);
});
test('empty reports do not create invalid averages and CSV neutralizes spreadsheet formulas', () => {
  assert.equal(buildSalesReport([], '', '9999').average, 0);
  assert.match(reportCsv([order({ endereco_entrega: { nome: '=HYPERLINK("evil")' } })]), /'\=HYPERLINK/);
});
