import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateFEFO } from '../src/utils/fefo.js';

const today = new Date('2026-11-10T12:00:00');
const batch = (batchNumber, quantity, days) => ({
  batchNumber, quantity,
  expiryDate: new Date(today.getTime() + days * 86400000)
});

test('FEFO allocates earliest expiry first and splits across batches', () => {
  const later = batch('B', 10, 30);
  const sooner = batch('A', 4, 5);
  const result = allocateFEFO([later, sooner], 7, today);
  assert.deepEqual(result.map(x => [x.batch.batchNumber, x.quantity]), [['A', 4], ['B', 3]]);
});

test('expired batches are excluded', () => {
  assert.throws(() => allocateFEFO([batch('OLD', 20, -1)], 1, today), /Insufficient/);
});

test('insufficient valid stock is rejected', () => {
  assert.throws(() => allocateFEFO([batch('A', 2, 10)], 3, today), /Insufficient/);
});

test('invalid quantities are rejected', () => {
  assert.throws(() => allocateFEFO([], 0, today), /positive whole number/);
});
