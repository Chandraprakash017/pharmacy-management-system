// Pure business logic: allocate requested units from earliest-expiring valid batches.
export function allocateFEFO(batches, requestedQty, today = new Date()) {
  if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
    throw new Error('Quantity must be a positive whole number');
  }

  const valid = batches
    .filter(b => new Date(b.expiryDate) >= startOfDay(today) && b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const available = valid.reduce((sum, b) => sum + b.quantity, 0);
  if (available < requestedQty) throw new Error('Insufficient non-expired stock');

  let remaining = requestedQty;
  const allocations = [];
  for (const batch of valid) {
    if (!remaining) break;
    const take = Math.min(batch.quantity, remaining);
    allocations.push({ batch, quantity: take });
    remaining -= take;
  }
  return allocations;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
